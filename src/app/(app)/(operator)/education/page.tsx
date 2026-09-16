import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  COURSE_STATUS_LABELS,
  educationCommercialLabel,
  educationCourseHref,
  EDUCATION_ADMIN,
} from "@/lib/education";
import { loadEducationAdminCourses, loadEducationInstructors } from "@/lib/education-admin";
import { createAdminClient } from "@/lib/supabase/admin";

import { NewCourseButton } from "./education-forms";

export default async function GcEducationPage() {
  const admin = createAdminClient();
  const [{ courses, failed }, instructors] = await Promise.all([
    loadEducationAdminCourses(admin),
    loadEducationInstructors(admin),
  ]);

  return (
    <div data-gc-education="">
      <PageHeader
        title={EDUCATION_ADMIN.title}
        subtitle={EDUCATION_ADMIN.subtitle}
        actions={<NewCourseButton instructors={instructors} />}
      />
      {failed ? <HouseEmpty>{EDUCATION_ADMIN.error}</HouseEmpty> : null}
      {!failed && courses.length === 0 ? <HouseEmpty>{EDUCATION_ADMIN.empty}</HouseEmpty> : null}
      {!failed && courses.length > 0 ? (
        <ul className="flex flex-col gap-[var(--space-3)]" data-education-admin-list="">
          {courses.map((course) => (
            <li key={course.id}>
              <Card>
                <CardBody>
                  <Link href={educationCourseHref(course.slug)} className="t-body font-medium text-ink">
                    {course.title}
                  </Link>
                  <p className="mt-[var(--space-2)] t-body-sm text-ink-3">
                    <span data-education-catalog-code="">{course.catalog_code}</span>
                    {" · "}
                    {COURSE_STATUS_LABELS[course.status]}
                    {" · "}
                    {course.slug}
                    {" · "}
                    <span data-education-model="">
                      {educationCommercialLabel(course.is_flagship_free, course.price_cents)}
                    </span>
                    {course.instructor_name ? ` · ${course.instructor_name}` : ""}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
