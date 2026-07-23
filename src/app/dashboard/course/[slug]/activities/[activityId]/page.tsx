import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookMarked, Clock3, FileStack, ShieldCheck } from "lucide-react";
import { ActivityCompletionButton } from "@/components/student/ActivityCompletionButton";
import { getCurrentUser } from "@/lib/auth";
import {
  buildActivityDetail,
  formatActivityStatus,
  formatRelativeUpdate,
  getStudentCourseFromPortal,
  getStudentPortalData,
} from "@/lib/student-portal";

type ActivityPageProps = {
  params: Promise<{ slug: string; activityId: string }>;
};

export default async function ActivityDetailPage({ params }: ActivityPageProps) {
  const { slug, activityId } = await params;
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const portalData = await getStudentPortalData(user);
  const course = getStudentCourseFromPortal(portalData, slug);

  if (!course) {
    notFound();
  }

  const detail = buildActivityDetail(course, activityId);

  if (!detail) {
    notFound();
  }

  const { activity, checklist, supportingDetails, introduction, deliverables, paymentLabel } = detail;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="portal-card rounded-[28px] p-7 sm:p-8">
        <Link
          href={`/dashboard/course/${course.slug}?tab=activities`}
          className="inline-flex items-center gap-2 text-sm font-black text-[#0f6eb8]"
        >
          <ArrowLeft size={16} />
          Back to activities
        </Link>

        <div className="mt-6 rounded-[24px] bg-[linear-gradient(135deg,#0b2b4e_0%,#0f5f9c_55%,#1883c8_100%)] p-6 text-white shadow-[0_24px_54px_rgba(12,50,88,0.16)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-[14px] bg-white/14 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/85">
              {course.code}
            </span>
            <span className="rounded-[14px] bg-white/14 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white/85">
              {formatActivityStatus(activity.status)}
            </span>
          </div>
          <h2 className="mt-5 text-4xl font-black tracking-tight">{activity.title}</h2>
          <p className="mt-3 max-w-4xl text-base font-semibold leading-7 text-white/82">
            {introduction}
          </p>
        </div>

        <div className="portal-subtle-card mt-6 rounded-[22px] p-6">
          <h3 className="text-2xl font-black tracking-tight text-[#081221]">Scenario and focus</h3>
          <p className="mt-4 text-base font-semibold leading-7 text-[#5d7389]">
            {activity.summary}
          </p>
          <div className="mt-6 grid gap-3">
            {supportingDetails.map((item) => (
              <div
                key={item.label}
                className="portal-card grid gap-2 rounded-[18px] px-4 py-4 shadow-none sm:grid-cols-[160px_1fr] sm:items-start"
              >
                <span className="text-sm font-black uppercase tracking-[0.14em] text-[#7f92a5]">
                  {item.label}
                </span>
                <span className="text-sm font-semibold leading-6 text-[#5d7389]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="portal-card rounded-[22px] p-6 shadow-none">
            <h3 className="text-2xl font-black tracking-tight text-[#081221]">What to work through</h3>
            <div className="mt-5 space-y-4">
              {checklist.map((item, index) => (
                <div key={item} className="flex gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-[#eef5fb] text-sm font-black text-[#0f6eb8]">
                    {index + 1}
                  </div>
                  <p className="text-sm font-semibold leading-6 text-[#5d7389]">{item}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="portal-card rounded-[22px] p-6 shadow-none">
            <h3 className="text-2xl font-black tracking-tight text-[#081221]">Deliverables</h3>
            <p className="mt-4 text-sm font-semibold leading-6 text-[#5d7389]">{deliverables}</p>
            <div className="portal-subtle-card mt-6 rounded-[18px] p-5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#7f92a5]">Course note</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#5d7389]">
                Use the Resources tab inside the course workspace for overview, delivery guidance, entry requirements, and external reference material that supports this activity.
              </p>
            </div>
          </article>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="portal-card rounded-[28px] p-7">
          <h3 className="text-2xl font-black tracking-tight text-[#081221]">Activity controls</h3>
          <div className="mt-5 space-y-4">
            <div className="portal-subtle-card rounded-[18px] p-5">
              <p className="text-sm font-black text-[#081221]">Status</p>
              <p className="mt-2 text-base font-semibold text-[#5d7389]">{formatActivityStatus(activity.status)}</p>
            </div>
            <div className="portal-subtle-card rounded-[18px] p-5">
              <p className="text-sm font-black text-[#081221]">Last update</p>
              <p className="mt-2 text-base font-semibold text-[#5d7389]">{formatRelativeUpdate(activity.updatedAt)}</p>
            </div>
            {paymentLabel ? (
              <div className="portal-subtle-card rounded-[18px] p-5">
                <p className="text-sm font-black text-[#081221]">Enrolment value</p>
                <p className="mt-2 text-base font-semibold text-[#5d7389]">{paymentLabel}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <ActivityCompletionButton
              courseSlug={course.slug}
              activityId={activity.id}
              completed={activity.completed}
            />
          </div>
        </section>

        <section className="portal-card rounded-[28px] p-7">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
              <BookMarked size={20} />
            </span>
            <h3 className="text-2xl font-black tracking-tight text-[#081221]">Stay oriented</h3>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { icon: FileStack, label: "Open course resources", href: `/dashboard/course/${course.slug}?tab=resources` },
              { icon: Clock3, label: "Return to activity list", href: `/dashboard/course/${course.slug}?tab=activities` },
              { icon: ShieldCheck, label: "Contact VCK support", href: "/dashboard/contact" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="portal-subtle-card flex items-center justify-between gap-3 rounded-[18px] px-4 py-4 text-sm font-black text-[#081221]"
              >
                <span className="inline-flex items-center gap-3">
                  <item.icon size={18} className="text-[#0f6eb8]" />
                  {item.label}
                </span>
                <ArrowLeft size={16} className="rotate-180 text-[#7f92a5]" />
              </Link>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
