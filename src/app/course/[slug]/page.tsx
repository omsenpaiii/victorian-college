import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Clock, DollarSign, FileText, Lock, Mail, Phone, Play, ShieldCheck } from "lucide-react";
import { CheckoutButton } from "@/components/CheckoutButton";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  courses,
  getCoursePriceDisplay,
  isContactFirstCourse,
  isCourseAvailableForEnrollment,
} from "@/lib/courses";
import { getCourse } from "@/lib/course-repository";
import { siteInfo } from "@/lib/site-content";

type CoursePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

function getEmbedUrl(url: string, provider: "youtube" | "google-drive"): string {
  if (!url) return "";
  if (provider === "youtube") {
    if (url.includes("/embed/")) return url;
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/i);
    return ytMatch && ytMatch[1] ? `https://www.youtube.com/embed/${ytMatch[1]}?rel=0` : url;
  }
  if (url.includes("/preview")) return url;
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return driveMatch && driveMatch[1] ? `https://drive.google.com/file/d/${driveMatch[1]}/preview` : url;
}

function isPlayableVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(?:$|\?)/i.test(url);
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);

  if (!course) {
    notFound();
  }

  const previewLesson = course.lessons.find((lesson) => lesson.isPreview) ?? course.lessons[0];
  const isOpenForEnrollment = isCourseAvailableForEnrollment(course);
  const isContactFirst = isContactFirstCourse(course);

  return (
    <main className="min-h-screen bg-white text-[#020d24]">
      <SiteHeader />

      <section className="relative isolate overflow-hidden px-5 py-14 sm:px-8 sm:py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,0,0.18),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(24,174,229,0.18),transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef8ff_100%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#0067b1] shadow-sm">
              {course.category} / {course.code}
            </p>
            <h1 className="text-5xl font-black leading-tight tracking-normal sm:text-6xl">
              {course.title}
            </h1>
            <p className="mt-5 text-lg font-bold leading-8 text-[#53647c]">
              {course.overview}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {isContactFirst ? (
                <a
                  href={course.externalAccessUrl ?? "https://vck.mylearnt.io/login"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#020d24] px-5 text-sm font-black text-white"
                >
                  {course.externalAccessLabel ?? "Access Additional Courses"} <ArrowRight size={16} />
                </a>
              ) : isOpenForEnrollment ? (
                <>
                  <CheckoutButton courseSlug={course.slug} />
                  <Link
                    href={`/enroll?course=${course.slug}`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#18aee5]/35 bg-white px-5 text-sm font-black text-[#0067b1]"
                  >
                    Enrol Form <ArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <Link
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#020d24] px-5 text-sm font-black text-white"
                >
                  Contact Us <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border-[10px] border-white bg-white shadow-[0_30px_90px_rgba(0,74,143,0.16)]">
            <div className="relative h-80">
              <Image src={course.image} alt={course.title} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020d24]/80 via-transparent to-transparent" />
              {isContactFirst ? (
                <div className="absolute bottom-5 left-5 right-5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#0067b1]">
                    Additional course access via VCK
                  </span>
                </div>
              ) : (
                <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#0067b1]">
                    <Clock size={16} /> {course.duration}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#f5b800] px-4 py-2 text-sm font-black text-[#020d24]">
                    <DollarSign size={16} /> {getCoursePriceDisplay(course)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {isContactFirst ? (
        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-[1.5rem] border border-[#18aee5]/14 bg-white p-8 shadow-[0_24px_70px_rgba(0,74,143,0.08)]">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#0067b1]">
                Please contact us
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-normal">
                Contact VCK for these additional courses and we will guide you.
              </h2>
              <p className="mt-5 text-base font-bold leading-7 text-[#53647c]">
                These courses use an additional access pathway. Please contact us on the details below and the VCK team will help you with the correct next step.
              </p>
              <div className="mt-8 grid gap-4">
                <a
                  href={`mailto:${siteInfo.email}`}
                  className="flex items-center gap-3 rounded-2xl bg-[#eef8ff] p-4 text-base font-black text-[#020d24]"
                >
                  <Mail className="text-[#0067b1]" size={20} />
                  {siteInfo.email}
                </a>
                <a
                  href={siteInfo.phoneHref}
                  className="flex items-center gap-3 rounded-2xl bg-[#fff6da] p-4 text-base font-black text-[#020d24]"
                >
                  <Phone className="text-[#d96f00]" size={20} />
                  {siteInfo.phone}
                </a>
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#020d24] p-8 text-white shadow-[0_24px_70px_rgba(0,74,143,0.12)]">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-[#f5b800]">
                Additional access
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-normal">
                Ready to continue into the external learning platform?
              </h2>
              <p className="mt-5 text-sm font-bold leading-7 text-sky-100/80">
                Once you have the right guidance from VCK, use the button below to access the additional course platform.
              </p>
              <a
                href={course.externalAccessUrl ?? "https://vck.mylearnt.io/login"}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f5b800] px-5 text-sm font-black text-[#020d24] transition hover:bg-[#ffc824]"
              >
                {course.externalAccessLabel ?? "Access Additional Courses"} <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[1.5rem] bg-[#eef8ff] p-6">
            <h2 className="text-2xl font-black">Course Snapshot</h2>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0067b1]">Fee</p>
                <p className="mt-2 text-xl font-black">{getCoursePriceDisplay(course)}</p>
                {course.enrolmentFee && isOpenForEnrollment ? (
                  <p className="text-sm font-bold text-[#53647c]">${course.enrolmentFee} enrolment fee</p>
                ) : null}
                {!isOpenForEnrollment && course.statusNote ? (
                  <p className="text-sm font-bold text-[#53647c]">{course.statusNote}</p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0067b1]">Delivery</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {course.deliveryModes.map((mode) => (
                    <span key={mode} className="rounded-full bg-[#eef8ff] px-3 py-1 text-xs font-black text-[#0067b1]">
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0067b1]">Career outcomes</p>
                <ul className="mt-3 grid gap-2">
                  {course.careerOutcomes.map((outcome) => (
                    <li key={outcome} className="flex gap-2 text-sm font-bold text-[#53647c]">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[#18aee5]" size={16} />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <div className="grid gap-8">
            <div className="rounded-[1.5rem] border border-[#18aee5]/14 bg-white p-6 shadow-[0_24px_70px_rgba(0,74,143,0.08)]">
              <div className="mb-5 flex items-center gap-3">
                <Play className="text-[#0067b1]" fill="currentColor" />
                <h2 className="text-2xl font-black">Course Video</h2>
              </div>
              {isPlayableVideo(course.externalVideoUrl) ? (
                <video
                  className="aspect-video w-full rounded-2xl bg-[#020d24] object-cover"
                  src={course.externalVideoUrl}
                  poster={course.image}
                  controls
                  playsInline
                />
              ) : previewLesson ? (
                <iframe
                  className="aspect-video w-full rounded-2xl bg-[#020d24]"
                  src={getEmbedUrl(previewLesson.videoUrl, previewLesson.videoProvider)}
                  title={`${course.title} preview lesson`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : null}
              {course.lessons.length ? (
              <div className="mt-4 grid gap-3">
                {course.lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#18aee5]/12 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${lesson.isPreview ? "bg-[#0067b1] text-white" : "bg-slate-100 text-slate-500"}`}>
                        {lesson.isPreview ? <Play size={16} fill="currentColor" /> : <Lock size={16} />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-black">{index + 1}. {lesson.title}</p>
                        <p className="text-sm font-bold text-[#53647c]">{lesson.duration}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${lesson.isPreview ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {lesson.isPreview ? "Free" : "Locked"}
                    </span>
                  </div>
                ))}
              </div>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] bg-[#020d24] p-6 text-white">
              <h2 className="text-2xl font-black">Entry Requirements</h2>
              <ul className="mt-5 grid gap-3">
                {course.entryRequirements.map((requirement) => (
                  <li key={requirement} className="flex gap-3 text-sm font-bold text-sky-100/80">
                    <ShieldCheck className="mt-0.5 shrink-0 text-[#f5b800]" size={18} />
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>

            {(course.durationDetails || course.feeDetails || course.deliveryStrategy || course.sourceArchiveUrl) ? (
              <div className="rounded-[1.5rem] border border-[#18aee5]/14 bg-white p-6 shadow-[0_24px_70px_rgba(0,74,143,0.08)]">
                <div className="mb-5 flex items-center gap-3">
                  <FileText className="text-[#0067b1]" />
                  <h2 className="text-2xl font-black">Course Details</h2>
                </div>
                <div className="grid gap-4">
                  {course.durationDetails ? (
                    <div className="rounded-2xl bg-[#eef8ff] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0067b1]">Duration</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#53647c]">{course.durationDetails}</p>
                    </div>
                  ) : null}
                  {course.feeDetails ? (
                    <div className="rounded-2xl bg-[#fff6da] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d96f00]">Fees</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#53647c]">{course.feeDetails}</p>
                    </div>
                  ) : null}
                  {course.deliveryStrategy ? (
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-[#18aee5]/14">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0067b1]">Delivery Strategy</p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#53647c]">{course.deliveryStrategy}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        </section>
      )}

      {isContactFirst || course.slug === "diploma-property-agency-management" ? null : (
        <section className="bg-[#eef8ff] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-3xl">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-[#0067b1]">
              Units of Competency
            </p>
            <h2 className="text-4xl font-black tracking-normal">{course.unitSummary}</h2>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-[#18aee5]/14 bg-white shadow-sm">
            <div className="grid grid-cols-[140px_1fr_120px] bg-[#0067b1] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white">
              <span>Code</span>
              <span>Title</span>
              <span>Type</span>
            </div>
            {course.units.map((unit) => (
              <div key={`${unit.code}-${unit.title}`} className="grid grid-cols-[140px_1fr_120px] gap-3 border-t border-slate-100 px-4 py-4 text-sm font-bold">
                <span className="text-[#0067b1]">{unit.code}</span>
                <span className="text-[#020d24]">{unit.title}</span>
                <span className="text-[#53647c]">{unit.type}</span>
              </div>
            ))}
          </div>
        </div>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
