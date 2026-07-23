import { z } from "zod";
import { isCourseAvailableForEnrollment } from "@/lib/courses";
import { getCourse } from "@/lib/course-repository";
import { getSupabaseAdmin } from "@/lib/supabase";

export const enrollmentSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().min(10, "Phone number is required"),
  dob: z.string().trim().min(1, "Date of birth is required"),
  usi: z
    .string()
    .trim()
    .min(10, "USI must be exactly 10 characters")
    .max(10, "USI must be exactly 10 characters"),
  address: z.string().trim().min(10, "Please provide your full address"),
  disabilityStatus: z
    .enum(["no", "yes", "prefer_not_to_say"])
    .default("no"),
  disabilityDetails: z.string().trim().max(1000, "Support details must be under 1000 characters").optional(),
  referredBy: z.string().trim().max(120, "Reference must be under 120 characters").optional(),
  courseId: z.string().trim().min(1, "Please select a course"),
  captchaToken: z.string().trim().min(1, "Please confirm you are not a robot"),
});

export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type EnrollmentLeadInput = Omit<EnrollmentInput, "captchaToken">;

export type EnrollmentLead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  usi: string;
  address: string;
  disability_status: "no" | "yes" | "prefer_not_to_say";
  disability_details: string | null;
  origin: "self_enrolled" | "admin" | "import";
  referred_by: string | null;
  course_slug: string;
  payment_status: "pending" | "paid" | "failed" | "cancelled";
  stripe_session_id: string | null;
  email_status: "pending" | "sent" | "failed";
  email_error: string | null;
  email_sent_at: string | null;
  created_at: string;
};

export type EnrollmentPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled";

const leadSelect =
  "id,first_name,last_name,email,phone,date_of_birth,usi,address,disability_status,disability_details,origin,referred_by,course_slug,payment_status,stripe_session_id,email_status,email_error,email_sent_at,created_at";

export async function createEnrollmentLead(input: EnrollmentLeadInput) {
  const course = await getCourse(input.courseId);

  if (!course) {
    throw new Error("Selected course was not found.");
  }

  if (!isCourseAvailableForEnrollment(course)) {
    throw new Error("Selected course is not open for enrollment yet.");
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured yet.");
  }

  const { data, error } = await supabase
    .from("enrollment_leads")
    .insert({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      date_of_birth: input.dob,
      usi: input.usi.toUpperCase(),
      address: input.address,
      disability_status: input.disabilityStatus ?? "no",
      disability_details:
        input.disabilityStatus === "yes" && input.disabilityDetails
          ? input.disabilityDetails
          : null,
      origin: "self_enrolled",
      referred_by: input.referredBy || null,
      course_slug: course.slug,
      payment_status: "pending",
      email_status: "pending",
    })
    .select(leadSelect)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as EnrollmentLead;
}

export async function updateEnrollmentEmailStatus(input: {
  enrollmentId: string;
  emailStatus: "sent" | "failed";
  emailError?: string | null;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { skipped: true };
  }

  const { error } = await supabase
    .from("enrollment_leads")
    .update({
      email_status: input.emailStatus,
      email_error: input.emailError?.slice(0, 1000) ?? null,
      email_sent_at:
        input.emailStatus === "sent" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.enrollmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false };
}

export async function getEnrollmentLead(id: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("enrollment_leads")
    .select(leadSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as EnrollmentLead | null;
}

export async function updateEnrollmentCheckoutSession(input: {
  enrollmentId: string;
  stripeSessionId: string;
  provider?: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { skipped: true };
  }

  const { error } = await supabase
    .from("enrollment_leads")
    .update({
      stripe_session_id: input.stripeSessionId,
      payment_provider: input.provider ?? "stripe",
      payment_session_id: input.stripeSessionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.enrollmentId);

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false };
}

export async function updateEnrollmentPaymentStatus(input: {
  enrollmentId: string;
  paymentStatus: EnrollmentPaymentStatus;
  stripeSessionId?: string | null;
  provider?: string;
  providerPaymentId?: string | null;
  onlyIfCurrentSession?: boolean;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { skipped: true };
  }

  const values: {
    payment_status: EnrollmentPaymentStatus;
    stripe_session_id?: string;
    payment_provider?: string;
    payment_session_id?: string;
    provider_payment_id?: string;
    updated_at: string;
  } = {
    payment_status: input.paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (input.stripeSessionId) {
    values.stripe_session_id = input.stripeSessionId;
    values.payment_session_id = input.stripeSessionId;
  }

  if (input.provider) {
    values.payment_provider = input.provider;
  }

  if (input.providerPaymentId) {
    values.provider_payment_id = input.providerPaymentId;
  }

  let query = supabase
    .from("enrollment_leads")
    .update(values)
    .eq("id", input.enrollmentId);

  if (input.paymentStatus !== "paid") {
    query = query.neq("payment_status", "paid");
  }

  if (input.onlyIfCurrentSession && input.stripeSessionId) {
    query = query.eq("stripe_session_id", input.stripeSessionId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return { skipped: false };
}
