import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, CheckCircle2, FileText, GraduationCap, Mail } from "lucide-react";
import { ActivityCompletionButton } from "@/components/student/ActivityCompletionButton";
import { CourseUnlockCelebration } from "@/components/student/CourseUnlockCelebration";
import { CourseWorkflowAssignmentsView } from "@/components/student/CourseWorkflowAssignmentsView";
import { getCurrentUser } from "@/lib/auth";
import { getStudentCourseWorkflowAssignments, isCourseWorkflowSlug } from "@/lib/course-workflow";
import {
  formatActivityStatus,
  formatRelativeUpdate,
  getStudentCourseFromPortal,
  getStudentPortalData,
} from "@/lib/student-portal";

type CourseWorkspacePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; unlocked?: string }>;
};

function TabLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-[14px] px-4 py-2.5 text-sm font-black transition ${
        active ? "bg-white text-[#081221] shadow-sm" : "text-[#5d7389]"
      }`}
    >
      {label}
    </Link>
  );
}

function getCourseWorkflowUnlockAmountCents() {
  const amount = Number(process.env.COURSE_WORKFLOW_ASSIGNMENT_UNLOCK_AMOUNT_CENTS ?? 0);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount) : null;
}

export default async function CourseWorkspacePage({
  params,
  searchParams,
}: CourseWorkspacePageProps) {
  const [{ slug }, resolvedSearch] = await Promise.all([params, searchParams]);
  const tab = resolvedSearch.tab === "activities" || resolvedSearch.tab === "resources"
    ? resolvedSearch.tab
    : "info";

  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const portalData = await getStudentPortalData(user);
  const course = getStudentCourseFromPortal(portalData, slug);

  if (!course) {
    notFound();
  }

  const WorkflowAssignments = isCourseWorkflowSlug(course.slug)
    ? await getStudentCourseWorkflowAssignments(user.id, course.slug)
    : [];
  const WorkflowCompleted = WorkflowAssignments.filter((assignment) => assignment.status === "satisfactory").length;
  const WorkflowRemaining = WorkflowAssignments.filter((assignment) => assignment.status !== "satisfactory").length;
  const WorkflowProgressPercent = WorkflowAssignments.length
    ? Math.round((WorkflowCompleted / WorkflowAssignments.length) * 100)
    : course.progressPercent;
  const WorkflowIncomplete = WorkflowAssignments.filter((assignment) => assignment.status !== "satisfactory");
  const WorkflowUnlockAmountCents = getCourseWorkflowUnlockAmountCents();

  if (isCourseWorkflowSlug(course.slug) && tab !== "info") {
    return (
      <div className="space-y-5">
        <CourseUnlockCelebration courseTitle={course.title} isCourseWorkflow />
        <section className="portal-card overflow-hidden rounded-[24px]">
          <div className="relative bg-[linear-gradient(120deg,#062846_0%,#0f6eb8_58%,#1596db_100%)] px-6 py-7 text-white sm:px-8">
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:44px_44px]" />
            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px] xl:items-end">
              <div>
                <div className="inline-flex rounded-full bg-white/14 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/82 backdrop-blur">
                  Currently enrolled
                </div>
                <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                  {course.title}
                </h2>
                <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-white/82">
                  {course.overview}
                </p>
                <div className="mt-5 flex flex-wrap gap-4 text-sm font-black text-white/80">
                  <span className="inline-flex items-center gap-2">
                    <FileText size={16} />
                    Program Code: {course.code}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Award size={16} />
                    Nationally aligned training
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <GraduationCap size={16} />
                    {course.deliveryModes.slice(0, 3).join(" • ")}
                  </span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Course completion", value: `${WorkflowProgressPercent}%` },
                  { label: "Satisfactory", value: WorkflowCompleted },
                  { label: "Remaining", value: WorkflowRemaining },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/18 bg-white/12 p-4 backdrop-blur"
                  >
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7eff7] bg-white px-5 py-4">
            <div className="inline-flex rounded-[16px] bg-[#eef5fb] p-1.5">
              <TabLink href={`/dashboard/course/${course.slug}`} label="Course Information" active={false} />
              <TabLink href={`/dashboard/course/${course.slug}?tab=activities`} label="Activities" active={tab === "activities"} />
              <TabLink href={`/dashboard/course/${course.slug}?tab=resources`} label="Resources" active={tab === "resources"} />
            </div>
            <Link
              href="/dashboard/contact"
              className="portal-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm"
            >
              <Mail size={16} />
              Email Instructor
            </Link>
          </div>
        </section>

        <CourseWorkflowAssignmentsView
          assignments={WorkflowAssignments}
          mode={tab}
          unlockAmountCents={WorkflowUnlockAmountCents}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <CourseUnlockCelebration
        courseTitle={course.title}
        isCourseWorkflow={isCourseWorkflowSlug(course.slug)}
      />
      <section className="space-y-6">
        <div className="portal-card overflow-hidden rounded-[28px]">
          <div className="relative h-72">
            <Image
              src={course.image}
              alt={course.title}
              fill
              sizes="(min-width:1280px) 60vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,18,33,0.08)_0%,rgba(8,18,33,0.86)_100%)]" />
            <div className="absolute left-6 top-6 rounded-[14px] bg-white/12 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white backdrop-blur">
              Currently enrolled
            </div>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="max-w-[16ch] text-4xl font-black tracking-tight text-white sm:text-[3.2rem]">
                {course.title}
              </h2>
              <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-white/82">
                {course.overview}
              </p>
              <div className="mt-5 flex flex-wrap gap-4 text-sm font-black text-white/80">
                <span className="inline-flex items-center gap-2">
                  <FileText size={16} />
                  Program Code: {course.code}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Award size={16} />
                  Nationally aligned training
                </span>
                <span className="inline-flex items-center gap-2">
                  <GraduationCap size={16} />
                  {course.deliveryModes.slice(0, 3).join(" • ")}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="inline-flex rounded-[18px] bg-[#eef5fb] p-1.5">
              <TabLink href={`/dashboard/course/${course.slug}`} label="Course Information" active={tab === "info"} />
              <TabLink href={`/dashboard/course/${course.slug}?tab=activities`} label="Activities" active={tab === "activities"} />
              <TabLink href={`/dashboard/course/${course.slug}?tab=resources`} label="Resources" active={tab === "resources"} />
            </div>

            {tab === "info" ? (
              <div className="mt-6 space-y-6">
                <article className="portal-subtle-card rounded-[22px] p-6">
                  <h3 className="text-2xl font-black tracking-tight text-[#081221]">Course Overview</h3>
                  <p className="mt-4 text-base font-semibold leading-7 text-[#5d7389]">{course.description}</p>
                </article>
                <div className="grid gap-6 lg:grid-cols-2">
                  <article className="portal-card rounded-[22px] p-6 shadow-none">
                    <h3 className="text-xl font-black text-[#081221]">Entry requirements</h3>
                    <div className="mt-4 space-y-3">
                      {course.entryRequirements.map((item) => (
                        <div
                          key={item}
                          className="portal-subtle-card rounded-[16px] px-4 py-3 text-sm font-semibold text-[#5d7389]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </article>
                  <article className="portal-card rounded-[22px] p-6 shadow-none">
                    <h3 className="text-xl font-black text-[#081221]">Career outcomes</h3>
                    <div className="mt-4 space-y-3">
                      {course.careerOutcomes.map((item) => (
                        <div
                          key={item}
                          className="portal-subtle-card rounded-[16px] px-4 py-3 text-sm font-semibold text-[#5d7389]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </div>
            ) : null}

            {tab === "activities" ? (
              isCourseWorkflowSlug(course.slug) ? (
                <CourseWorkflowAssignmentsView
                  assignments={WorkflowAssignments}
                  mode="activities"
                  unlockAmountCents={WorkflowUnlockAmountCents}
                />
              ) : (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Total Activities", value: course.totalActivities, tone: "text-[#0f6eb8] bg-[#eef5fb]" },
                    { label: "Incomplete", value: course.remainingActivities, tone: "text-[#f59e0b] bg-[#fff5e5]" },
                    { label: "Complete", value: course.completedActivities, tone: "text-[#198754] bg-[#e7fff1]" },
                    { label: "In Progress", value: course.inProgressActivities, tone: "text-[#7c3aed] bg-[#f3edff]" },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="portal-card rounded-[20px] p-5 shadow-none"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-[#5d7389]">{item.label}</span>
                        <span className={`rounded-2xl px-3 py-2 text-sm font-black ${item.tone}`}>
                          {item.value}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="space-y-4">
                  {course.activityGroups.map((group) => (
                    <article
                      key={group.id}
                      className="portal-card overflow-hidden rounded-[22px] shadow-none"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eef3f8] px-6 py-5">
                        <div>
                          <h3 className="text-xl font-black text-[#081221]">{group.title}</h3>
                          <p className="mt-1 text-sm font-semibold text-[#5d7389]">{group.subtitle}</p>
                        </div>
                        <div className="flex min-w-[220px] items-center gap-3">
                          <div className="h-3 flex-1 rounded-full bg-[#edf3f8]">
                            <div
                              className="h-3 rounded-full bg-[linear-gradient(90deg,#0f6eb8_0%,#1b97db_100%)]"
                              style={{ width: `${group.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-sm font-black text-[#5d7389]">
                            {group.completedCount}/{group.totalCount}
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-[#eef3f8]">
                        {group.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="text-lg font-black text-[#081221]">{activity.title}</h4>
                                <span className="rounded-[14px] bg-[#eef5fb] px-3 py-1 text-xs font-black text-[#0f6eb8]">
                                  {formatActivityStatus(activity.status)}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-semibold text-[#5d7389]">{activity.summary}</p>
                              <div className="mt-3 flex flex-wrap gap-3 text-xs font-black uppercase tracking-[0.14em] text-[#7f92a5]">
                                <span>{activity.subtitle}</span>
                                <span>{activity.duration ?? "Self-paced"}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <Link
                                href={`/dashboard/course/${course.slug}/activities/${activity.id}`}
                                className="portal-button-secondary px-4 py-2 text-sm"
                              >
                                Open
                              </Link>
                              <ActivityCompletionButton
                                courseSlug={course.slug}
                                activityId={activity.id}
                                completed={activity.completed}
                                compact
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              )
            ) : null}

            {tab === "resources" ? (
              isCourseWorkflowSlug(course.slug) ? (
                <CourseWorkflowAssignmentsView
                  assignments={WorkflowAssignments}
                  mode="resources"
                  unlockAmountCents={WorkflowUnlockAmountCents}
                />
              ) : (
              <div className="mt-6 grid gap-4">
                {course.resources.map((resource) => (
                  <article
                    key={resource.id}
                    className="portal-card rounded-[20px] p-6 shadow-none"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-black text-[#081221]">{resource.title}</h3>
                        <p className="mt-3 text-sm font-semibold leading-6 text-[#5d7389]">
                          {resource.description}
                        </p>
                      </div>
                      {resource.href ? (
                        <Link
                          href={resource.href}
                          className="portal-button-primary px-4 py-2 text-sm"
                        >
                          {resource.actionLabel ?? "Open"}
                        </Link>
                      ) : (
                        <span className="rounded-[14px] bg-[#eef5fb] px-4 py-2 text-sm font-black text-[#0f6eb8]">
                          Resource note
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              )
            ) : null}
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="portal-card rounded-[28px] p-7">
          <h3 className="text-3xl font-black tracking-tight text-[#081221]">Your Progress</h3>
          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="text-xl font-black text-[#081221]">Course Completion</span>
            <span className="text-2xl font-black text-[#081221]">{WorkflowProgressPercent}%</span>
          </div>
          <div className="mt-4 h-4 rounded-full bg-[#edf3f8]">
            <div
              className="h-4 rounded-full bg-[linear-gradient(90deg,#19b468_0%,#63d39b_100%)]"
              style={{ width: `${WorkflowProgressPercent}%` }}
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-[24px] bg-[#f6fff8] px-4 py-5">
              <p className="text-4xl font-black text-[#19b468]">
                {isCourseWorkflowSlug(course.slug) ? WorkflowCompleted : course.completedActivities}
              </p>
              <p className="mt-2 text-base font-semibold text-[#5d7389]">Completed</p>
            </div>
            <div className="rounded-[24px] bg-[#f4f8fc] px-4 py-5">
              <p className="text-4xl font-black text-[#8c9cb0]">
                {isCourseWorkflowSlug(course.slug) ? WorkflowRemaining : course.remainingActivities}
              </p>
              <p className="mt-2 text-base font-semibold text-[#5d7389]">Remaining</p>
            </div>
          </div>

          <div className="mt-8">
            <h4 className="text-2xl font-black tracking-tight text-[#081221]">Incomplete Activities</h4>
            <div className="mt-4 space-y-3">
              {isCourseWorkflowSlug(course.slug) ? (
                WorkflowIncomplete.slice(0, 5).map((assignment) => (
                  <Link
                    key={assignment.assignmentKey}
                    href={`/dashboard/course/${course.slug}?tab=activities`}
                    className="portal-subtle-card flex items-center justify-between gap-4 rounded-[18px] p-4 transition hover:border-[#0f6eb8]/30 hover:bg-white"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="truncate text-base font-black text-[#081221]">
                        Cluster {assignment.position}
                      </h5>
                      <p className="mt-1 text-sm font-semibold text-[#5d7389]">{assignment.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-[14px] bg-[#eef5fb] px-3 py-1 text-xs font-black text-[#0f6eb8]">
                        {assignment.unlocked ? "Open" : "Locked"}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
              course.incompleteActivities.slice(0, 5).map((activity) => (
                <Link
                  key={activity.id}
                  href={`/dashboard/course/${course.slug}/activities/${activity.id}`}
                  className="portal-subtle-card flex items-center justify-between gap-4 rounded-[18px] p-4 transition hover:border-[#0f6eb8]/30 hover:bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-base font-black text-[#081221]">{activity.title}</h5>
                    <p className="mt-1 text-sm font-semibold text-[#5d7389]">{activity.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-[14px] bg-[#eef5fb] px-3 py-1 text-xs font-black text-[#0f6eb8]">
                      {formatActivityStatus(activity.status)}
                    </span>
                  </div>
                </Link>
              ))
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-[#eef3f8] pt-6">
            <Link
              href="/dashboard/contact"
              className="portal-button-secondary inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
            >
              <Mail size={16} />
              Email Instructor
            </Link>
          </div>
        </section>

        <section className="portal-card rounded-[28px] p-7">
          <h3 className="text-2xl font-black tracking-tight text-[#081221]">Recent updates</h3>
          <div className="mt-5 space-y-3">
            {course.recentActivities.length ? (
              course.recentActivities.map((activity) => (
                <div
                  key={`${activity.id}-${activity.updatedAt ?? "update"}`}
                  className="portal-subtle-card rounded-[18px] p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#19b468]" />
                    <div>
                      <p className="text-sm font-black text-[#081221]">{activity.title}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f92a5]">
                        {formatRelativeUpdate(activity.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#c9d9e8] bg-[#fbfdff] p-5 text-sm font-semibold text-[#5d7389]">
                As you move through lessons and unit work, your latest updates will show here.
              </div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
