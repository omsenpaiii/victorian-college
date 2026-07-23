import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getStudentCourseWorkflowAssignments } from "@/lib/course-workflow";
import { getCourse } from "@/lib/course-repository";
import { buildCourseWorkflowLlnUrl, hasPassedCourseWorkflowLln } from "@/lib/lln";
import { createPaymentIntent } from "@/lib/payments";
import { createStripeCheckoutSession, getStripeUserMessage, isStripeConfigured } from "@/lib/stripe";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

const checkoutSchema = z.object({
  assignmentKey: z.string().min(1).optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ courseSlug: string }> }) {
  try {
    const { courseSlug } = await params;
    const course = await getCourse(courseSlug);
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { error: "Supabase Auth is not configured yet." },
        { status: 503 },
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe payments are not configured yet." },
        { status: 503 },
      );
    }

    const amountCents = course.assessmentUnlockAmountCents || null;

    if (!amountCents) {
      return NextResponse.json(
        { error: "Assignment payments are not configured yet." },
        { status: 503 },
      );
    }

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please sign in before continuing to payment.",
          signInUrl: `/sign-in?redirect_url=/dashboard/course/${courseSlug}`,
        },
        { status: 401 },
      );
    }

    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const body = checkoutSchema.safeParse(payload);

    if (!body.success) {
      return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
    }

    const hasPassedLln = !course.requiresLln || await hasPassedCourseWorkflowLln(user.id, courseSlug, course.llnTestKey);

    if (!hasPassedLln) {
      const returnTo = `/dashboard/course/${courseSlug}?tab=activities`;

      return NextResponse.json(
        {
          error: "Please complete the course LLN prerequisite before unlocking assessments.",
          llnRequired: true,
          llnUrl: buildCourseWorkflowLlnUrl(returnTo, "unlock", body.data.assignmentKey ?? "all_locked", courseSlug),
        },
        { status: 403 },
      );
    }

    const assignments = await getStudentCourseWorkflowAssignments(user.id, courseSlug);
    const lockedAssignments = assignments.filter((assignment) => !assignment.unlocked);

    if (lockedAssignments.length === 0) {
      return NextResponse.json(
        { error: "All course assignments are already unlocked." },
        { status: 409 },
      );
    }

    const metadata = {
      userKey: user.id,
      courseSlug,
      assignmentKey: body.data.assignmentKey ?? "all_locked",
      purpose: "assignment_unlock",
    };
    const session = await createStripeCheckoutSession({
      amountCents,
      name: `${course.title} assessment unlock`,
      description: "Unlock all remaining course assessments.",
      customerEmail: user.email,
      successPath: `/success?course=${courseSlug}`,
      cancelPath: `/dashboard/course/${courseSlug}?tab=activities`,
      metadata,
    });

    await createPaymentIntent({
      provider: "stripe",
      purpose: "assignment_unlock",
      userKey: user.id,
      email: user.email,
      courseSlug,
      assignmentKey: body.data.assignmentKey ?? "all_locked",
      amountCents,
      currency: "AUD",
      providerPayerId: typeof session.customer === "string" ? session.customer : null,
      providerPaymentLinkId: session.id,
      checkoutUrl: session.url,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = getStripeUserMessage(error);
    console.error("Assignment checkout failed", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
