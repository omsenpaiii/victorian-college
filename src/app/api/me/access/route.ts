import { NextResponse } from "next/server";
import { getUserAccess } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json({ error: "Supabase Auth is not configured yet." }, { status: 503 });
  }

  const user = await getCurrentUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ access: [], configured: false });
  }

  const access = await getUserAccess(user.id);
  return NextResponse.json({ access, configured: true });
}
