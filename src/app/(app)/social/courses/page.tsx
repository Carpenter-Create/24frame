import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { loadDiscoverableCourses } from "@/lib/courses";
import { SOCIAL, socialCourseHref } from "@/lib/social";
import { requireSocialSession } from "@/lib/social-session";

export default async function SocialCoursesPage() {
  const { supabase } = await requireSocialSession();
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
