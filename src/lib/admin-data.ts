import { z } from "zod";
import { manualStudentKey } from "@/lib/admin";
import { getAdminCourses, getCourses } from "@/lib/course-repository";
import {
  getAdminCourseWorkflowAssignmentSnapshot,
  reviewAssignmentSubmission,
  setStudentAssignmentAccess,
  type AdminCourseWorkflowStudent,
  type CourseWorkflowAssignmentResource,
} from "@/lib/course-workflow";
import { type Course } from "@/lib/courses";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export type AdminStudent = {
  id: string;
  user_key: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  batch_number: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string | null;
  archived_at: string | null;
  archived_by_email: string | null;
  date_of_birth: string | null;
  usi: string | null;
  residential_address: string | null;
  disability_status: "no" | "yes" | "prefer_not_to_say" | null;
  disability_details: string | null;
  origin: "admin" | "import" | "self_enrolled";
  referred_by: string | null;
};

export type AdminEnrollment = {
  id: string;
  user_key: string;
  course_slug: string;
  status: "active" | "refunded" | "revoked" | "archived";
  stripe_customer_id: string | null;
  stripe_session_id: string | null;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string | null;
};

export type AdminLead = {
  id: string;
  type: "enrollment" | "interest";
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  course_slug: string;
  disability_status?: "no" | "yes" | "prefer_not_to_say" | null;
  disability_details?: string | null;
  payment_status?: string | null;
  email_status?: string | null;
  created_at: string;
  origin: "admin" | "import" | "self_enrolled";
  referred_by: string | null;
};

export type AdminPayment = {
  id: string;
  purpose: "course_enrollment" | "assignment_unlock";
  status: "pending" | "paid" | "failed" | "cancelled";
  user_key: string;
  email: string | null;
  course_slug: string;
  enrollment_id: string | null;
  amount_cents: number;
  currency: string;
  provider_status: string | null;
  paid_at: string | null;
  created_at: string;
};

export type AdminNotification = {
  eventKey: string;
  kind: "lead" | "assessment" | "payment";
  title: string;
  detail: string;
  createdAt: string;
  section: "leads" | "assessments" | "payments";
  read: boolean;
};

export type AdminSnapshot = {
  isSupabaseConfigured: boolean;
  courses: (Course & { isActive: boolean; archivedAt: string | null; archivedByEmail: string | null })[];
  students: AdminStudent[];
  enrollments: AdminEnrollment[];
  leads: AdminLead[];
  payments: AdminPayment[];
  notifications: AdminNotification[];
  courseWorkflow: {
    students: AdminCourseWorkflowStudent[];
    adminResources: CourseWorkflowAssignmentResource[];
  };
};

const courseSchema = z.object({
  slug: z.string().trim().min(1),
  code: z.string().trim().default("VCK"),
  title: z.string().trim().min(1),
  category: z.string().trim().default("Other"),
  label: z.string().trim().default("Course"),
  priceAud: z.coerce.number().min(0).default(0),
  enrolmentFee: z.coerce.number().min(0).optional().nullable(),
  duration: z.string().trim().default(""),
  description: z.string().trim().min(1),
  overview: z.string().trim().optional().nullable(),
  image: z.string().trim().optional().nullable(),
  externalVideoUrl: z.string().trim().optional().nullable(),
  deliveryModes: z.array(z.string()).default([]),
  entryRequirements: z.array(z.string()).default([]),
  careerOutcomes: z.array(z.string()).default([]),
  unitSummary: z.string().trim().default(""),
  availability: z.enum(["open", "coming-soon", "details-to-follow"]).optional().nullable(),
  priceLabel: z.string().trim().optional().nullable(),
  statusNote: z.string().trim().optional().nullable(),
  detailVariant: z.enum(["standard", "contact-first"]).optional().nullable(),
  externalAccessUrl: z.string().trim().optional().nullable(),
  externalAccessLabel: z.string().trim().optional().nullable(),
  durationDetails: z.string().trim().optional().nullable(),
  feeDetails: z.string().trim().optional().nullable(),
  deliveryStrategy: z.string().trim().optional().nullable(),
  sourceArchiveUrl: z.string().trim().optional().nullable(),
  units: z.array(z.any()).default([]),
  lessons: z.array(z.any()).default([]),
});

const lessonSchema = z.object({
  courseSlug: z.string().trim().min(1),
  lessonKey: z.string().trim().optional(),
  title: z.string().trim().min(1),
  duration: z.string().trim().default(""),
  videoProvider: z.enum(["youtube", "google-drive"]).default("youtube"),
  videoUrl: z.string().trim().min(1),
  isPreview: z.coerce.boolean().default(false),
});

const studentSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().optional().nullable(),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().nullable(),
  dob: z.string().trim().optional().nullable(),
  usi: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{10}$/, "USI must be 10 letters or numbers").optional().nullable().or(z.literal("")),
  address: z.string().trim().optional().nullable(),
  disabilityStatus: z.enum(["no", "yes", "prefer_not_to_say"]).optional().nullable(),
  disabilityDetails: z.string().trim().max(1000).optional().nullable(),
  origin: z.enum(["admin", "import", "self_enrolled"]).default("admin"),
  referredBy: z.string().trim().optional().nullable(),
  batchNumber: z.coerce.number().int().positive().default(2),
  userKey: z.string().trim().optional().nullable(),
  courseSlug: z.string().trim().optional().nullable(),
  status: z.enum(["active", "refunded", "revoked"]).default("active"),
});

const enrollmentSchema = z.object({
  userKey: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  courseSlug: z.string().trim().min(1),
  status: z.enum(["active", "refunded", "revoked"]).default("active"),
  amountPaid: z.coerce.number().optional().nullable(),
  currency: z.string().trim().optional().nullable(),
});

const leadSchema = z.object({
  id: z.string().trim().optional().nullable(),
  type: z.enum(["enrollment", "interest"]).default("interest"),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1),
  courseSlug: z.string().trim().min(1),
  disabilityStatus: z.enum(["no", "yes", "prefer_not_to_say"]).default("no"),
  disabilityDetails: z.string().trim().optional().nullable(),
  paymentStatus: z.enum(["pending", "paid", "failed", "cancelled"]).default("pending"),
  emailStatus: z.enum(["pending", "sent", "failed"]).default("pending"),
  origin: z.enum(["admin", "import", "self_enrolled"]).default("import"),
  referredBy: z.string().trim().optional().nullable(),
});

