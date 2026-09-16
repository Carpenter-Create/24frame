import type { EducationAdminCourseRow, InstructorRow } from "@/lib/education-admin";

import { EducationCourseRail } from "./education-course-rail";

export function EducationStaffShell({
  courses,
  instructors,
  children,
}: {
  courses: EducationAdminCourseRow[];
  instructors: InstructorRow[];
  children: React.ReactNode;
}) {
  return (
    <div data-gc-education="" className="flex flex-col gap-[var(--space-6)] lg:flex-row">
      <EducationCourseRail courses={courses} instructors={instructors} />
      <div className="min-w-0 flex-1" data-education-main="">
        {children}
      </div>
    </div>
  );
}
