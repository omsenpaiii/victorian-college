import { unstable_noStore as noStore } from "next/cache";
import {
  courses as fallbackCourses,
  getCourse as getFallbackCourse,
  isCourseAvailableForEnrollment,
  type Course,
  type CourseLesson,
  type UnitItem,
} from "@/lib/courses";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

type CourseRow = {
  slug: string;
  code: string | null;
  title: string;
  category: string | null;
  label: string | null;
  price_aud: number | null;
  enrolment_fee: number | null;
  duration: string | null;
  description: string;
  overview: string | null;
  image_url: string | null;
  external_video_url: string | null;
  delivery_modes: string[] | null;
  entry_requirements: string[] | null;
  career_outcomes: string[] | null;
  unit_summary: string | null;
  availability: Course["availability"] | null;
  price_label: string | null;
  status_note: string | null;
  detail_variant: Course["detailVariant"] | null;
  external_access_url: string | null;
  external_access_label: string | null;
  duration_details: string | null;
  fee_details: string | null;
  delivery_strategy: string | null;
  source_archive_url: string | null;
  is_active: boolean | null;
  archived_at: string | null;
  archived_by_email: string | null;
  requires_lln: boolean | null;
  lln_test_key: string | null;
  lln_pass_percent: number | null;
  assessment_unlock_amount_cents: number | null;
};

type LessonRow = {
  id: string;
  course_slug: string;
  lesson_key: string;
  title: string;
  duration: string | null;
  video_provider: CourseLesson["videoProvider"];
  video_url: string;
  position: number | null;
  is_preview: boolean | null;
};

type UnitRow = {
  course_slug: string;
  code: string;
  title: string;
  type: UnitItem["type"] | null;
  prerequisite: string | null;
  position: number | null;
};

const courseSelect = [
  "slug",
  "code",
  "title",
  "category",
  "label",
  "price_aud",
  "enrolment_fee",
  "duration",
  "description",
  "overview",
  "image_url",
  "external_video_url",
  "delivery_modes",
  "entry_requirements",
  "career_outcomes",
  "unit_summary",
  "availability",
  "price_label",
  "status_note",
  "detail_variant",
  "external_access_url",
  "external_access_label",
  "duration_details",
  "fee_details",
  "delivery_strategy",
  "source_archive_url",
  "is_active",
  "archived_at",
  "archived_by_email",
  "requires_lln",
  "lln_test_key",
  "lln_pass_percent",
  "assessment_unlock_amount_cents",
].join(",");

function asStringArray(value: unknown, fallback: string[] = []) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : fallback;
}

function preferCourseText<T extends string | undefined>(
  value: string | null,
  fallback: T,
  genericValues: string[] = [],
) {
  const trimmed = value?.trim();

  if (!trimmed || genericValues.includes(trimmed)) {
    return fallback;
  }

  return trimmed;
}