function requireSupabase() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function listFromText(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCourseRow(course: z.infer<typeof courseSchema>) {
  return {
    slug: course.slug,
    code: course.code,
    title: course.title,
    category: course.category,
    label: course.label,
    price_aud: Math.round(course.priceAud),
    enrolment_fee: course.enrolmentFee ?? null,
    duration: course.duration,
    description: course.description,
    overview: course.overview ?? course.description,
    image_url: course.image ?? null,
    external_video_url: course.externalVideoUrl ?? null,
    delivery_modes: course.deliveryModes,
    entry_requirements: course.entryRequirements,
    career_outcomes: course.careerOutcomes,
    unit_summary: course.unitSummary,
    availability: course.availability ?? "open",
    price_label: course.priceLabel ?? null,
    status_note: course.statusNote ?? null,
    detail_variant: course.detailVariant ?? "standard",
    external_access_url: course.externalAccessUrl ?? null,
    external_access_label: course.externalAccessLabel ?? null,
    duration_details: course.durationDetails ?? null,
    fee_details: course.feeDetails ?? null,
    delivery_strategy: course.deliveryStrategy ?? null,
    source_archive_url: course.sourceArchiveUrl ?? null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

export async function getAdminSnapshot(adminEmail = ""): Promise<AdminSnapshot> {
  const publicCourses = await getCourses();
  const emptyCourses = publicCourses.map((course) => ({ ...course, isActive: true, archivedAt: null, archivedByEmail: null }));

  if (!isSupabaseConfigured()) {
    return {
      isSupabaseConfigured: false,
      courses: emptyCourses,
      students: [],
      enrollments: [],
      leads: [],
      payments: [],
      notifications: [],
      courseWorkflow: { students: [], adminResources: [] },
    };
  }

  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      isSupabaseConfigured: false,
      courses: emptyCourses,
      students: [],
      enrollments: [],
      leads: [],
      payments: [],
      notifications: [],
      courseWorkflow: { students: [], adminResources: [] },
    };
  }

  try {
    const [courses, studentsResult, enrollmentsResult, enrollmentLeadsResult, interestLeadsResult, paymentsResult, readsResult] =
      await Promise.all([
        getAdminCourses(),
        supabase
          .from("student_profiles")
          .select("id,user_key,first_name,last_name,email,phone,batch_number,stripe_customer_id,created_at,updated_at,archived_at,archived_by_email,date_of_birth,usi,residential_address,disability_status,disability_details,origin,referred_by")
          .order("first_name", { ascending: true, nullsFirst: false })
          .order("last_name", { ascending: true, nullsFirst: false })
          .order("email", { ascending: true, nullsFirst: false }),
        supabase
          .from("course_enrollments")
          .select("id,user_key,course_slug,status,stripe_customer_id,stripe_session_id,amount_paid,currency,created_at,updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("enrollment_leads")
          .select("id,first_name,last_name,email,phone,course_slug,disability_status,disability_details,payment_status,email_status,created_at,origin,referred_by")
          .order("created_at", { ascending: false }),
        supabase
          .from("interest_leads")
          .select("id,first_name,last_name,email,phone,course_slug,created_at,origin,referred_by")
          .order("created_at", { ascending: false }),
        supabase
          .from("payment_intents")
          .select("id,purpose,status,user_key,email,course_slug,enrollment_id,amount_cents,currency,provider_status,paid_at,created_at")
          .eq("provider", "stripe")
          .order("created_at", { ascending: false }),
        adminEmail
          ? supabase.from("admin_notification_reads").select("event_key").eq("admin_email", adminEmail.toLowerCase())
          : Promise.resolve({ data: [], error: null }),
      ]);

    const enrollmentLeads = ((enrollmentLeadsResult.data ?? []) as Omit<AdminLead, "type">[]).map(
      (lead) => ({ ...lead, type: "enrollment" as const }),
    );
    const interestLeads = ((interestLeadsResult.data ?? []) as Omit<AdminLead, "type">[]).map(
      (lead) => ({
        ...lead,
        type: "interest" as const,
        disability_status: null,
        disability_details: null,
      }),
    );

    const courseWorkflow = await getAdminCourseWorkflowAssignmentSnapshot();
    const payments = (paymentsResult.data ?? []) as AdminPayment[];
    const readKeys = new Set((readsResult.data ?? []).map((row) => String(row.event_key)));
    const notifications: AdminNotification[] = [
      ...[...enrollmentLeads, ...interestLeads].map((lead) => ({
        eventKey: `lead:${lead.type}:${lead.id}`,
        kind: "lead" as const,
        title: lead.type === "enrollment" ? "New enrollment lead" : "New course enquiry",
        detail: `${lead.first_name} ${lead.last_name} · ${lead.course_slug}`,
        createdAt: lead.created_at,
        section: "leads" as const,
        read: readKeys.has(`lead:${lead.type}:${lead.id}`),
      })),
      ...courseWorkflow.students.flatMap((student) => student.assignments
        .filter((assignment) => assignment.submission?.status === "submitted")
        .map((assignment) => ({
          eventKey: `assessment:${assignment.submission!.id}`,
          kind: "assessment" as const,
          title: "Assessment ready for review",
          detail: `${student.firstName ?? ""} ${student.lastName ?? ""} · Cluster ${assignment.position}`.trim(),
          createdAt: assignment.submission!.submitted_at,
          section: "assessments" as const,
          read: readKeys.has(`assessment:${assignment.submission!.id}`),
        }))),
      ...payments.filter((payment) => payment.status === "paid" || payment.status === "failed").map((payment) => ({
        eventKey: `payment:${payment.id}:${payment.status}`,
        kind: "payment" as const,
        title: payment.status === "paid" ? "Stripe payment received" : "Stripe payment failed",
        detail: `${payment.email ?? "Learner"} · ${payment.course_slug}`,
        createdAt: payment.paid_at ?? payment.created_at,
        section: "payments" as const,
        read: readKeys.has(`payment:${payment.id}:${payment.status}`),
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return {
      isSupabaseConfigured: true,
      courses,
      students: (studentsResult.data ?? []) as AdminStudent[],
      enrollments: (enrollmentsResult.data ?? []) as AdminEnrollment[],
      leads: [...enrollmentLeads, ...interestLeads].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
      payments,
      notifications,
      courseWorkflow,
    };
  } catch {
    return {
      isSupabaseConfigured: true,
      courses: emptyCourses,
      students: [],
      enrollments: [],
      leads: [],
      payments: [],
      notifications: [],
      courseWorkflow: { students: [], adminResources: [] },
    };
  }
}

export async function upsertAdminCourse(input: unknown) {
  const course = courseSchema.parse(input);
  const supabase = requireSupabase();

  const { error } = await supabase
    .from("courses")
    .upsert(toCourseRow(course), { onConflict: "slug" });

  if (error) {
    throw new Error(error.message);
  }

  return course;
}

export async function upsertAdminLesson(input: unknown) {
  const lesson = lessonSchema.parse(input);
  const supabase = requireSupabase();
  const lessonKey =
    lesson.lessonKey ||
    lesson.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const { count } = await supabase
    .from("course_lessons")
    .select("id", { count: "exact", head: true })
    .eq("course_slug", lesson.courseSlug);

  const { error } = await supabase.from("course_lessons").upsert(
    {
      course_slug: lesson.courseSlug,
      lesson_key: lessonKey,
      title: lesson.title,
      duration: lesson.duration,
      video_provider: lesson.videoProvider,
      video_url: lesson.videoUrl,
      is_preview: lesson.isPreview,
      position: count ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "course_slug,lesson_key" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { ...lesson, lessonKey };
}

export async function replaceAdminCourseUnits(
  courseSlug: string,
  units: { code: string; title: string; type?: string; prerequisite?: string | null }[],
) {
  const supabase = requireSupabase();
  await supabase.from("course_units").delete().eq("course_slug", courseSlug);

  if (!units.length) {
    return;
  }

  const { error } = await supabase.from("course_units").insert(
    units.map((unit, index) => ({
      course_slug: courseSlug,
      code: unit.code,
      title: unit.title,
      type:
        unit.type === "Core" || unit.type === "Elective" || unit.type === "Skill set"
          ? unit.type
          : "Skill set",
      prerequisite: unit.prerequisite ?? null,
      position: index,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertAdminStudent(input: unknown) {
  const student = studentSchema.parse(input);
  const supabase = requireSupabase();
  const email = student.email.toLowerCase();
  const duplicateQuery = supabase
    .from("student_profiles")
    .select("id")
    .ilike("email", email)
    .limit(1);
  const { data: duplicateRows, error: duplicateError } = student.id
    ? await duplicateQuery.neq("id", student.id)
    : await duplicateQuery;

  if (duplicateError) {
    throw new Error(duplicateError.message);
  }

  if (duplicateRows?.length && student.id) {
    throw new Error("A student profile already exists with this email address.");
  }

  const profileId = student.id ?? duplicateRows?.[0]?.id ?? null;

  let userKey = student.userKey || manualStudentKey(email);
  let profileError: { message: string } | null = null;
  const profileValues = {
    first_name: student.firstName,
    last_name: student.lastName || null,
    email,
    phone: student.phone || null,
    batch_number: student.batchNumber,
    date_of_birth: student.dob || null,
    usi: student.usi ? student.usi.toUpperCase() : null,
    residential_address: student.address || null,
    disability_status: student.disabilityStatus || null,
    disability_details: student.disabilityStatus === "yes" ? student.disabilityDetails || null : null,
    origin: student.origin,
    referred_by: student.referredBy || null,
    updated_at: new Date().toISOString(),
  };

  if (profileId) {
    const { data: existing, error: existingError } = await supabase
      .from("student_profiles")
      .select("user_key")
      .eq("id", profileId)
      .single();

    if (existingError || !existing) {
      throw new Error(existingError?.message || "Student profile was not found.");
    }

    userKey = existing.user_key;
    const result = await supabase.from("student_profiles").update(profileValues).eq("id", profileId);
    profileError = result.error;
  } else {
    const result = await supabase.from("student_profiles").insert({
      ...profileValues,
      user_key: userKey,
    });
    profileError = result.error;
  }

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (student.courseSlug) {
    const { error: enrollmentError } = await supabase.from("course_enrollments").upsert(
      {
        user_key: userKey,
        course_slug: student.courseSlug,
        status: student.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_key,course_slug" },
    );

    if (enrollmentError) {
      throw new Error(enrollmentError.message);
    }
  }

  return { ...student, userKey };
}

const studentLifecycleSchema = z.object({
  id: z.string().uuid(),
});

export async function archiveAdminStudent(input: unknown, adminEmail: string) {
  const { id } = studentLifecycleSchema.parse(input);
  const supabase = requireSupabase();
  const { data: profile, error: profileLookupError } = await supabase
    .from("student_profiles")
    .select("user_key,archived_at")
    .eq("id", id)
    .single();

  if (profileLookupError || !profile) {
    throw new Error(profileLookupError?.message || "Student profile was not found.");
  }

  if (profile.archived_at) return;

  const archivedAt = new Date().toISOString();
  const { error: enrollmentError } = await supabase
    .from("course_enrollments")
    .update({ status: "archived", updated_at: archivedAt })
    .eq("user_key", profile.user_key)
    .eq("status", "active");

  if (enrollmentError) throw new Error(enrollmentError.message);

  const { error: profileError } = await supabase
    .from("student_profiles")
    .update({ archived_at: archivedAt, archived_by_email: adminEmail, updated_at: archivedAt })
    .eq("id", id);

  if (profileError) throw new Error(profileError.message);
}

export async function restoreAdminStudent(input: unknown) {
  const { id } = studentLifecycleSchema.parse(input);
  const supabase = requireSupabase();
  const { data: profile, error: profileLookupError } = await supabase
    .from("student_profiles")
    .select("user_key,archived_at")
    .eq("id", id)
    .single();

  if (profileLookupError || !profile) {
    throw new Error(profileLookupError?.message || "Student profile was not found.");
  }

  if (!profile.archived_at) return;

  const restoredAt = new Date().toISOString();
  const { error: enrollmentError } = await supabase
    .from("course_enrollments")
    .update({ status: "active", updated_at: restoredAt })
    .eq("user_key", profile.user_key)
    .eq("status", "archived");

  if (enrollmentError) throw new Error(enrollmentError.message);

  const { error: profileError } = await supabase
    .from("student_profiles")
    .update({ archived_at: null, archived_by_email: null, updated_at: restoredAt })
    .eq("id", id);

  if (profileError) throw new Error(profileError.message);
}

export async function upsertAdminEnrollment(input: unknown) {
  const enrollment = enrollmentSchema.parse(input);
  const supabase = requireSupabase();
  const { data: existingProfile } = enrollment.email
    ? await supabase.from("student_profiles").select("user_key").ilike("email", enrollment.email).limit(1).maybeSingle()
    : { data: null };
  const userKey = enrollment.userKey || existingProfile?.user_key || (enrollment.email ? manualStudentKey(enrollment.email) : null);

  if (!userKey) {
    throw new Error("Enrollment import needs userKey or email.");
  }

  if (enrollment.email) {
    const { error: profileError } = await supabase.from("student_profiles").upsert(
      {
        user_key: userKey,
        email: enrollment.email,
        origin: "import",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_key" },
    );

    if (profileError) {
      throw new Error(profileError.message);
    }
  }

  const { error } = await supabase.from("course_enrollments").upsert(
    {
      user_key: userKey,
      course_slug: enrollment.courseSlug,
      status: enrollment.status,
      amount_paid: enrollment.amountPaid ?? null,
      currency: enrollment.currency ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_key,course_slug" },
  );

  if (error) {
    throw new Error(error.message);
  }

  return { ...enrollment, userKey };
}

export async function upsertAdminLead(input: unknown) {
  const lead = leadSchema.parse(input);
  const supabase = requireSupabase();
  const table = lead.type === "enrollment" ? "enrollment_leads" : "interest_leads";
  const { data: existingLead, error: existingError } = await supabase
    .from(table)
    .select("id")
    .ilike("email", lead.email)
    .eq("course_slug", lead.courseSlug)
    .limit(1)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);
  const leadId = lead.id || existingLead?.id || null;

  if (lead.type === "enrollment") {
    const values = {
      ...(leadId ? { id: leadId } : {}),
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      date_of_birth: "1900-01-01",
      usi: "UNKNOWN000",
      address: "Imported by VCK admin",
      course_slug: lead.courseSlug,
      disability_status: lead.disabilityStatus,
      disability_details:
        lead.disabilityStatus === "yes" && lead.disabilityDetails
          ? lead.disabilityDetails
          : null,
      payment_status: lead.paymentStatus,
      email_status: lead.emailStatus,
      origin: lead.origin,
      referred_by: lead.referredBy || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = leadId
      ? await supabase.from("enrollment_leads").update(values).eq("id", leadId)
      : await supabase.from("enrollment_leads").insert(values);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const values = {
      ...(leadId ? { id: leadId } : {}),
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      course_slug: lead.courseSlug,
      origin: lead.origin,
      referred_by: lead.referredBy || null,
    };
    const { error } = leadId
      ? await supabase.from("interest_leads").update(values).eq("id", leadId)
      : await supabase.from("interest_leads").insert(values);

    if (error) {
      throw new Error(error.message);
    }
  }

  return lead;
}

export async function reviewAdminAssignment(input: unknown, reviewedBy: string) {
  const parsed = z.object({
    submissionId: z.string().trim().min(1),
    status: z.enum(["satisfactory", "not_satisfactory"]),
    adminComment: z.string().trim().default(""),
  }).parse(input);

  await reviewAssignmentSubmission({
    submissionId: parsed.submissionId,
    status: parsed.status,
    adminComment: parsed.adminComment,
    reviewedBy,
  });
}

export async function updateAdminAssignmentAccess(input: unknown, adminEmail: string) {
  const parsed = z.object({
    userKey: z.string().trim().min(1),
    assignmentKey: z.string().trim().min(1),
    unlocked: z.coerce.boolean(),
  }).parse(input);

  await setStudentAssignmentAccess({
    userKey: parsed.userKey,
    assignmentKey: parsed.assignmentKey,
    unlocked: parsed.unlocked,
    adminEmail,
  });
}

export async function archiveAdminCourse(slug: string, adminEmail: string) {
  const supabase = requireSupabase();
  const archivedAt = new Date().toISOString();
  const { error } = await supabase
    .from("courses")
    .update({ is_active: false, archived_at: archivedAt, archived_by_email: adminEmail, updated_at: archivedAt })
    .eq("slug", slug);

  if (error) {
    throw new Error(error.message);
  }
}

export async function restoreAdminCourse(slug: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("courses")
    .update({ is_active: true, archived_at: null, archived_by_email: null, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  if (error) throw new Error(error.message);
}

const notificationSchema = z.object({ eventKey: z.string().trim().min(1) });

export async function markAdminNotificationRead(input: unknown, adminEmail: string) {
  const { eventKey } = notificationSchema.parse(input);
  const supabase = requireSupabase();
  const { error } = await supabase.from("admin_notification_reads").upsert({
    admin_email: adminEmail.toLowerCase(),
    event_key: eventKey,
    read_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function markAllAdminNotificationsRead(eventKeys: string[], adminEmail: string) {
  if (!eventKeys.length) return;
  const supabase = requireSupabase();
  const { error } = await supabase.from("admin_notification_reads").upsert(
    eventKeys.map((eventKey) => ({
      admin_email: adminEmail.toLowerCase(),
      event_key: eventKey,
      read_at: new Date().toISOString(),
    })),
  );
  if (error) throw new Error(error.message);
}

export async function seedCoursesToSupabase(courses: Course[]) {
  const supabase = requireSupabase();

  for (const course of courses) {
    const parsed = courseSchema.parse(course);
    const { error } = await supabase
      .from("courses")
      .upsert(toCourseRow(parsed), { onConflict: "slug" });

    if (error) {
      throw new Error(error.message);
    }

    if (course.units?.length) {
      await supabase.from("course_units").delete().eq("course_slug", course.slug);
      const { error: unitError } = await supabase.from("course_units").insert(
        course.units.map((unit, index) => ({
          course_slug: course.slug,
          code: unit.code,
          title: unit.title,
          type: unit.type,
          prerequisite: unit.prerequisite ?? null,
          position: index,
        })),
      );

      if (unitError) {
        throw new Error(unitError.message);
      }
    }

    if (course.lessons?.length) {
      await supabase.from("course_lessons").delete().eq("course_slug", course.slug);
      const { error: lessonError } = await supabase.from("course_lessons").insert(
        course.lessons.map((lesson, index) => ({
          course_slug: course.slug,
          lesson_key: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          video_provider: lesson.videoProvider,
          video_url: lesson.videoUrl,
          position: index,
          is_preview: lesson.isPreview,
        })),
      );

      if (lessonError) {
        throw new Error(lessonError.message);
      }
    }
  }
}

export function normalizeCoursePayload(form: Record<string, FormDataEntryValue>) {
  return {
    slug: String(form.slug ?? ""),
    code: String(form.code ?? "VCK"),
    title: String(form.title ?? ""),
    category: String(form.category ?? "Other"),
    label: String(form.label ?? "Course"),
    priceAud: Number(form.priceAud ?? 0),
    enrolmentFee: form.enrolmentFee ? Number(form.enrolmentFee) : null,
    duration: String(form.duration ?? ""),
    description: String(form.description ?? ""),
    overview: String(form.overview ?? form.description ?? ""),
    image: String(form.image ?? ""),
    deliveryModes: listFromText(String(form.deliveryModes ?? "")),
    entryRequirements: listFromText(String(form.entryRequirements ?? "")),
    careerOutcomes: listFromText(String(form.careerOutcomes ?? "")),
    unitSummary: String(form.unitSummary ?? ""),
    availability: String(form.availability ?? "open"),
  };
}
