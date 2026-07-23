import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAdminSnapshot } from "@/lib/admin-data";
import { COURSE_WORKFLOW_COURSE_SLUG } from "@/lib/course-workflow";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function safeFileName(value: string) {
  return value.replace(/[^\w.\-()\s]/g, "_").replace(/\s+/g, "_").slice(0, 140);
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
    }

    const formData = await request.formData();
    const userKey = String(formData.get("userKey") ?? "").trim();
    const assignmentKey = String(formData.get("assignmentKey") ?? "").trim();
    const studentComment = String(formData.get("studentComment") ?? "").trim().slice(0, 4000);
    const file = formData.get("file");

    if (!userKey || !assignmentKey) {
      return NextResponse.json({ error: "Missing student or cluster details." }, { status: 400 });
    }

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Choose an assessment file to upload." }, { status: 400 });
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Uploads must be 50MB or smaller." }, { status: 400 });
    }

    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("user_key", userKey)
      .eq("course_slug", COURSE_WORKFLOW_COURSE_SLUG)
      .eq("status", "active")
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: "Student is not actively enrolled in this course." }, { status: 403 });
    }

    const { data: access } = await supabase
      .from("student_assignment_access")
      .select("id")
      .eq("user_key", userKey)
      .eq("course_slug", COURSE_WORKFLOW_COURSE_SLUG)
      .eq("assignment_key", assignmentKey)
      .eq("unlocked", true)
      .maybeSingle();

    if (!access) {
      return NextResponse.json(
        { error: "Unlock this cluster before uploading on behalf of the learner." },
        { status: 403 },
      );
    }

    const previous = await supabase
      .from("assignment_submissions")
      .select("file_path,resubmission_count")
      .eq("user_key", userKey)
      .eq("course_slug", COURSE_WORKFLOW_COURSE_SLUG)
      .eq("assignment_key", assignmentKey)
      .maybeSingle();

    const fileName = safeFileName(file.name || `${assignmentKey}-submission`);
    const path = `${userKey}/${assignmentKey}/${Date.now()}-${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("student-submissions")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { error: upsertError } = await supabase.from("assignment_submissions").upsert(
      {
        user_key: userKey,
        course_slug: COURSE_WORKFLOW_COURSE_SLUG,
        assignment_key: assignmentKey,
        file_bucket: "student-submissions",
        file_path: path,
        file_name: fileName,
        mime_type: file.type || null,
        file_size: file.size,
        status: "submitted",
        student_comment: studentComment || null,
        resubmission_count: previous.data ? Number(previous.data.resubmission_count ?? 0) + 1 : 0,
        submitted_by: "admin",
        uploaded_by_admin_email: admin.email,
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_key,course_slug,assignment_key" },
    );

    if (upsertError) {
      await supabase.storage.from("student-submissions").remove([path]);
      return NextResponse.json({ error: upsertError.message }, { status: 400 });
    }

    const previousPath = previous.data?.file_path;
    if (previousPath && previousPath !== path) {
      await supabase.storage.from("student-submissions").remove([previousPath]);
    }

    return NextResponse.json({ success: true, snapshot: await getAdminSnapshot() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized admin request." },
      { status: 401 },
    );
  }
}
