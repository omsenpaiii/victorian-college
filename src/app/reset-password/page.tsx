import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  if (!isSupabaseAuthConfigured()) {
    redirect("/sign-in");
  }

  const user = await getCurrentUser();

  return (
    <AuthShell
      mode="sign-in"
      title="Set a new password"
      subtitle={
        user
          ? `Securely update the password for ${user.email}.`
          : "Open the recovery link from your email to continue."
      }
    >
      <ResetPasswordForm errorMessage={params.error ? decodeURIComponent(params.error) : undefined} />
    </AuthShell>
  );
}
