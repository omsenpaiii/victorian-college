import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

function signInUrl(request: Request) {
  const url = new URL(request.url);
  return new URL("/sign-in?message=signed-out", url.origin);
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Sign-out should stay best-effort and always land the user on the site.
  }

  const destination = signInUrl(request);

  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ redirectUrl: destination.pathname + destination.search });
  }

  return NextResponse.redirect(destination, { status: 303 });
}

export async function GET(request: Request) {
  return NextResponse.redirect(signInUrl(request), { status: 303 });
}
