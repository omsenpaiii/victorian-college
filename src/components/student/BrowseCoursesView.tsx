"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import type { CourseCatalogCard } from "@/lib/student-portal";

type BrowseCoursesViewProps = {
  courses: CourseCatalogCard[];
};

export function BrowseCoursesView({ courses }: BrowseCoursesViewProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(courses.map((course) => course.category))).sort()],
    [courses],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesCategory = category === "All" || course.category === category;
      if (!matchesCategory) return false;
      if (!normalized) return true;

      return [course.title, course.code, course.category, course.overview, course.label]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [category, courses, query]);

  return (
    <div className="space-y-6">
      <section className="portal-card rounded-[28px] p-6 sm:p-8">
        <h2 className="text-3xl font-black tracking-tight text-[#081221]">Browse Courses</h2>
        <p className="portal-page-copy mt-2 max-w-3xl">
          Explore the wider VCK catalogue, compare industries, and jump straight into your enrolled workspaces where access is already active.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <label className="portal-input flex h-14 items-center gap-3 px-4 text-sm font-semibold text-[#5d7389]">
            <Search size={18} className="text-[#86a0b7]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search courses by name, code, overview, or category..."
              className="h-full w-full bg-transparent outline-none placeholder:text-[#90a3b7]"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                className={`rounded-[16px] px-4 py-3 text-sm font-black transition ${
                  option === category
                    ? "bg-[#0f6eb8] text-white shadow-[0_12px_24px_rgba(15,110,184,0.16)]"
                    : "border border-[#d8e6f2] bg-[#f4f8fc] text-[#5d7389]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course) => (
            <article
              key={course.slug}
              className="portal-card overflow-hidden rounded-[24px]"
            >
              <div className="relative h-52">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,18,33,0.02)_0%,rgba(8,18,33,0.72)_100%)]" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-[14px] bg-white/16 px-3 py-1 text-xs font-black text-white backdrop-blur">
                    {course.code}
                  </span>
                  {course.enrolled ? (
                    <span className="rounded-[14px] bg-[#19b468] px-3 py-1 text-xs font-black text-white">
                      Enrolled
                    </span>
                  ) : null}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-black text-white">{course.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded-[14px] bg-[#eef5fb] px-3 py-1 text-xs font-black text-[#0f6eb8]">
                    {course.category}
                  </span>
                  <span className="rounded-[14px] bg-[#f4f8fc] px-3 py-1 text-xs font-black text-[#5d7389]">
                    {course.duration}
                  </span>
                  {course.progressPercent != null ? (
                    <span className="rounded-[14px] bg-[#e7fff1] px-3 py-1 text-xs font-black text-[#198754]">
                      {course.progressPercent}% complete
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold leading-6 text-[#5d7389]">{course.overview}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {course.deliveryModes.slice(0, 3).map((mode) => (
                    <span
                      key={mode}
                      className="rounded-[14px] border border-[#d9e7f3] px-3 py-1 text-xs font-black text-[#5d7389]"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-[#081221]">
                    AUD {course.priceAud.toLocaleString("en-AU")}
                  </span>
                  <Link
                    href={course.actionHref}
                    className={`rounded-[16px] px-5 py-3 text-sm font-black ${
                      course.enrolled
                        ? "bg-[#0f6eb8] text-white shadow-[0_18px_36px_rgba(15,110,184,0.14)]"
                        : "border border-[#d9e7f3] text-[#0f6eb8]"
                    }`}
                  >
                    {course.actionLabel}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="portal-card rounded-[24px] border-dashed p-12 text-center">
          <h3 className="text-2xl font-black text-[#081221]">No courses match that search</h3>
          <p className="mt-3 text-base font-semibold text-[#5d7389]">
            Clear the search or switch category filters to explore the full VCK course range again.
          </p>
        </section>
      )}
    </div>
  );
}
