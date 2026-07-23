import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${url.origin}/auth/callback`,
      },
    });

    if (error || !data.url) {
      const errorUrl = new URL("/sign-in", url.origin);
      errorUrl.searchParams.set("error", error?.message ?? "Unable to start Google sign in.");
      return NextResponse.redirect(errorUrl);
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    const errorUrl = new URL("/sign-in", url.origin);
    errorUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to start Google sign in.",
    );
    return NextResponse.redirect(errorUrl);
  }
}
