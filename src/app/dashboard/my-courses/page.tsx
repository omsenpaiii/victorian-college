import { MyCoursesView } from "@/components/student/MyCoursesView";
import { getCurrentUser } from "@/lib/auth";
import { getStudentPortalData } from "@/lib/student-portal";

export default async function MyCoursesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const portalData = await getStudentPortalData(user);
  return <MyCoursesView courses={portalData.courses} />;
}