function mapRowsToCourses(
  rows: CourseRow[],
  lessons: LessonRow[],
  units: UnitRow[],
  includeInactive = false,
): (Course & { isActive: boolean; archivedAt: string | null; archivedByEmail: string | null })[] {
  const lessonsByCourse = new Map<string, CourseLesson[]>();
  const unitsByCourse = new Map<string, UnitItem[]>();

  lessons
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .forEach((lesson) => {
      const list = lessonsByCourse.get(lesson.course_slug) ?? [];
      list.push({
        id: lesson.lesson_key || lesson.id,
        title: lesson.title,
        duration: lesson.duration ?? "",
        isPreview: Boolean(lesson.is_preview),
        videoProvider: lesson.video_provider,
        videoUrl: lesson.video_url,
      });
      lessonsByCourse.set(lesson.course_slug, list);
    });

  units
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .forEach((unit) => {
      const list = unitsByCourse.get(unit.course_slug) ?? [];
      list.push({
        code: unit.code,
        title: unit.title,
        type: unit.type ?? "Skill set",
        prerequisite: unit.prerequisite ?? undefined,
      });
      unitsByCourse.set(unit.course_slug, list);
    });

  return rows
    .filter((row) => includeInactive || row.is_active !== false)
    .map((row) => {
      const fallback = getFallbackCourse(row.slug);
      const priceAud = Number(row.price_aud ?? fallback?.priceAud ?? 0);

      return {
        slug: row.slug,
        code: preferCourseText(row.code, fallback?.code ?? "VCK", ["VCK"]),
        title: row.title,
        category: preferCourseText(row.category, fallback?.category ?? "Other", ["Other"]),
        label: preferCourseText(row.label, fallback?.label ?? "Course", ["Course"]),
        priceAud,
        enrolmentFee: row.enrolment_fee ?? fallback?.enrolmentFee,
        duration: row.duration ?? fallback?.duration ?? "",
        description: row.description,
        overview: row.overview ?? fallback?.overview ?? row.description,
        image: row.image_url ?? fallback?.image ?? "/hero.jpeg",
        externalVideoUrl: row.external_video_url ?? fallback?.externalVideoUrl ?? "",
        deliveryModes: asStringArray(row.delivery_modes, fallback?.deliveryModes),
        entryRequirements: asStringArray(row.entry_requirements, fallback?.entryRequirements),
        careerOutcomes: asStringArray(row.career_outcomes, fallback?.careerOutcomes),
        unitSummary: row.unit_summary ?? fallback?.unitSummary ?? "",
        units: unitsByCourse.get(row.slug) ?? fallback?.units ?? [],
        lessons: lessonsByCourse.get(row.slug) ?? fallback?.lessons ?? [],
        availability: row.availability ?? fallback?.availability,
        priceLabel: row.price_label ?? fallback?.priceLabel,
        statusNote: row.status_note ?? fallback?.statusNote,
        detailVariant: row.detail_variant ?? fallback?.detailVariant,
        externalAccessUrl: row.external_access_url ?? fallback?.externalAccessUrl,
        externalAccessLabel: row.external_access_label ?? fallback?.externalAccessLabel,
        durationDetails: row.duration_details ?? fallback?.durationDetails,
        feeDetails: row.fee_details ?? fallback?.feeDetails,
        deliveryStrategy: row.delivery_strategy ?? fallback?.deliveryStrategy,
        sourceArchiveUrl: row.source_archive_url ?? fallback?.sourceArchiveUrl,
        requiresLln: row.requires_lln ?? fallback?.requiresLln,
        llnTestKey: row.lln_test_key ?? fallback?.llnTestKey,
        llnPassPercent: row.lln_pass_percent ?? fallback?.llnPassPercent,
        assessmentUnlockAmountCents: row.assessment_unlock_amount_cents ?? fallback?.assessmentUnlockAmountCents,
        isActive: row.is_active !== false,
        archivedAt: row.archived_at,
        archivedByEmail: row.archived_by_email,
      };
    });
}

export async function getAdminCourses() {
  noStore();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return fallbackCourses.map((course) => ({
      ...course,
      isActive: true,
      archivedAt: null,
      archivedByEmail: null,
    }));
  }

  const [{ data: courseRows, error }, { data: lessonRows }, { data: unitRows }] = await Promise.all([
    supabase.from("courses").select(courseSelect).order("title", { ascending: true }),
    supabase.from("course_lessons").select("id,course_slug,lesson_key,title,duration,video_provider,video_url,position,is_preview"),
    supabase.from("course_units").select("course_slug,code,title,type,prerequisite,position"),
  ]);

  if (error) throw new Error(error.message);

  return mapRowsToCourses(
    (courseRows ?? []) as unknown as CourseRow[],
    (lessonRows ?? []) as unknown as LessonRow[],
    (unitRows ?? []) as unknown as UnitRow[],
    true,
  );
}

export async function getCourses() {
  noStore();

  if (!isSupabaseConfigured()) {
    return fallbackCourses;
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return fallbackCourses;
  }

  try {
    const [{ data: courseRows, error: courseError }, { data: lessonRows }, { data: unitRows }] =
      await Promise.all([
        supabase.from("courses").select(courseSelect).order("title", { ascending: true }),
        supabase
          .from("course_lessons")
          .select("id,course_slug,lesson_key,title,duration,video_provider,video_url,position,is_preview")
          .order("position", { ascending: true }),
        supabase
          .from("course_units")
          .select("course_slug,code,title,type,prerequisite,position")
          .order("position", { ascending: true }),
      ]);

    if (courseError || !courseRows?.length) {
      return fallbackCourses;
    }

    return mapRowsToCourses(
      courseRows as unknown as CourseRow[],
      (lessonRows ?? []) as unknown as LessonRow[],
      (unitRows ?? []) as unknown as UnitRow[],
    );
  } catch {
    return fallbackCourses;
  }
}

export async function getCourse(slug: string) {
  const allCourses = await getCourses();
  return allCourses.find((course) => course.slug === slug);
}

export async function getFeaturedCourse() {
  const allCourses = await getCourses();
  return allCourses.find((course) => isCourseAvailableForEnrollment(course)) ?? allCourses[0];
}

export async function getCoursesByCategory(category: string) {
  const allCourses = await getCourses();
  return allCourses.filter((course) => course.category === category);
}

export function getFallbackCourses() {
  return fallbackCourses;
}
