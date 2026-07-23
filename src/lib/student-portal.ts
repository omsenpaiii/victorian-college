import { unstable_noStore as noStore } from "next/cache";
import { getCourses } from "@/lib/course-repository";
import type { AppUser } from "@/lib/auth";
import type { Course, CourseLesson, UnitItem } from "@/lib/courses";
import { getSupabaseAdmin } from "@/lib/supabase";

type EnrollmentRow = {
  course_slug: string;
  status: "active" | "refunded" | "revoked";
  stripe_session_id: string | null;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  updated_at?: string | null;
};

type ProgressRow = {
  course_slug: string;
  lesson_id: string;
  progress_seconds: number | null;
  completed: boolean | null;
  updated_at: string;
};

export type StudentActivityStatus = "not-started" | "in-progress" | "complete";

export type StudentActivity = {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  type: "lesson" | "unit";
  group: string;
  duration: string | null;
  status: StudentActivityStatus;
  progressValue: number;
  completed: boolean;
  updatedAt: string | null;
};

export type StudentActivityGroup = {
  id: string;
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  activities: StudentActivity[];
};

export type StudentResource = {
  id: string;
  title: string;
  description: string;
  kind: "info" | "link";
  href?: string;
  actionLabel?: string;
};

export type StudentCourseSummary = {
  slug: string;
  code: string;
  title: string;
  category: string;
  label: string;
  image: string;
  overview: string;
  description: string;
  duration: string;
  deliveryModes: string[];
  entryRequirements: string[];
  careerOutcomes: string[];
  units: UnitItem[];
  lessons: CourseLesson[];
  enrolledAt: string;
  updatedAt: string;
  amountPaid: number | null;
  currency: string | null;
  totalActivities: number;
  completedActivities: number;
  inProgressActivities: number;
  remainingActivities: number;
  progressPercent: number;
  status: EnrollmentRow["status"];
  statusLabel: string;
  activities: StudentActivity[];
  activityGroups: StudentActivityGroup[];
  resources: StudentResource[];
  incompleteActivities: StudentActivity[];
  recentActivities: StudentActivity[];
};

export type CourseCatalogCard = {
  slug: string;
  code: string;
  title: string;
  category: string;
  label: string;
  image: string;
  overview: string;
  duration: string;
  priceAud: number;
  deliveryModes: string[];
  enrolled: boolean;
  progressPercent: number | null;
  actionHref: string;
  actionLabel: string;
};

export type StudentPortalData = {
  user: AppUser;
  totalCourses: number;
  activeEnrollments: number;
  completedActivities: number;
  remainingActivities: number;
  averageProgress: number;
  continueCourse: StudentCourseSummary | null;
  recentActivity: StudentActivity[];
  incompleteActivityFeed: Array<StudentActivity & { courseSlug: string; courseTitle: string }>;
  courses: StudentCourseSummary[];
  catalog: CourseCatalogCard[];
};

const UNIT_CLUSTER_SIZE = 4;

