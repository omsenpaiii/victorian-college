import { unstable_noStore as noStore } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase";

export const COURSE_WORKFLOW_COURSE_SLUG = "certificate-iv-business-bsb40120";

export type AssignmentStatus =
  | "locked"
  | "not_submitted"
  | "submitted"
  | "satisfactory"
  | "not_satisfactory";

export type AssignmentResourceKind =
  | "slides"
  | "learning_resource"
  | "assessment"
  | "assessor_key";

export type CourseWorkflowAssignmentResource = {
  id: string;
  course_slug: string;
  assignment_key: string;
  resource_key: string;
  audience: "student" | "admin";
  kind: AssignmentResourceKind;
  title: string;
  description: string;
  original_bucket: string;
  original_path: string | null;
  original_mime_type: string | null;
  preview_bucket: string;
  preview_path: string | null;
  preview_mime_type: string | null;
  downloadable: boolean;
  position: number;
};

export type CourseWorkflowAssignmentSubmission = {
  id: string;
  user_key: string;
  course_slug: string;
  assignment_key: string;
  file_bucket: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  status: "submitted" | "satisfactory" | "not_satisfactory";
  student_comment: string | null;
  resubmission_count: number | null;
  submitted_by: "student" | "admin";
  uploaded_by_admin_email: string | null;
  admin_comment: string | null;
  reviewed_by: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  updated_at: string | null;
};

type AssignmentRow = {
  assignment_key: string;
  title: string;
  subtitle: string;
  overview: string;
  position: number;
};

type AccessRow = {
  assignment_key: string;
  unlocked: boolean;
  source: string | null;
  reason: string | null;
};

export type StudentCourseWorkflowAssignment = {
  courseSlug: string;
  assignmentKey: string;
  title: string;
  subtitle: string;
  overview: string;
  position: number;
  unlocked: boolean;
  source: string | null;
  lockReason: string | null;
  status: AssignmentStatus;
  resources: CourseWorkflowAssignmentResource[];
  submission: CourseWorkflowAssignmentSubmission | null;
};

export type AdminCourseWorkflowStudent = {
  userKey: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  batchNumber: number;
  source: string | null;
  assignments: StudentCourseWorkflowAssignment[];
};

function statusFor(unlocked: boolean, submission: CourseWorkflowAssignmentSubmission | null): AssignmentStatus {
  if (!unlocked) return "locked";
  if (!submission) return "not_submitted";
  return submission.status;
}

export function formatAssignmentStatus(status: AssignmentStatus) {
  if (status === "locked") return "Locked";
  if (status === "not_submitted") return "Not submitted";
  if (status === "submitted") return "Submitted";
  if (status === "satisfactory") return "Satisfactory";
  return "Not satisfactory";
}

export function isCourseWorkflowSlug(slug: string) {
  return Boolean(slug);
}

export async function getStudentCourseWorkflowAssignments(userKey: string, courseSlug = COURSE_WORKFLOW_COURSE_SLUG): Promise<StudentCourseWorkflowAssignment[]> {
  noStore();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return [];
  }

  const [assignmentResult, accessResult, resourceResult, submissionResult] = await Promise.all([
    supabase
      .from("course_assignments")
      .select("assignment_key,title,subtitle,overview,position")
      .eq("course_slug", courseSlug)
      .eq("is_active", true)
      .order("position", { ascending: true }),
    supabase
      .from("student_assignment_access")
      .select("assignment_key,unlocked,source,reason")
      .eq("course_slug", courseSlug)
      .eq("user_key", userKey),
    supabase
      .from("course_assignment_resources")
      .select("*")
      .eq("course_slug", courseSlug)
      .eq("audience", "student")
      .order("position", { ascending: true }),
    supabase
      .from("assignment_submissions")
      .select("*")
      .eq("course_slug", courseSlug)
      .eq("user_key", userKey),
  ]);

  const assignments = (assignmentResult.data ?? []) as AssignmentRow[];
  const access = new Map(
    ((accessResult.data ?? []) as AccessRow[]).map((row) => [row.assignment_key, row]),
  );
  const resources = ((resourceResult.data ?? []) as CourseWorkflowAssignmentResource[]).reduce(
    (map, row) => {
      const list = map.get(row.assignment_key) ?? [];
      list.push(row);
      map.set(row.assignment_key, list);
      return map;
    },
    new Map<string, CourseWorkflowAssignmentResource[]>(),
  );
  const submissions = new Map(
    ((submissionResult.data ?? []) as CourseWorkflowAssignmentSubmission[]).map((row) => [
      row.assignment_key,
      row,
    ]),
  );

  return assignments.map((assignment) => {
    const accessRow = access.get(assignment.assignment_key);
    const unlocked = Boolean(accessRow?.unlocked);
    const submission = submissions.get(assignment.assignment_key) ?? null;

    return {
      courseSlug,
      assignmentKey: assignment.assignment_key,
      title: assignment.title,
      subtitle: assignment.subtitle,
      overview: assignment.overview,
      position: assignment.position,
      unlocked,
      source: accessRow?.source ?? null,
      lockReason: accessRow?.reason ?? null,
      status: statusFor(unlocked, submission),
      resources: resources.get(assignment.assignment_key) ?? [],
      submission,
    };
  });
}

