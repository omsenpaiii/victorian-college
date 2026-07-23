import { getSupabaseAdmin } from "@/lib/supabase";

export type PaymentPurpose = "course_enrollment" | "assignment_unlock";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export type PaymentIntentRecord = {
  id: string;
  provider: string;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  user_key: string;
  email: string | null;
  course_slug: string;
  assignment_key: string | null;
  enrollment_id: string | null;
  amount_cents: number;
  currency: string;
  provider_payer_id: string | null;
  provider_payment_link_id: string | null;
  provider_payment_id: string | null;
  checkout_url: string | null;
  metadata: Record<string, unknown> | null;
};

export async function createPaymentIntent(input: {
  provider: string;
  purpose: PaymentPurpose;
  status?: PaymentStatus;
  userKey: string;
  email?: string | null;
  courseSlug: string;
  assignmentKey?: string | null;
  enrollmentId?: string | null;
  amountCents: number;
  currency?: string;
  providerPayerId?: string | null;
  providerPaymentLinkId?: string | null;
  checkoutUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("payment_intents")
    .insert({
      provider: input.provider,
      purpose: input.purpose,
      status: input.status ?? "pending",
      user_key: input.userKey,
      email: input.email ?? null,
      course_slug: input.courseSlug,
      assignment_key: input.assignmentKey ?? null,
      enrollment_id: input.enrollmentId ?? null,
      amount_cents: input.amountCents,
      currency: input.currency ?? "AUD",
      provider_payer_id: input.providerPayerId ?? null,
      provider_payment_link_id: input.providerPaymentLinkId ?? null,
      checkout_url: input.checkoutUrl ?? null,
      metadata: input.metadata ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentIntentRecord;
}

export async function getPaymentIntentByProviderReference(input: {
  provider: string;
  paymentLinkId?: string | null;
  paymentId?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  let query = supabase.from("payment_intents").select("*").eq("provider", input.provider);

  if (input.paymentId) {
    query = query.eq("provider_payment_id", input.paymentId);
  } else if (input.paymentLinkId) {
    query = query.eq("provider_payment_link_id", input.paymentLinkId);
  } else {
    return null;
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PaymentIntentRecord | null;
}

export async function getPaymentIntentByStripeSession(sessionId: string | null | undefined) {
  if (!sessionId) return null;

  return getPaymentIntentByProviderReference({
    provider: "stripe",
    paymentLinkId: sessionId,
  });
}

export async function markPaymentIntent(input: {
  id: string;
  status: PaymentStatus;
  providerPaymentId?: string | null;
  providerStatus?: string | null;
  rawEvent?: Record<string, unknown> | null;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const values: Record<string, unknown> = {
    status: input.status,
    provider_status: input.providerStatus ?? null,
    raw_event: input.rawEvent ?? null,
    updated_at: new Date().toISOString(),
  };

  if (input.providerPaymentId) {
    values.provider_payment_id = input.providerPaymentId;
  }

  if (input.status === "paid") {
    values.paid_at = new Date().toISOString();
  }

  const { error } = await supabase.from("payment_intents").update(values).eq("id", input.id);

  if (error) {
    throw new Error(error.message);
  }
}
