import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { educationCommercialLabel, educationCourseHref, EDUCATION_ADMIN } from "@/lib/education";
import { loadDiscoverableCourses } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";

import { CreateCourseForm } from "./education-forms";

export default async function GcEducationPage() {
  const supabase = await createClient();
  const { courses, failed } = await loadDiscoverableCourses(supabase);

  return (
    <div data-gc-education="">
      <PageHeader title={EDUCATION_ADMIN.title} subtitle={EDUCATION_ADMIN.subtitle} />
      <div className="mb-[var(--space-8)]">
        <CreateCourseForm />
      </div>
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
                    {course.slug}
                    {" · "}
                    <span data-education-model="">
                      {educationCommercialLabel(course.is_flagship_free, course.price_cents)}
                    </span>
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
