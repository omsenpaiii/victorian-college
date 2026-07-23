import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PaymentSuccessRedirect } from "@/components/payment/PaymentSuccessRedirect";
import { COURSE_WORKFLOW_COURSE_SLUG } from "@/lib/course-workflow";
import { fulfillStripeCheckoutSessionId } from "@/lib/payment-fulfillment";
import type { PaymentIntentRecord, PaymentPurpose } from "@/lib/payments";
import type Stripe from "stripe";

type SuccessPageProps = {
  searchParams?: Promise<{
    session_id?: string;
    course?: string;
  }>;
};

type SuccessDetails = {
  destinationHref: string;
  ctaLabel: string;
  heading: string;
  message: string;
};

function getSafeCourseSlug(slug: string | null | undefined) {
  return slug && /^[a-z0-9-]+$/.test(slug) ? slug : null;
}

function getSuccessDetails(input: {
  fulfilled: boolean;
  intent?: PaymentIntentRecord | null;
  session?: Stripe.Checkout.Session | null;
  requestedCourse?: string | null;
}): SuccessDetails {
  const metadata = input.session?.metadata ?? {};
  const purpose = (input.intent?.purpose ?? metadata.purpose) as PaymentPurpose | undefined;
  const courseSlug = getSafeCourseSlug(
    input.intent?.course_slug ?? metadata.courseSlug ?? input.requestedCourse,
  );

  if ((purpose === "assignment_unlock" || !purpose) && courseSlug === COURSE_WORKFLOW_COURSE_SLUG) {
    return {
      destinationHref: `/dashboard/course/${COURSE_WORKFLOW_COURSE_SLUG}?tab=activities&unlocked=1`,
      ctaLabel: "Open unlocked course",
      heading: input.fulfilled ? "Course assessments unlocked" : "Payment received",
      message: input.fulfilled
        ? "Your payment has been confirmed. The remaining course assessments are ready in your course workspace."
        : "Stripe received your payment. Your COURSE_WORKFLOW access will update as soon as confirmation finishes.",
    };
  }

  if ((purpose === "course_enrollment" || !purpose) && courseSlug) {
    return {
      destinationHref: `/dashboard/course/${courseSlug}?unlocked=1`,
      ctaLabel: "Start course",
      heading: input.fulfilled ? "Course unlocked" : "Payment received",
      message: input.fulfilled
        ? "Your payment has been confirmed and your course workspace is ready."
        : "Stripe received your payment. Your course access will update as soon as confirmation finishes.",
    };
  }

  return {
    destinationHref: "/dashboard",
    ctaLabel: "Go to dashboard",
    heading: "Payment received",
    message: input.fulfilled
      ? "Your Stripe payment has been confirmed and access has been updated."
      : "Stripe will confirm the payment and unlock access in your student dashboard.",
  };
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params?.session_id;
  let fulfilled = false;
  let intent: PaymentIntentRecord | null = null;
  let session: Stripe.Checkout.Session | null = null;

  if (sessionId) {
    try {
      const result = await fulfillStripeCheckoutSessionId(sessionId);
      fulfilled = result.fulfilled;
      intent = result.intent ?? null;
      session = result.session;
    } catch {
      fulfilled = false;
    }
  }

  const details = getSuccessDetails({
    fulfilled,
    intent,
    session,
    requestedCourse: params?.course,
  });

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#eef8ff] px-5">
      <div className="absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_20%_20%,rgba(24,174,229,0.18),transparent_28%),radial-gradient(circle_at_82%_15%,rgba(15,110,184,0.16),transparent_26%),linear-gradient(rgba(15,110,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,110,184,0.08)_1px,transparent_1px)] [background-size:auto,auto,52px_52px,52px_52px]" />
      <PaymentSuccessRedirect
        href={details.destinationHref}
        enabled={fulfilled}
      />
      <div className="relative max-w-xl rounded-[24px] bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,74,143,0.12)]">
        <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={46} />
        <h1 className="text-4xl font-black text-[#020d24]">{details.heading}</h1>
        <p className="mt-4 font-bold leading-7 text-[#53647c]">
          {details.message}
        </p>
        <Link
          href={details.destinationHref}
          className="mt-7 inline-flex items-center gap-2 rounded-[8px] bg-[#0067b1] px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(15,110,184,0.2)]"
        >
          {details.ctaLabel}
          <ArrowRight size={16} />
        </Link>
        {fulfilled ? (
          <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#71869c]">
            Redirecting to your course workspace
          </p>
        ) : null}
      </div>
    </main>
  );
}
