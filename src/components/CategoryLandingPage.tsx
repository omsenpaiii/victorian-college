import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { courseCategories, getCoursePriceDisplay, isContactFirstCourse } from "@/lib/courses";
import { getCourses } from "@/lib/course-repository";

export async function CategoryLandingPage({ slug }: { slug: string }) {
  const courses = await getCourses();
  const category = courseCategories.find((item) => item.slug === slug) ?? courseCategories[0];
  const categoryCourses = courses.filter((course) => {
    if (category.title === "Coming Soon") {
      return course.availability === "coming-soon";
    }
    return course.category === (category.filterCategory ?? category.title);
  });

  return (
    <main className="min-h-screen bg-white text-[#020d24]">
      <SiteHeader />
      <section className="relative isolate overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(245,184,0,0.18),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(24,174,229,0.18),transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef8ff_100%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#0067b1]">
              Course Area
            </p>
            <h1 className="text-5xl font-black leading-tight tracking-normal sm:text-6xl">
              {category.title.endsWith("Courses") ? category.title : `${category.title} Courses`}
            </h1>
            <p className="mt-5 text-lg font-bold leading-8 text-[#53647c]">
              {category.description}
            </p>
          </div>
          <div className="relative h-80 overflow-hidden rounded-[1.5rem] border-[10px] border-white shadow-[0_30px_90px_rgba(0,74,143,0.14)]">
            <Image src={category.image} alt={category.title} fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020d24]/70 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categoryCourses.map((course) => (
              <article key={course.slug} className="overflow-hidden rounded-[1.5rem] border border-[#18aee5]/14 bg-white shadow-[0_24px_70px_rgba(0,74,143,0.08)]">
                <div className="relative h-52">
                  <Image src={course.image} alt={course.title} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020d24]/75 via-transparent to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-[#f5b800] px-3 py-1 text-xs font-black text-[#020d24]">
                    {course.code}
                  </span>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-black">{course.title}</h2>
                  <p className="mt-3 text-sm font-bold leading-6 text-[#53647c]">{course.description}</p>
                  {isContactFirstCourse(course) ? (
                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-[#eef8ff] px-3 py-1 text-[#0067b1]">Contact-first access</span>
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-[#eef8ff] px-3 py-1 text-[#0067b1]" title={course.duration}>
                        {course.duration.length > 30 ? `${course.duration.slice(0, 30)}...` : course.duration}
                      </span>
                      <span className="rounded-full bg-[#f5b800]/18 px-3 py-1 text-[#d96f00]">{getCoursePriceDisplay(course)}</span>
                    </div>
                  )}
                  <Link href={`/course/${course.slug}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0067b1] px-5 py-3 text-sm font-black text-white">
                    Learn More <ArrowRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
