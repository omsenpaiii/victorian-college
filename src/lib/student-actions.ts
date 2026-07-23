"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { sendStudentFeedbackEmail } from "@/lib/email";
import { getSupabaseAdmin } from "@/lib/supabase";

export type StudentActionState = {
  error?: string;
  success?: string;
};

const initialProgressSeconds = 90;

const feedbackSchema = z.object({
  subject: z.string().trim().min(3, "Add a short subject."),
  category: z.string().trim().min(1, "Choose a feedback category."),
  message: z.string().trim().min(20, "Share a bit more detail so VCK can help."),
});

export async function updateStudentActivityProgress(input: {
  courseSlug: string;
  activityId: string;
  completed: boolean;
  progressSeconds?: number;
}) {
  const user = await getCurrentUser();
  const supabase = getSupabaseAdmin();

  if (!user || !supabase) {
    throw new Error("Student access is not available right now.");
  }

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_key: user.id,
      course_slug: input.courseSlug,
      lesson_id: input.activityId,
      progress_seconds: input.completed ? Math.max(input.progressSeconds ?? 0, initialProgressSeconds) : input.progressSeconds ?? initialProgressSeconds,
      completed: input.completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_key,course_slug,lesson_id" },
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/my-courses");
  revalidatePath("/dashboard/browse-courses");
  revalidatePath(`/dashboard/course/${input.courseSlug}`);
  revalidatePath(`/dashboard/course/${input.courseSlug}/activities/${input.activityId}`);
}

export async function submitStudentFeedback(
  _state: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const parsed = feedbackSchema.safeParse({
    subject: formData.get("subject"),
    category: formData.get("category"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unable to send feedback." };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { error: "Sign in again to send feedback." };
  }

  try {
    await sendStudentFeedbackEmail({
      userName: user.name,
      userEmail: user.email,
      subject: parsed.data.subject,
      category: parsed.data.category,
      message: parsed.data.message,
    });

    return { success: "Feedback sent. The VCK team will review it shortly." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to send feedback right now.",
    };
  }
}
