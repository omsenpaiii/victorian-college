import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCourse } from "@/lib/course-repository";
import {
  getLatestCourseWorkflowLlnAttempt,
  getPublicCourseWorkflowLlnQuestions,
  normalizeLlnReturnTo,
  normalizeCourseWorkflowLlnMode,
} from "@/lib/lln";
import { CourseWorkflowLlnTest } from "@/components/student/CourseWorkflowLlnTest";

type CourseWorkflowLlnPageProps = {
  params: Promise<{ courseSlug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CourseWorkflowLlnPage({ params: routeParams, searchParams }: CourseWorkflowLlnPageProps) {
  const { courseSlug } = await routeParams;
  const params = await searchParams;
  const returnToParam = Array.isArray(params?.returnTo) ? params?.returnTo[0] : params?.returnTo;
  const modeParam = Array.isArray(params?.mode) ? params?.mode[0] : params?.mode;
  const assignmentKeyParam = Array.isArray(params?.assignmentKey)
    ? params?.assignmentKey[0]
    : params?.assignmentKey;
  const returnTo = normalizeLlnReturnTo(returnToParam);
  const mode = normalizeCourseWorkflowLlnMode(modeParam);
  const user = await getCurrentUser();

  if (!user) {
    const query = new URLSearchParams({ returnTo });

    if (mode !== "continue") {
      query.set("mode", mode);
    }

    if (assignmentKeyParam) {
      query.set("assignmentKey", assignmentKeyParam);
    }

    redirect(`/sign-in?redirect_url=${encodeURIComponent(`/dashboard/lln/${courseSlug}?${query.toString()}`)}`);
  }

  const course = await getCourse(courseSlug);
  if (!course?.requiresLln) redirect(`/dashboard/course/${courseSlug}`);
  const latestAttempt = await getLatestCourseWorkflowLlnAttempt(user.id, courseSlug, course.llnTestKey);
  const buyAmountCents = Math.round((course.priceAud ?? 0) * 100);
  const unlockAmountCents = course.assessmentUnlockAmountCents ?? 0;

  return (
    <CourseWorkflowLlnTest
      questions={getPublicCourseWorkflowLlnQuestions()}
      latestAttempt={latestAttempt}
      returnTo={returnTo}
      mode={mode}
      assignmentKey={assignmentKeyParam ?? null}
      buyAmountCents={buyAmountCents}
      unlockAmountCents={unlockAmountCents}
      courseSlug={courseSlug}
    />
  );
}
