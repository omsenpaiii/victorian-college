import type Stripe from "stripe";
import { grantCourseAccess } from "@/lib/access";
import { COURSE_WORKFLOW_COURSE_SLUG, setStudentAssignmentAccess } from "@/lib/course-workflow";
import { updateEnrollmentPaymentStatus } from "@/lib/enrollment";
import { getPaymentIntentByStripeSession, markPaymentIntent, type PaymentIntentRecord } from "@/lib/payments";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

function getSessionId(session: Stripe.Checkout.Session) {
  return session.id;
}

function getPaymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id ?? null;
}

function getCustomerId(session: Stripe.Checkout.Session) {
  return typeof session.customer === "string"
    ? session.customer
    : session.customer?.id ?? null;
}

async function findStripePaymentIntent(session: Stripe.Checkout.Session) {
  const bySession = await getPaymentIntentByStripeSession(getSessionId(session));

  if (bySession) return bySession;

  const metadata = session.metadata;
  const supabase = getSupabaseAdmin();

  if (!supabase || !metadata?.userKey || !metadata.courseSlug || !metadata.purpose) {
    return null;
  }

  let query = supabase
    .from("payment_intents")
    .select("*")
    .eq("provider", "stripe")
    .eq("status", "pending")
    .eq("user_key", metadata.userKey)
    .eq("course_slug", metadata.courseSlug)
    .eq("purpose", metadata.purpose);

  if (metadata.enrollmentId) {
    query = query.eq("enrollment_id", metadata.enrollmentId);
  }

  if (metadata.assignmentKey) {
    query = query.eq("assignment_key", metadata.assignmentKey);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentIntentRecord | null;
}

async function unlockCourseWorkflowAssignments(intent: PaymentIntentRecord) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: lockedAssignments, error } = await supabase
    .from("student_assignment_access")
    .select("assignment_key")
    .eq("user_key", intent.user_key)
    .eq("course_slug", COURSE_WORKFLOW_COURSE_SLUG)
    .eq("unlocked", false);

  if (error) {
    throw new Error(error.message);
  }

  await Promise.all(
    (lockedAssignments ?? []).map((assignment) =>
      setStudentAssignmentAccess({
        userKey: intent.user_key,
        assignmentKey: assignment.assignment_key,
        unlocked: true,
        adminEmail: "stripe-payment",
      }),
    ),
  );
}

async function fulfillPaidIntent(intent: PaymentIntentRecord, session: Stripe.Checkout.Session) {
  const sessionId = getSessionId(session);
  const paymentIntentId = getPaymentIntentId(session);

  if (intent.enrollment_id) {
    await updateEnrollmentPaymentStatus({
      enrollmentId: intent.enrollment_id,
      paymentStatus: "paid",
      stripeSessionId: sessionId,
      provider: "stripe",
      providerPaymentId: paymentIntentId,
    });
  }

  if (intent.purpose === "course_enrollment") {
    const supabase = getSupabaseAdmin();
    const { data: enrollmentLead } = intent.enrollment_id && supabase
      ? await supabase
          .from("enrollment_leads")
          .select("first_name,last_name,phone,date_of_birth,usi,address,disability_status,disability_details,referred_by")
          .eq("id", intent.enrollment_id)
          .maybeSingle()
      : { data: null };
    await grantCourseAccess({
      userKey: intent.user_key,
      courseSlug: intent.course_slug,
      stripeCustomerId: getCustomerId(session),
      stripeSessionId: sessionId,
      paymentProvider: "stripe",
      providerPaymentId: paymentIntentId,
      amountPaid: session.amount_total ?? intent.amount_cents,
      currency: session.currency ?? intent.currency,
      email: session.customer_details?.email ?? intent.email,
      profile: enrollmentLead ? {
        firstName: enrollmentLead.first_name,
        lastName: enrollmentLead.last_name,
        phone: enrollmentLead.phone,
        dob: enrollmentLead.date_of_birth,
        usi: enrollmentLead.usi,
        address: enrollmentLead.address,
        disabilityStatus: enrollmentLead.disability_status,
        disabilityDetails: enrollmentLead.disability_details,
        referredBy: enrollmentLead.referred_by,
      } : null,
    });
  }

  if (intent.purpose === "assignment_unlock" && intent.course_slug === COURSE_WORKFLOW_COURSE_SLUG) {
    await unlockCourseWorkflowAssignments(intent);
  }
}

export async function fulfillStripeCheckoutSession(input: {
  session: Stripe.Checkout.Session;
  rawEvent?: Record<string, unknown> | null;
}) {
  const intent = await findStripePaymentIntent(input.session);

  if (!intent) {
    return { fulfilled: false, reason: "payment_intent_not_found", session: input.session };
  }

  const paymentIntentId = getPaymentIntentId(input.session);

  if (input.session.payment_status !== "paid") {
    await markPaymentIntent({
      id: intent.id,
      status: "pending",
      providerPaymentId: paymentIntentId,
      providerStatus: input.session.payment_status,
      rawEvent: input.rawEvent ?? null,
    });

    return { fulfilled: false, reason: "payment_not_paid", session: input.session, intent };
  }

  await markPaymentIntent({
    id: intent.id,
    status: "paid",
    providerPaymentId: paymentIntentId,
    providerStatus: input.session.payment_status,
    rawEvent: input.rawEvent ?? null,
  });
  await fulfillPaidIntent(intent, input.session);

  return { fulfilled: true, session: input.session, intent };
}

export async function cancelStripeCheckoutSession(input: {
  session: Stripe.Checkout.Session;
  rawEvent?: Record<string, unknown> | null;
}) {
  const intent = await findStripePaymentIntent(input.session);

  if (!intent) {
    return { cancelled: false, reason: "payment_intent_not_found", session: input.session };
  }

  await markPaymentIntent({
    id: intent.id,
    status: "cancelled",
    providerPaymentId: getPaymentIntentId(input.session),
    providerStatus: input.session.status ?? "expired",
    rawEvent: input.rawEvent ?? null,
  });

  if (intent.enrollment_id) {
    await updateEnrollmentPaymentStatus({
      enrollmentId: intent.enrollment_id,
      paymentStatus: "cancelled",
      stripeSessionId: input.session.id,
      provider: "stripe",
      providerPaymentId: getPaymentIntentId(input.session),
      onlyIfCurrentSession: true,
    });
  }

  return { cancelled: true, session: input.session };
}

export async function fulfillStripeCheckoutSessionId(sessionId: string) {
  const stripe = getStripe();

  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent", "customer"],
  });

  return fulfillStripeCheckoutSession({ session });
}
