import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type SubmitRouteProps = {
  params: Promise<{ courseSlug: string; assignmentKey: string }>;
};

function safeFileName(value: string) {
  return value.replace(/[^\w.\-()\s]/g, "_").replace(/\s+/g, "_").slice(0, 140);
}

export async function POST(request: Request, { params }: SubmitRouteProps) {
  const user = await getCurrentUser();
  const supabase = getSupabaseAdmin();

  if (!user || !supabase) {
    return NextResponse.json({ error: "Student access is not available." }, { status: 401 });
  }

  const { courseSlug, assignmentKey } = await params;
  const { data: access } = await supabase
    .from("student_assignment_access")
    .select("id")
    .eq("user_key", user.id)
    .eq("course_slug", courseSlug)
    .eq("assignment_key", assignmentKey)
    .eq("unlocked", true)
    .maybeSingle();

  if (!access) {
    return NextResponse.json({ error: "This assignment is locked." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const studentComment = String(formData.get("studentComment") || "").trim().slice(0, 4000);

  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Choose an assessment file to upload." }, { status: 400 });
  }

  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ error: "Uploads must be 50MB or smaller." }, { status: 400 });
  }

  const previous = await supabase
    .from("assignment_submissions")
    .select("file_path,resubmission_count")
    .eq("user_key", user.id)
    .eq("course_slug", courseSlug)
    .eq("assignment_key", assignmentKey)
    .maybeSingle();

  const fileName = safeFileName(file.name || `${assignmentKey}-submission`);
  const path = `${user.id}/${assignmentKey}/${Date.now()}-${fileName}`;
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
      user_key: user.id,
      course_slug: courseSlug,
      assignment_key: assignmentKey,
      file_bucket: "student-submissions",
      file_path: path,
      file_name: fileName,
      mime_type: file.type || null,
      file_size: file.size,
      status: "submitted",
      student_comment: studentComment || null,
      resubmission_count: previous.data ? Number(previous.data.resubmission_count ?? 0) + 1 : 0,
      submitted_by: "student",
      uploaded_by_admin_email: null,
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

  return NextResponse.json({ success: true });
}
