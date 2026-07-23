import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase";

export const interestSchema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(2, "Last name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().min(10, "Phone number is required"),
  courseSlug: z.string().trim().min(1, "Please select a course"),
  captchaToken: z.string().trim().min(1, "Please confirm you are not a robot"),
});

export type InterestInput = z.infer<typeof interestSchema>;
export type InterestLeadInput = Omit<InterestInput, "captchaToken">;

export type InterestLead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  course_slug: string;
  created_at: string;
  isMock?: boolean;
};

export async function createInterestLead(input: InterestLeadInput) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    // Graceful fallback for local development without Supabase keys
    return {
      id: "mock-" + Math.random().toString(36).substring(2, 9),
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      course_slug: input.courseSlug,
      created_at: new Date().toISOString(),
      isMock: true,
    };
  }

  const { data, error } = await supabase
    .from("interest_leads")
    .insert({
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone,
      course_slug: input.courseSlug,
    })
    .select("id,first_name,last_name,email,phone,course_slug,created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InterestLead;
}
