import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  getAssignmentResourceForAdmin,
  getAssignmentSubmissionForAdmin,
} from "@/lib/course-workflow";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

function contentDisposition(title: string, mode: "inline" | "download") {
  const safe = title.replace(/[^\w\s.-]/g, "").trim() || "file";
  return `${mode === "download" ? "attachment" : "inline"}; filename="${safe}"`;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const supabase = getSupabaseAdmin();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id") ?? "";
    const mode = url.searchParams.get("mode") === "download" ? "download" : "inline";

    const file =
      type === "submission"
        ? await getAssignmentSubmissionForAdmin(id)
        : type === "resource"
          ? await getAssignmentResourceForAdmin(id)
          : null;

    if (!file || !supabase) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const { data, error } = await supabase.storage.from(file.bucket).download(file.path);

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Unable to load file." }, { status: 404 });
    }

    return new NextResponse(await data.arrayBuffer(), {
      headers: {
        "Content-Type": file.mimeType ?? "application/octet-stream",
        "Content-Disposition": contentDisposition(file.title, mode),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 },
    );
  }
}
