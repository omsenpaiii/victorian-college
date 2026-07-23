import { connection } from "next/server";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/SetupNotice";
import { StudentPortalShell } from "@/components/student/StudentPortalShell";
import { getCurrentUser } from "@/lib/auth";
import { getStudentPortalData } from "@/lib/student-portal";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();

  if (!isSupabaseAuthConfigured()) {
    return (
      <SetupNotice
        title="Add Supabase auth keys to enable the student portal"
        items={["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]}
      />
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const portalData = await getStudentPortalData(user);

  return (
    <StudentPortalShell
      user={user}
      stats={{
        totalCourses: portalData.totalCourses,
        activeEnrollments: portalData.activeEnrollments,
        completedActivities: portalData.completedActivities,
        remainingActivities: portalData.remainingActivities,
      }}
    >
      {children}
    </StudentPortalShell>
  );
}
