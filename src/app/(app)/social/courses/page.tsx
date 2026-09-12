import Link from "next/link";
import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { loadDiscoverableCourses } from "@/lib/courses";
import { SOCIAL, socialCourseHref } from "@/lib/social";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialCoursesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const courses = await loadDiscoverableCourses(supabase);

  return (
    <div data-social-courses="">
      <PageHeader title={SOCIAL.courses.title} subtitle={SOCIAL.courses.subtitle} />
      {courses.length === 0 ? (
        <HouseEmpty>{SOCIAL.courses.empty}</HouseEmpty>
      ) : (
        <ul className="flex flex-col gap-[var(--space-3)]">
          {courses.map((course) => (
            <li key={course.id} data-course-row={course.slug}>
              <Link href={socialCourseHref(course.slug)} className="t-body font-medium text-ink">
                {course.title}
              </Link>
              {course.description ? (
                <p className="t-body-sm text-ink-3">{course.description}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
