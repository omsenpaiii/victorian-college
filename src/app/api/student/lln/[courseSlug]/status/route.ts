import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getLatestCourseWorkflowLlnAttempt } from "@/lib/lln";
import { getCourse } from "@/lib/course-repository";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  const course = await getCourse(courseSlug);
  if (!course?.requiresLln) return NextResponse.json({ error: "This course does not require an LLN check." }, { status: 404 });
  const attempt = await getLatestCourseWorkflowLlnAttempt(user.id, courseSlug, course.llnTestKey);

  return NextResponse.json({
    attempt,
    passed: attempt?.passed ?? false,
  });
}
