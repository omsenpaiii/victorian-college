import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAdminSnapshot } from "@/lib/admin-data";
import { buildExportWorkbook, parseExcelEntity } from "@/lib/admin-excel";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    const url = new URL(request.url);
    const entity = parseExcelEntity(url.searchParams.get("entity"));
    const workbook = await buildExportWorkbook(entity, await getAdminSnapshot(admin.email));
    const buffer = await workbook.xlsx.writeBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="vck-${entity}-export.xlsx"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to export Excel file." },
      { status: 400 },
    );
  }
}
