import { CourseCard } from "@/components/courses/course-card";
import { CourseRetry } from "@/components/courses/course-retry";
import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import {
  courseDiscoverMetaLabel,
  loadDiscoverableCourseMeta,
  loadDiscoverableCourses,
} from "@/lib/courses";
import { signedEducationCoverUrls } from "@/lib/s3-education";
import { SOCIAL } from "@/lib/social";
import { requireSocialSession } from "@/lib/social-session";

export default async function SocialCoursesPage() {
  const { supabase } = await requireSocialSession();
  const { courses, failed } = await loadDiscoverableCourses(supabase);
  const [covers, meta] = failed
    ? [new Map<string, string>(), new Map()]
    : await Promise.all([
        signedEducationCoverUrls(courses),
        loadDiscoverableCourseMeta(supabase, courses),
      ]);

  return (
    <div data-social-courses="" data-education-courses="">
      <PageHeader title={SOCIAL.courses.title} subtitle={SOCIAL.courses.subtitle} />
      {failed ? (
        <div data-course-error="" className="flex flex-col items-start gap-[var(--space-3)]">
          <HouseEmpty>{SOCIAL.courses.error}</HouseEmpty>
          <CourseRetry label={SOCIAL.courses.retry} />
        </div>
      ) : null}
      {!failed && courses.length === 0 ? <HouseEmpty>{SOCIAL.courses.empty}</HouseEmpty> : null}
      {!failed && courses.length > 0 ? (
        <ul
          data-course-grid=""
          className="grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-2"
        >
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              coverUrl={covers.get(course.id)}
              metaLabel={courseDiscoverMetaLabel(meta.get(course.id) ?? { lessonCount: 0, durationSeconds: null })}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