export async function getStudentCourseWorkflowAssignment(
  userKey: string,
  assignmentKey: string,
  courseSlug = COURSE_WORKFLOW_COURSE_SLUG,
) {
  const assignments = await getStudentCourseWorkflowAssignments(userKey, courseSlug);
  return assignments.find((assignment) => assignment.assignmentKey === assignmentKey) ?? null;
}

export async function getAdminCourseWorkflowAssignmentSnapshot(): Promise<{
  students: AdminCourseWorkflowStudent[];
  adminResources: CourseWorkflowAssignmentResource[];
}> {
  noStore();
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { students: [], adminResources: [] };
  }

  const [profilesResult, enrollmentsResult, adminResourceResult] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("user_key,first_name,last_name,email,phone,batch_number")
      .order("first_name", { ascending: true }),
    supabase
      .from("course_enrollments")
      .select("user_key,source")
      .eq("course_slug", COURSE_WORKFLOW_COURSE_SLUG)
      .eq("status", "active"),
    supabase
      .from("course_assignment_resources")
      .select("*")
      .eq("course_slug", COURSE_WORKFLOW_COURSE_SLUG)
      .eq("audience", "admin")
      .order("position", { ascending: true }),
  ]);

  const enrolled = new Map(
    ((enrollmentsResult.data ?? []) as { user_key: string; source: string | null }[]).map(
      (row) => [row.user_key, row.source],
    ),
  );
  const profiles = ((profilesResult.data ?? []) as Array<{
    user_key: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    batch_number: number | null;
  }>).filter((profile) => enrolled.has(profile.user_key));

  const students = await Promise.all(
    profiles.map(async (profile) => ({
      userKey: profile.user_key,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      phone: profile.phone,
      batchNumber: profile.batch_number ?? 2,
      source: enrolled.get(profile.user_key) ?? null,
      assignments: await getStudentCourseWorkflowAssignments(profile.user_key),
    })),
  );

  return {
    students,
    adminResources: (adminResourceResult.data ?? []) as CourseWorkflowAssignmentResource[],
  };
}

export async function getAssignmentResourceForStudent(input: {
  userKey: string;
  resourceId: string;
  mode: "preview" | "download";
  format?: "pdf" | "docx";
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const { data: resource } = await supabase
    .from("course_assignment_resources")
    .select("*")
    .eq("id", input.resourceId)
    .eq("audience", "student")
    .maybeSingle();

  if (!resource) return null;

  const row = resource as CourseWorkflowAssignmentResource;

  if (input.mode === "download" && !row.downloadable) {
    return null;
  }

  const { data: access } = await supabase
    .from("student_assignment_access")
    .select("id")
    .eq("user_key", input.userKey)
    .eq("course_slug", row.course_slug)
    .eq("assignment_key", row.assignment_key)
    .eq("unlocked", true)
    .maybeSingle();

  if (!access) return null;

  const wantsPdfDownload = input.mode === "download" && input.format === "pdf";
  const bucket = input.mode === "preview" || wantsPdfDownload ? row.preview_bucket : row.original_bucket;
  const path = input.mode === "preview" || wantsPdfDownload ? row.preview_path : row.original_path;
  const mimeType =
    input.mode === "preview" || wantsPdfDownload ? row.preview_mime_type : row.original_mime_type;

  if (!path) return null;

  const extension = path.split(".").pop();
  const title = extension && !row.title.toLowerCase().endsWith(`.${extension.toLowerCase()}`)
    ? `${row.title}.${extension}`
    : row.title;

  return { bucket, path, mimeType, title };
}

export async function getAssignmentResourceForAdmin(resourceId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const { data: resource } = await supabase
    .from("course_assignment_resources")
    .select("*")
    .eq("id", resourceId)
    .maybeSingle();

  if (!resource) return null;

  const row = resource as CourseWorkflowAssignmentResource;
  const path = row.original_path ?? row.preview_path;
  const bucket = row.original_path ? row.original_bucket : row.preview_bucket;
  const mimeType = row.original_path ? row.original_mime_type : row.preview_mime_type;

  if (!path) return null;

  return { bucket, path, mimeType, title: row.title };
}

export async function getAssignmentSubmissionForAdmin(submissionId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) return null;

  const { data } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (!data) return null;

  const submission = data as CourseWorkflowAssignmentSubmission;
  return {
    bucket: submission.file_bucket,
    path: submission.file_path,
    mimeType: submission.mime_type,
    title: submission.file_name,
  };
}

export async function setStudentAssignmentAccess(input: {
  userKey: string;
  assignmentKey: string;
  unlocked: boolean;
  adminEmail: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.from("student_assignment_access").upsert(
    {
      user_key: input.userKey,
      course_slug: COURSE_WORKFLOW_COURSE_SLUG,
      assignment_key: input.assignmentKey,
      unlocked: input.unlocked,
      reason: input.unlocked
        ? `Unlocked by ${input.adminEmail}`
        : `Locked by ${input.adminEmail}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_key,course_slug,assignment_key" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function reviewAssignmentSubmission(input: {
  submissionId: string;
  status: "satisfactory" | "not_satisfactory";
  adminComment: string;
  reviewedBy: string;
}) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("assignment_submissions")
    .update({
      status: input.status,
      admin_comment: input.adminComment || null,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId);

  if (error) {
    throw new Error(error.message);
  }
}
