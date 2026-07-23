"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Search } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import {
  courseCategories,
  courses,
  getCoursePriceDisplay,
  isContactFirstCourse,
  isCourseAvailableForEnrollment,
  type Course,
} from "@/lib/courses";

function getCourseEnrollmentCta(course: Course) {
  if (course.requiresLln) {
    return {
      href: `/dashboard/lln/${course.slug}?mode=continue&returnTo=${encodeURIComponent(`/course/${course.slug}`)}`,
      label: "Check readiness",
    };
  }

  return {
    href: `/enroll?course=${course.slug}`,
    label: "Enrol",
  };
}

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [activeCourses, setActiveCourses] = useState<Course[]>(courses);

  useEffect(() => {
    fetch("/api/courses")
      .then((response) => response.json())
      .then((data: { courses?: Course[] }) => {
        if (Array.isArray(data.courses) && data.courses.length > 0) {
          setActiveCourses(data.courses);
        }
      })
      .catch(() => {
        setActiveCourses(courses);
      });
  }, []);

  const categories = ["All", ...courseCategories.map((category) => category.title)];
  const filteredCourses = activeCourses.filter((course) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      course.code.toLowerCase().includes(query);

    if (selectedFilter === "All") return matchesSearch;
    if (selectedFilter === "Coming Soon") {
      return matchesSearch && course.availability === "coming-soon";
    }
    return matchesSearch && course.category === selectedFilter;
  });

  return (
    <main className="min-h-screen bg-slate-50 selection:bg-[#18aee5]/30">
      <SiteHeader />

      <section className="relative isolate overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(245,184,0,0.18),transparent_24%),radial-gradient(circle_at_85%_10%,rgba(24,174,229,0.16),transparent_28%),linear-gradient(180deg,#ffffff_0%,#eef8ff_100%)]" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <h1 className="text-5xl font-black leading-tight tracking-normal text-[#020d24] sm:text-6xl">
              Find a pathway for what comes next.
            </h1>
            <p className="mt-5 text-lg font-bold leading-8 text-[#53647c]">
              Explore sample pathways while verified availability, fees and delivery information are being finalised.
            </p>
          </div>

          <div className="mb-12 grid gap-4 rounded-[1.5rem] border border-[#18aee5]/14 bg-white p-4 shadow-[0_22px_70px_rgba(0,74,143,0.08)] lg:grid-cols-[360px_1fr]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="text"
                placeholder="Search courses or codes..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-12 rounded-full border-slate-200 bg-slate-50 pl-11 text-base font-semibold focus-visible:ring-[#18aee5]"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedFilter(category)}
                  className={`h-12 shrink-0 rounded-full px-5 text-sm font-black transition ${
                    selectedFilter === category
                      ? "bg-[#020d24] text-white shadow-md"
                      : "bg-[#eef8ff] text-[#0067b1] hover:bg-[#18aee5]/15"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {filteredCourses.length > 0 ? (
            <motion.div layout className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {filteredCourses.map((course) => (
                  <motion.article
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={course.slug}
                    className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-[#18aee5]/15 bg-white shadow-[0_24px_50px_rgba(0,103,177,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(0,103,177,0.14)]"
                  >
                    <div className="relative h-60 w-full shrink-0 overflow-hidden">
                      <Image src={course.image} alt={course.title} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020d24]/90 via-[#020d24]/20 to-transparent" />
                      <div className="absolute left-5 top-5 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#0067b1] shadow-md">
                        {course.category}
                      </div>
                      <div className="absolute bottom-5 left-5 right-5">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f5b800]">{course.code}</p>
                        <h2 className="mt-1 text-2xl font-black leading-tight text-white">{course.title}</h2>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      {isContactFirstCourse(course) ? (
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-bold text-[#0067b1]">
                          <span className="rounded-full bg-[#eef8ff] px-3 py-1">Contact-first access</span>
                        </div>
                      ) : (
                        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm font-bold text-[#0067b1]">
                          <span className="inline-flex items-center gap-2" title={course.duration}>
                            <Clock size={16} />
                            {course.duration.length > 30 ? `${course.duration.slice(0, 30)}...` : course.duration}
                          </span>
                          <span className="rounded-full bg-[#f5b800]/18 px-3 py-1 text-[#d96f00]">{getCoursePriceDisplay(course)}</span>
                        </div>
                      )}
                      <p className="flex-1 text-sm font-bold leading-7 text-[#53647c]">{course.description}</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          href={`/course/${course.slug}`}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#0067b1] px-5 text-sm font-black text-white transition hover:bg-[#123e95]"
                        >
                          Learn More <ArrowRight size={16} />
                        </Link>
                        {isContactFirstCourse(course) ? null : isCourseAvailableForEnrollment(course) ? (
                          <Link
                            href={getCourseEnrollmentCta(course).href}
                            className="inline-flex h-11 items-center justify-center rounded-full border border-[#18aee5]/35 px-5 text-sm font-black text-[#0067b1]"
                          >
                            {getCourseEnrollmentCta(course).label}
                          </Link>
                        ) : (
                          <Link
                            href="/contact"
                            className="inline-flex h-11 items-center justify-center rounded-full border border-[#18aee5]/35 px-5 text-sm font-black text-[#0067b1]"
                          >
                            Contact Us
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="rounded-[1.5rem] bg-white p-12 text-center shadow-sm">
              <Search size={32} className="mx-auto text-slate-400" />
              <h2 className="mt-4 text-xl font-black text-[#020d24]">No courses found</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                We couldn&apos;t find any courses matching &quot;{searchQuery}&quot;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilter("All");
                }}
                className="mt-6 text-[#0067b1] font-black hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
