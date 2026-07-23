import { connection } from "next/server";
import { AuthShell } from "@/components/AuthShell";
import { SignUpForm } from "@/components/auth/AuthForms";
import { SetupNotice } from "@/components/SetupNotice";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

type SignUpPageProps = {
  searchParams: Promise<{
    redirect_url?: string;
    error?: string;
    success?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  await connection();
  const params = await searchParams;

  if (!isSupabaseAuthConfigured()) {
    return (
      <SetupNotice
        title="Add Supabase auth keys to enable student registration"
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
      mode="sign-up"
      title="Create your account"
      subtitle="Use Google or email to access your courses, lessons, and student dashboard."
    >
      <SignUpForm
        redirectUrl={params.redirect_url}
        errorMessage={params.error ? decodeURIComponent(params.error) : undefined}
        successMessage={params.success ? decodeURIComponent(params.success) : undefined}
      />
    </AuthShell>
  );
}
