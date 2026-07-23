import { AuthShell } from "@/components/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      mode="sign-in"
      title="Reset password"
      subtitle="We’ll email you a secure link so you can set a new password."
    >
      <ForgotPasswordForm errorMessage={params.error ? decodeURIComponent(params.error) : undefined} />
    </AuthShell>
  );
}
