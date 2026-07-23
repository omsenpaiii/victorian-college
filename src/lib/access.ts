import { getCourse } from "@/lib/courses";
import { getSupabaseAdmin } from "@/lib/supabase";

export type CourseAccess = {
  course_slug: string;
  status: "active" | "refunded" | "revoked";
  stripe_session_id: string | null;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
};

export async function getUserAccess(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("course_enrollments")
    .select("course_slug,status,stripe_session_id,amount_paid,currency,created_at")
    .eq("user_key", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CourseAccess[];
}

export async function userHasCourseAccess(userId: string, courseSlug: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("user_key", userId)
    .eq("course_slug", courseSlug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function grantCourseAccess(input: {
  userKey: string;
  courseSlug: string;
  stripeCustomerId?: string | null;
  stripeSessionId?: string | null;
  paymentProvider?: string | null;
  providerPaymentId?: string | null;
  amountPaid?: number | null;
  currency?: string | null;
  email?: string | null;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    dob?: string | null;
    usi?: string | null;
    address?: string | null;
    disabilityStatus?: string | null;
    disabilityDetails?: string | null;
    referredBy?: string | null;
  } | null;
}) {
  const supabase = getSupabaseAdmin();
  const course = getCourse(input.courseSlug);

  if (!course) {
    throw new Error(`Unknown course: ${input.courseSlug}`);
  }

  if (!supabase) {
    return { skipped: true };
  }

  const { error: profileError } = await supabase.from("student_profiles").upsert(
    {
      user_key: input.userKey,
      email: input.email,
      stripe_customer_id: input.stripeCustomerId,
      first_name: input.profile?.firstName ?? undefined,
      last_name: input.profile?.lastName ?? undefined,
      phone: input.profile?.phone ?? undefined,
      date_of_birth: input.profile?.dob ?? undefined,
      usi: input.profile?.usi?.toUpperCase() || undefined,
      residential_address: input.profile?.address ?? undefined,
      disability_status: input.profile?.disabilityStatus ?? undefined,
      disability_details: input.profile?.disabilityDetails ?? undefined,
      origin: "self_enrolled",
      referred_by: input.profile?.referredBy ?? undefined,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_key" },
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error } = await supabase.from("course_enrollments").upsert(
    {
      user_key: input.userKey,
      course_slug: input.courseSlug,
      status: "active",
      stripe_customer_id: input.stripeCustomerId,
      stripe_session_id: input.stripeSessionId,
      payment_provider: input.paymentProvider ?? "stripe",
      payment_session_id: input.stripeSessionId,
      provider_payment_id: input.providerPaymentId ?? null,
      amount_paid: input.amountPaid,
      currency: input.currency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_key,course_slug" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false };
}

export async function recordLessonProgress(input: {
  userKey: string;
  courseSlug: string;
  lessonId: string;
  progressSeconds: number;
  completed?: boolean;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { skipped: true };
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_key: input.userKey,
      course_slug: input.courseSlug,
      lesson_id: input.lessonId,
      progress_seconds: input.progressSeconds,
      completed: input.completed ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_key,course_slug,lesson_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false };
}
