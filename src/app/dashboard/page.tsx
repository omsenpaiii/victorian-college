import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { formatActivityStatus, formatRelativeUpdate, getStudentPortalData } from "@/lib/student-portal";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const portalData = await getStudentPortalData(user);
  const continueCourse = portalData.continueCourse;

  const overviewStats = [
    {
      label: "Enrolled Courses",
      value: String(portalData.totalCourses),
      note: portalData.totalCourses === 1 ? "Active" : "Active courses",
      icon: GraduationCap,
      tone: "bg-[#eef5ff] text-[#0f6eb8]",
    },
    {
      label: "Average Progress",
      value: `${portalData.averageProgress}%`,
      note: "Across courses",
      icon: TrendingUp,
      tone: "bg-[#e8f8ef] text-[#19a463]",
    },
    {
      label: "Completed Activities",
      value: String(portalData.completedActivities),
      note: "Total completed",
      icon: CalendarCheck,
      tone: "bg-[#eef5ff] text-[#0f6eb8]",
    },
    {
      label: "Tasks Remaining",
      value: String(portalData.remainingActivities),
      note: "Pending tasks",
      icon: Layers3,
      tone: "bg-[#fff2e8] text-[#f97316]",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,#06264b_0%,#004c92_52%,#0067b1_100%)] px-8 py-8 text-white shadow-[0_18px_48px_rgba(0,76,146,0.24)]">
        <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.22)_1px,transparent_1px)] [background-size:56px_56px]" />
        <ShieldCheck
          size={210}
          strokeWidth={1.15}
          className="absolute right-20 top-10 hidden text-white/25 xl:block"
        />
        <div className="relative max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.02em] text-[#5eb5ff]">
            Learning workspace
          </p>
          <h1 className="mt-4 max-w-3xl text-[2rem] font-black leading-tight tracking-tight sm:text-[2.55rem]">
            Learn, track progress, and move with confidence.
          </h1>
          <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/82">
            Access your courses, track activities, and complete tasks all in one place.
          </p>

          <div className="mt-8 grid max-w-4xl gap-5 md:grid-cols-3">
            {[
              { label: "Enrolled Courses", value: portalData.totalCourses, icon: BookOpen },
              { label: "Average Progress", value: `${portalData.averageProgress}%`, icon: TrendingUp },
              { label: "Tasks Remaining", value: portalData.remainingActivities, icon: Layers3 },
            ].map((item, index) => (
              <div
                key={item.label}
                className={`flex items-center gap-4 ${index ? "md:border-l md:border-white/20 md:pl-7" : ""}`}
              >
                <span className="flex size-12 items-center justify-center rounded-[8px] bg-white/10 text-[#3ea0ff]">
                  <item.icon size={24} />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white/86">{item.label}</span>
                  <span className="mt-1 block text-2xl font-black text-white">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[8px] border border-[#dbe3ec] bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h2 className="text-2xl font-black tracking-tight text-[#081221]">
            Welcome back, {user.firstName || user.name}
          </h2>
          <p className="mt-2 text-sm font-medium text-[#475569]">Here&apos;s your learning overview</p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewStats.map((item) => (
              <article
                key={item.label}
                className="rounded-[8px] border border-[#dbe3ec] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.03)]"
              >
                <div className={`flex size-10 items-center justify-center rounded-[8px] ${item.tone}`}>
                  <item.icon size={20} />
                </div>
                <p className="mt-4 text-sm font-medium text-[#475569]">{item.label}</p>
                <p className="mt-2 text-3xl font-black leading-none text-[#081221]">{item.value}</p>
                <p className="mt-2 text-xs font-semibold text-[#0f6eb8]">{item.note}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#dbe3ec] bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <h2 className="text-2xl font-black tracking-tight text-[#081221]">Continue Learning</h2>
          <p className="mt-2 text-sm font-medium text-[#475569]">Pick up where you left off</p>

          {continueCourse ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-[190px_1fr]">
              <div className="relative h-32 overflow-hidden rounded-[8px] bg-[#0b2b4e]">
                <Image
                  src={continueCourse.image}
                  alt={continueCourse.title}
                  fill
                  sizes="190px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(5,22,42,.62)_100%)]" />
                <span className="absolute bottom-3 right-3 rounded-[6px] bg-[#0f6eb8] px-2.5 py-1 text-sm font-black text-white">
                  {continueCourse.progressPercent}%
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-[#081221]">{continueCourse.title}</h3>
                <p className="mt-2 text-sm font-medium text-[#64748b]">
                  {continueCourse.code} · {continueCourse.deliveryModes.slice(0, 2).join(" · ")}
                </p>
                <div className="mt-4 h-2 rounded-full bg-[#e7edf4]">
                  <div
                    className="h-2 rounded-full bg-[#0f6eb8]"
                    style={{ width: `${continueCourse.progressPercent}%` }}
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-[#475569]">
                  {continueCourse.completedActivities} of {continueCourse.totalActivities} activities completed
                </p>
                <Link
                  href={`/dashboard/course/${continueCourse.slug}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#0f6eb8] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,110,184,0.16)]"
                >
                  Resume Course
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard/my-courses"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0059c8]"
                >
                  View my courses
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-[8px] border border-dashed border-[#cbd8e6] bg-[#fbfdff] p-8 text-center">
              <BookOpen size={34} className="mx-auto text-[#0f6eb8]" />
              <p className="mt-4 text-sm font-medium leading-6 text-[#475569]">
                Once you enrol in a course, this panel becomes your launch point for lessons and resources.
              </p>
              <Link
                href="/dashboard/browse-courses"
                className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-[#0f6eb8] px-4 py-3 text-sm font-semibold text-white"
              >
                Browse courses
                <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[8px] border border-[#dbe3ec] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#081221]">Next Tasks</h2>
              <p className="mt-1 text-sm font-medium text-[#475569]">Keep going. Here are your priority tasks.</p>
            </div>
            <Link href="/dashboard/my-courses" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0059c8]">
              View all tasks
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 space-y-2">
            {portalData.incompleteActivityFeed.length ? (
              portalData.incompleteActivityFeed.slice(0, 3).map((activity, index) => (
                <Link
                  key={`${activity.courseSlug}-${activity.id}`}
                  href={`/dashboard/course/${activity.courseSlug}/activities/${activity.id}`}
                  className="flex items-center gap-4 rounded-[8px] border border-[#e5edf5] bg-white px-4 py-3 transition hover:border-[#0f6eb8]/40"
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-[8px] ${
                    index === 0 ? "bg-[#fff0f0] text-[#ef4444]" : index === 1 ? "bg-[#fff2e8] text-[#f97316]" : "bg-[#eef5ff] text-[#0f6eb8]"
                  }`}
                  >
                    <FileText size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#081221]">{activity.title}</span>
                    <span className="mt-1 block text-sm font-medium text-[#64748b]">
                      {activity.subtitle} · {formatActivityStatus(activity.status)}
                    </span>
                  </span>
                  <span className="hidden rounded-[6px] bg-[#eef5ff] px-2.5 py-1 text-xs font-semibold text-[#0f6eb8] sm:inline-flex">
                    {activity.group}
                  </span>
                  <ArrowRight size={18} className="text-[#64748b]" />
                </Link>
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-[#cbd8e6] bg-[#fbfdff] p-8 text-center">
                <CheckCircle2 size={34} className="mx-auto text-[#19a463]" />
                <h3 className="mt-4 text-lg font-black text-[#081221]">Everything is up to date</h3>
                <p className="mt-2 text-sm font-medium text-[#475569]">
                  Your next tasks will show here as course activities become active.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#dbe3ec] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-[#081221]">Recent Activity</h2>
              <p className="mt-1 text-sm font-medium text-[#475569]">A quick look at your latest progress.</p>
            </div>
            <Link href="/dashboard/my-courses" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0059c8]">
              View all activity
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 space-y-2">
            {portalData.recentActivity.length ? (
              portalData.recentActivity.slice(0, 3).map((activity) => (
                <div
                  key={`${activity.id}-${activity.updatedAt ?? "recent"}`}
                  className="flex items-center gap-4 rounded-[8px] border border-[#e5edf5] bg-white px-4 py-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-[#e8f8ef] text-[#19a463]">
                    <CheckCircle2 size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#081221]">
                      {formatActivityStatus(activity.status)}: {activity.title}
                    </span>
                    <span className="mt-1 block text-sm font-medium text-[#64748b]">{activity.subtitle}</span>
                  </span>
                  <span className="hidden text-right text-xs font-medium text-[#64748b] sm:block">
                    {formatRelativeUpdate(activity.updatedAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-[8px] border border-dashed border-[#cbd8e6] bg-[#fbfdff] p-8 text-center">
                <Clock3 size={34} className="mx-auto text-[#0f6eb8]" />
                <h3 className="mt-4 text-lg font-black text-[#081221]">No recent activity yet</h3>
                <p className="mt-2 text-sm font-medium text-[#475569]">
                  Your latest lesson and activity updates will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
