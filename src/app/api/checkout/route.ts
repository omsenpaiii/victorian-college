import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isCourseAvailableForEnrollment } from "@/lib/courses";
import { getCourse } from "@/lib/course-repository";
import {
  getEnrollmentLead,
  updateEnrollmentCheckoutSession,
} from "@/lib/enrollment";
import {
  buildCourseWorkflowLlnUrl,
  hasPassedCourseWorkflowLln,
} from "@/lib/lln";
import { createPaymentIntent } from "@/lib/payments";
import { createStripeCheckoutSession, getStripeUserMessage, isStripeConfigured } from "@/lib/stripe";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

const checkoutSchema = z.object({
  courseSlug: z.string().min(1),
  enrollmentId: z.string().uuid().optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe payments are not configured yet." },
        { status: 503 },
      );
    }

    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { error: "Supabase Auth is not configured yet." },
        { status: 503 },
      );
    }

    const user = await getCurrentUser();
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const body = checkoutSchema.safeParse(payload);

    if (!body.success) {
      return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
    }

    const course = await getCourse(body.data.courseSlug);

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    if (!isCourseAvailableForEnrollment(course)) {
      return NextResponse.json(
        { error: "This course is not open for online enrollment yet." },
        { status: 400 },
      );
    }

    if (!user) {
      const signInReturnTo = course.requiresLln && !body.data.enrollmentId
        ? buildCourseWorkflowLlnUrl(`/course/${course.slug}`, "buy", null, course.slug)
        : `/enroll?course=${course.slug}`;

      return NextResponse.json(
        {
          error: "Please sign in before continuing to secure checkout.",
          signInUrl: `/sign-in?redirect_url=${encodeURIComponent(signInReturnTo)}`,
        },
        { status: 401 },
      );
    }

    const enrollment = body.data.enrollmentId
      ? await getEnrollmentLead(body.data.enrollmentId)
      : null;

    if (body.data.enrollmentId && !enrollment) {
      return NextResponse.json({ error: "Enrollment not found." }, { status: 404 });
    }

    if (enrollment && enrollment.course_slug !== course.slug) {
      return NextResponse.json(
        { error: "Enrollment does not match selected course." },
        { status: 400 },
      );
    }

    if (enrollment?.payment_status === "paid") {
      return NextResponse.json(
        { error: "This enrollment has already been paid." },
        { status: 409 },
      );
    }

    if (course.requiresLln) {
      const hasPassedLln = await hasPassedCourseWorkflowLln(user.id, course.slug, course.llnTestKey);

      if (!hasPassedLln) {
        const returnTo = body.data.enrollmentId ? `/enroll?course=${course.slug}` : `/course/${course.slug}`;
        const mode = body.data.enrollmentId ? "continue" : "buy";

        return NextResponse.json(
          {
            error: "Please complete the course LLN prerequisite before payment.",
            llnRequired: true,
            llnUrl: buildCourseWorkflowLlnUrl(returnTo, mode, null, course.slug),
          },
          { status: 403 },
        );
      }
    }

    const email = enrollment?.email ?? user.email;
    const amountCents = Math.round(course.priceAud * 100);
    const metadata = {
      userKey: user?.id ?? "",
      courseSlug: course.slug,
      enrollmentId: enrollment?.id ?? "",
      purpose: "course_enrollment",
    };

    const session = await createStripeCheckoutSession({
      amountCents,
      name: course.title,
      description: course.overview,
      customerEmail: email,
      successPath: `/success?course=${course.slug}`,
      cancelPath: `/enroll?course=${course.slug}`,
      metadata,
    });

    await createPaymentIntent({
      provider: "stripe",
      purpose: "course_enrollment",
      status: "pending",
      userKey: user.id,
      email,
      courseSlug: course.slug,
      enrollmentId: enrollment?.id ?? null,
      amountCents,
      currency: "AUD",
      providerPayerId: typeof session.customer === "string" ? session.customer : null,
      providerPaymentLinkId: session.id,
      checkoutUrl: session.url,
      metadata,
    });

    if (enrollment?.id && session.id) {
      await updateEnrollmentCheckoutSession({
        enrollmentId: enrollment.id,
        stripeSessionId: session.id,
        provider: "stripe",
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = getStripeUserMessage(error);
    console.error("Course checkout failed", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