function toCurrencyLabel(amount: number | null, currency: string | null) {
  if (amount == null) {
    return null;
  }

  const normalizedCurrency = (currency ?? "AUD").toUpperCase();

  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${normalizedCurrency} ${amount}`;
  }
}

function statusLabel(status: EnrollmentRow["status"]) {
  if (status === "active") return "Enrolled";
  if (status === "refunded") return "Refunded";
  return "Access changed";
}

function describeLesson(lesson: CourseLesson) {
  if (lesson.isPreview) {
    return "Preview lesson";
  }

  return lesson.videoProvider === "google-drive" ? "Learning video" : "Training lesson";
}

function progressStatus(row?: ProgressRow | null): StudentActivityStatus {
  if (row?.completed) {
    return "complete";
  }

  if ((row?.progress_seconds ?? 0) > 0) {
    return "in-progress";
  }

  return "not-started";
}

function progressValue(status: StudentActivityStatus) {
  if (status === "complete") return 100;
  if (status === "in-progress") return 50;
  return 0;
}

function buildResources(course: Course): StudentResource[] {
  const resources: StudentResource[] = [
    {
      id: `${course.slug}-overview`,
      title: "Course overview",
      description: course.overview,
      kind: "info",
    },
    {
      id: `${course.slug}-delivery`,
      title: "Delivery modes",
      description: course.deliveryModes.join(" • ") || "Delivery details will be confirmed by VCK.",
      kind: "info",
    },
    {
      id: `${course.slug}-requirements`,
      title: "Entry requirements",
      description:
        course.entryRequirements.join(" • ") ||
        "Your trainer will confirm the right entry pathway for this course.",
      kind: "info",
    },
    {
      id: `${course.slug}-careers`,
      title: "Career outcomes",
      description:
        course.careerOutcomes.join(" • ") ||
        "This course supports practical progression into your next role.",
      kind: "info",
    },
    {
      id: `${course.slug}-details`,
      title: "Course details page",
      description: "Review the public course page for fees, units, and delivery detail.",
      kind: "link",
      href: `/course/${course.slug}`,
      actionLabel: "Open details",
    },
  ];

  if (course.externalAccessUrl) {
    resources.push({
      id: `${course.slug}-external-access`,
      title: course.externalAccessLabel ?? "External access",
      description:
        "Open the linked learner resource or partner platform related to this program.",
      kind: "link",
      href: course.externalAccessUrl,
      actionLabel: course.externalAccessLabel ?? "Open link",
    });
  }

  if (course.sourceArchiveUrl) {
    resources.push({
      id: `${course.slug}-archive`,
      title: "Reference archive",
      description: "Source archive and supporting training materials for this course.",
      kind: "link",
      href: course.sourceArchiveUrl,
      actionLabel: "Open archive",
    });
  }

  return resources;
}

function buildActivities(
  course: Course,
  progressMap: Map<string, ProgressRow>,
) {
  const lessonActivities: StudentActivity[] = course.lessons.map((lesson) => {
    const id = `lesson-${lesson.id}`;
    const progress = progressMap.get(id);
    const status = progressStatus(progress);

    return {
      id,
      title: lesson.title,
      subtitle: describeLesson(lesson),
      summary: lesson.isPreview
        ? "Use this lesson to orient yourself before you move into the full learning sequence."
        : "Work through the lesson content and mark it complete once you are confident with the material.",
      type: "lesson",
      group: "Lesson library",
      duration: lesson.duration || null,
      status,
      progressValue: progressValue(status),
      completed: status === "complete",
      updatedAt: progress?.updated_at ?? null,
    };
  });

  const unitGroups = Array.from(
    { length: Math.ceil(course.units.length / UNIT_CLUSTER_SIZE) },
    (_, index) => {
      const items = course.units.slice(index * UNIT_CLUSTER_SIZE, (index + 1) * UNIT_CLUSTER_SIZE);
      return {
        title: `Cluster ${index + 1}`,
        items,
      };
    },
  );

  const unitActivities: StudentActivity[] = unitGroups.flatMap(({ title, items }) =>
    items.map((unit) => {
      const id = `unit-${unit.code.toLowerCase()}`;
      const progress = progressMap.get(id);
      const status = progressStatus(progress);

      return {
        id,
        title: `${unit.code} · ${unit.title}`,
        subtitle: unit.type,
        summary:
          unit.prerequisite?.trim()
            ? `Prerequisite: ${unit.prerequisite}`
            : "Complete the learning activity, review the supporting guidance, and mark your progress when finished.",
        type: "unit",
        group: title,
        duration: null,
        status,
        progressValue: progressValue(status),
        completed: status === "complete",
        updatedAt: progress?.updated_at ?? null,
      };
    }),
  );

  const activities = [...lessonActivities, ...unitActivities];
  const groups = Array.from(
    activities.reduce((map, activity) => {
      const current = map.get(activity.group) ?? [];
      current.push(activity);
      map.set(activity.group, current);
      return map;
    }, new Map<string, StudentActivity[]>()),
  ).map(([groupTitle, groupActivities]) => {
    const completedCount = groupActivities.filter((item) => item.completed).length;
    const totalCount = groupActivities.length;

    return {
      id: groupTitle.toLowerCase().replace(/\s+/g, "-"),
      title: groupTitle,
      subtitle:
        groupTitle === "Lesson library"
          ? "Orientation, previews, and guided lesson content"
          : `${groupActivities.length} course activities`,
      completedCount,
      totalCount,
      progressPercent: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
      activities: groupActivities,
    };
  });

  return { activities, groups };
}

function buildCourseSummary(
  course: Course,
  enrollment: EnrollmentRow,
  progressRows: ProgressRow[],
): StudentCourseSummary {
  const progressMap = new Map(progressRows.map((row) => [row.lesson_id, row]));
  const { activities, groups } = buildActivities(course, progressMap);
  const completedActivities = activities.filter((item) => item.completed).length;
  const inProgressActivities = activities.filter((item) => item.status === "in-progress").length;
  const totalActivities = activities.length;
  const remainingActivities = totalActivities - completedActivities;
  const progressPercent = totalActivities
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;
  const incompleteActivities = activities
    .filter((item) => item.status !== "complete")
    .sort((a, b) => {
      const priority = { "in-progress": 0, "not-started": 1, complete: 2 } as const;
      return priority[a.status] - priority[b.status] || a.title.localeCompare(b.title);
    });
  const recentActivities = activities
    .filter((item) => item.updatedAt)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 4);

  return {
    slug: course.slug,
    code: course.code,
    title: course.title,
    category: course.category,
    label: course.label,
    image: course.image,
    overview: course.overview,
    description: course.description,
    duration: course.duration,
    deliveryModes: course.deliveryModes,
    entryRequirements: course.entryRequirements,
    careerOutcomes: course.careerOutcomes,
    units: course.units,
    lessons: course.lessons,
    enrolledAt: enrollment.created_at,
    updatedAt: enrollment.updated_at ?? enrollment.created_at,
    amountPaid: enrollment.amount_paid,
    currency: enrollment.currency,
    totalActivities,
    completedActivities,
    inProgressActivities,
    remainingActivities,
    progressPercent,
    status: enrollment.status,
    statusLabel: statusLabel(enrollment.status),
    activities,
    activityGroups: groups,
    resources: buildResources(course),
    incompleteActivities,
    recentActivities,
  };
}

export function buildActivityDetail(summary: StudentCourseSummary, activityId: string) {
  const activity = summary.activities.find((item) => item.id === activityId);

  if (!activity) {
    return null;
  }

  const checklist =
    activity.type === "lesson"
      ? [
          "Watch or review the training content from start to finish.",
          "Capture key site or compliance notes that matter for your workplace.",
          "Mark the lesson complete once you can explain the takeaway clearly.",
        ]
      : [
          "Review the unit intent, terminology, and practical expectations.",
          "Cross-check the related course overview and delivery guidance.",
          "Mark the activity complete once you are ready to progress to the next cluster.",
        ];

  const supportingDetails = [
    {
      label: "Course",
      value: `${summary.code} · ${summary.title}`,
    },
    {
      label: "Activity type",
      value: activity.type === "lesson" ? "Lesson" : "Unit activity",
    },
    {
      label: "Section",
      value: activity.group,
    },
    {
      label: "Estimated time",
      value: activity.duration ?? "Self-paced",
    },
  ];

  return {
    activity,
    checklist,
    supportingDetails,
    introduction:
      activity.type === "lesson"
        ? "Use this lesson as part of your guided learning sequence. Review the material, keep notes that matter for site practice, and update your completion state when you are ready."
        : "This unit activity turns the course outline into an actionable step inside your learning journey. Use the course guidance and resource library to work through it with confidence.",
    deliverables:
      activity.type === "lesson"
        ? "Confirm understanding, capture notes, and mark the lesson complete."
        : "Work through the unit expectations, review related resources, and mark the unit complete once you are ready to move on.",
    paymentLabel: toCurrencyLabel(summary.amountPaid, summary.currency),
  };
}

export async function getStudentPortalData(user: AppUser): Promise<StudentPortalData> {
  noStore();

  const [catalogCourses, supabase] = await Promise.all([getCourses(), Promise.resolve(getSupabaseAdmin())]);

  let enrollments: EnrollmentRow[] = [];
  let progressRows: ProgressRow[] = [];

  if (supabase) {
    const [{ data: enrollmentData }, { data: progressData }] = await Promise.all([
      supabase
        .from("course_enrollments")
        .select("course_slug,status,stripe_session_id,amount_paid,currency,created_at,updated_at")
        .eq("user_key", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("lesson_progress")
        .select("course_slug,lesson_id,progress_seconds,completed,updated_at")
        .eq("user_key", user.id)
        .order("updated_at", { ascending: false }),
    ]);

    enrollments = (enrollmentData ?? []) as EnrollmentRow[];
    progressRows = (progressData ?? []) as ProgressRow[];
  }

  const activeEnrollments = enrollments.filter((item) => item.status === "active");
  const courseMap = new Map(catalogCourses.map((course) => [course.slug, course]));
  const enrolledSummaries = activeEnrollments
    .map((enrollment) => {
      const course = courseMap.get(enrollment.course_slug);
      if (!course) {
        return null;
      }

      return buildCourseSummary(
        course,
        enrollment,
        progressRows.filter((row) => row.course_slug === course.slug),
      );
    })
    .filter(Boolean) as StudentCourseSummary[];

  const catalog = catalogCourses.map((course) => {
    const enrolled = enrolledSummaries.find((item) => item.slug === course.slug);
    return {
      slug: course.slug,
      code: course.code,
      title: course.title,
      category: course.category,
      label: course.label,
      image: course.image,
      overview: course.overview,
      duration: course.duration,
      priceAud: course.priceAud,
      deliveryModes: course.deliveryModes,
      enrolled: Boolean(enrolled),
      progressPercent: enrolled?.progressPercent ?? null,
      actionHref: enrolled ? `/dashboard/course/${course.slug}` : `/course/${course.slug}`,
      actionLabel: enrolled ? "Open workspace" : "View course",
    } satisfies CourseCatalogCard;
  });

  const totalActivities = enrolledSummaries.reduce((sum, course) => sum + course.totalActivities, 0);
  const completedActivities = enrolledSummaries.reduce(
    (sum, course) => sum + course.completedActivities,
    0,
  );
  const remainingActivities = enrolledSummaries.reduce(
    (sum, course) => sum + course.remainingActivities,
    0,
  );
  const continueCourse =
    enrolledSummaries
      .slice()
      .sort(
        (a, b) =>
          b.progressPercent - a.progressPercent ||
          b.updatedAt.localeCompare(a.updatedAt),
      )[0] ?? null;
  const recentActivity = enrolledSummaries
    .flatMap((course) => course.recentActivities)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 6);
  const incompleteActivityFeed = enrolledSummaries
    .flatMap((course) =>
      course.incompleteActivities.slice(0, 5).map((activity) => ({
        ...activity,
        courseSlug: course.slug,
        courseTitle: course.title,
      })),
    )
    .sort((a, b) => {
      const priority = { "in-progress": 0, "not-started": 1, complete: 2 } as const;
      return priority[a.status] - priority[b.status] || a.courseTitle.localeCompare(b.courseTitle);
    })
    .slice(0, 8);

  return {
    user,
    totalCourses: enrolledSummaries.length,
    activeEnrollments: activeEnrollments.length,
    completedActivities,
    remainingActivities,
    averageProgress: totalActivities ? Math.round((completedActivities / totalActivities) * 100) : 0,
    continueCourse,
    recentActivity,
    incompleteActivityFeed,
    courses: enrolledSummaries,
    catalog,
  };
}

export function getStudentCourseFromPortal(
  portalData: StudentPortalData,
  slug: string,
) {
  return portalData.courses.find((course) => course.slug === slug) ?? null;
}

export function formatActivityStatus(status: StudentActivityStatus) {
  if (status === "complete") return "Complete";
  if (status === "in-progress") return "In progress";
  return "Ready to start";
}

export function formatRelativeUpdate(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Updated recently";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatEnrollmentMeta(summary: StudentCourseSummary) {
  const payment = toCurrencyLabel(summary.amountPaid, summary.currency);
  return payment ? `${summary.statusLabel} · ${payment}` : summary.statusLabel;
}

export function formatCourseDuration(duration: string) {
  return duration || "Self-paced access";
}

export function buildVerifyCertificateSteps() {
  return [
    "Have the student name, course name, and certificate or statement number ready.",
    "Email VCK support or call the academy so the team can validate the record quickly.",
    "Allow the training team to confirm status and issue next-step guidance if a record needs checking.",
  ];
}

export function buildUsefulLinks() {
  return [
    {
      title: "Student support pathway",
      description: "Start with VCK support when you need policy guidance, learning clarity, or next-step help.",
      href: "/contact",
      actionLabel: "Open support",
    },
    {
      title: "Course catalogue",
      description: "Browse current VCK programs and compare delivery pathways.",
      href: "/dashboard/browse-courses",
      actionLabel: "Browse courses",
    },
    {
      title: "Need enrolment support?",
      description: "Reach the VCK team for scheduling, access, or progression questions.",
      href: "/dashboard/contact",
      actionLabel: "Contact support",
    },
  ];
}
