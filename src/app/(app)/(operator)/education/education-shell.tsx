import type { EducationAdminCourseRow, InstructorRow } from "@/lib/education-admin";
import { HOUSE_SECTION_AIR_CLASS } from "@/lib/house-shell";
import { cn } from "@/lib/cn";

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
    <div data-gc-education="" className={cn("flex flex-col lg:flex-row", HOUSE_SECTION_AIR_CLASS)}>
      <EducationCourseRail courses={courses} instructors={instructors} />
      <div className="min-w-0 flex-1" data-education-main="">
        {children}
      </div>
    </div>
  );
}
