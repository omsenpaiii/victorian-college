import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAssignmentResourceForStudent } from "@/lib/course-workflow";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type ResourceRouteProps = {
  params: Promise<{ resourceId: string }>;
};

function contentDisposition(mode: string, title: string) {
  const safe = title.replace(/[^\w\s.-]/g, "").trim() || "resource";
  return mode === "download" ? `attachment; filename="${safe}"` : `inline; filename="${safe}"`;
}

export async function GET(request: Request, { params }: ResourceRouteProps) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { resourceId } = await params;
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "download" ? "download" : "preview";
  const format = url.searchParams.get("format") === "docx" ? "docx" : "pdf";
  const file = await getAssignmentResourceForStudent({
    userKey: user.id,
    resourceId,
    mode,
    format,
  });

  if (!file) {
    return NextResponse.json({ error: "Resource not available." }, { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!.storage.from(file.bucket).download(file.path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Unable to load resource." }, { status: 404 });
  }

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": file.mimeType ?? "application/octet-stream",
      "Content-Disposition": contentDisposition(mode, file.title),
      "Cache-Control": "private, no-store",
    },
  });
}
