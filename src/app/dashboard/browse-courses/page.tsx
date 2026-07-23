import { BrowseCoursesView } from "@/components/student/BrowseCoursesView";
import { getCurrentUser } from "@/lib/auth";
import { getStudentPortalData } from "@/lib/student-portal";

export default async function BrowseCoursesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const portalData = await getStudentPortalData(user);
  return <BrowseCoursesView courses={portalData.catalog} />;
}
