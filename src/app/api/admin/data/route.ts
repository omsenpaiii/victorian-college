import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import {
  archiveAdminStudent,
  archiveAdminCourse,
  getAdminSnapshot,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  restoreAdminCourse,
  restoreAdminStudent,
  reviewAdminAssignment,
  updateAdminAssignmentAccess,
  upsertAdminCourse,
  upsertAdminLesson,
  upsertAdminStudent,
} from "@/lib/admin-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = await requireAdmin();
    return NextResponse.json(await getAdminSnapshot(admin.email));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unauthorized." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const action = String(body?.action ?? "");
    const payload = body?.payload;

    if (action === "upsert-course") {
      await upsertAdminCourse(payload);
    } else if (action === "upsert-lesson") {
      await upsertAdminLesson(payload);
    } else if (action === "upsert-student") {
      await upsertAdminStudent(payload);
    } else if (action === "archive-student") {
      await archiveAdminStudent(payload, admin.email);
    } else if (action === "restore-student") {
      await restoreAdminStudent(payload);
    } else if (action === "archive-course") {
      await archiveAdminCourse(String(payload?.slug ?? ""), admin.email);
    } else if (action === "restore-course") {
      await restoreAdminCourse(String(payload?.slug ?? ""));
    } else if (action === "mark-notification-read") {
      await markAdminNotificationRead(payload, admin.email);
    } else if (action === "mark-all-notifications-read") {
      await markAllAdminNotificationsRead(
        Array.isArray(payload?.eventKeys) ? payload.eventKeys.map(String) : [],
        admin.email,
      );
    } else if (action === "review-assignment") {
      await reviewAdminAssignment(payload, admin.email);
    } else if (action === "update-assignment-access") {
      await updateAdminAssignmentAccess(payload, admin.email);
    } else {
      return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
    }

    return NextResponse.json({ success: true, snapshot: await getAdminSnapshot(admin.email) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin action failed." },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 400 },
    );
  }
}
