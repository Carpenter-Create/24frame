import { loadEducationAdminCourses, loadEducationInstructors } from "@/lib/education-admin";
import { createAdminClient } from "@/lib/supabase/admin";

import { EducationStaffShell } from "./education-shell";

export default async function EducationLayout({ children }: { children: React.ReactNode }) {
  const admin = createAdminClient();
  const [{ courses, failed }, instructors] = await Promise.all([
    loadEducationAdminCourses(admin),
    loadEducationInstructors(admin),
  ]);
  return (
    <EducationStaffShell courses={failed ? [] : courses} instructors={instructors}>
      {children}
    </EducationStaffShell>
  );
}
