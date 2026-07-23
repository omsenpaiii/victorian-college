import { connection } from "next/server";
import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/auth/AuthForms";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

type SignInPageProps = {
  searchParams: Promise<{
    redirect_url?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  await connection();
  const params = await searchParams;

  if (!isSupabaseAuthConfigured()) {
    return (
      <SetupNotice
        title="Add Supabase auth keys to enable sign in"
        items={[
          "NEXT_PUBLIC_SUPABASE_URL",
          "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
          "VCK_ADMIN_EMAILS",
        ]}
      />
    );
  }

  return (
    <AuthShell
      mode="sign-in"
      title="Welcome back"
      subtitle="Sign in to access the VCK admin portal."
    >
      <SignInForm
        redirectUrl={params.redirect_url}
        errorMessage={params.error ? decodeURIComponent(params.error) : undefined}
        successMessage={params.success ? decodeURIComponent(params.success) : undefined}
      />
    </AuthShell>
  );
}
