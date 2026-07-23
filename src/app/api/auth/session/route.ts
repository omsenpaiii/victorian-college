import { NextResponse } from "next/server";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      initials: user.initials,
      dashboardHref: isAdminEmail(user.email) ? "/admin" : "/dashboard",
    },
  });
}
