import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { importWorkbook, parseExcelEntity } from "@/lib/admin-excel";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const entity = parseExcelEntity(url.searchParams.get("entity"));
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload an .xlsx file." }, { status: 400 });
    }

    const result = await importWorkbook(entity, await file.arrayBuffer());
    return NextResponse.json(result, { status: result.errors.length ? 400 : 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to import Excel file." },
      { status: 400 },
    );
  }
}
