import { CourseCard } from "@/components/courses/course-card";
import { CourseRetry } from "@/components/courses/course-retry";
import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import {
  courseDiscoverMetaLabel,
  loadDiscoverableCourseMeta,
  loadDiscoverableCourses,
  loadDiscoverableLessonTitles,
} from "@/lib/courses";
import {
  filterCoursesForEducationSearch,
  parseEducationSearchQuery,
} from "@/lib/education-search";
import { signedEducationCoverUrls } from "@/lib/s3-education";
import { SOCIAL } from "@/lib/social";
import { requireSocialSession } from "@/lib/social-session";

function firstSearchValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function SocialCoursesPage(props?: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = props?.searchParams;
  const [{ supabase }, sp] = await Promise.all([
    requireSocialSession(),
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const q = parseEducationSearchQuery(firstSearchValue(sp.q));
  const { courses, failed } = await loadDiscoverableCourses(supabase);
  const [covers, meta, lessonTitles] = failed
    ? [new Map<string, string>(), new Map(), new Map<string, string[]>()]
    : await Promise.all([
        signedEducationCoverUrls(courses),
        loadDiscoverableCourseMeta(supabase, courses),
        q ? loadDiscoverableLessonTitles(supabase, courses) : Promise.resolve(new Map<string, string[]>()),
      ]);
  const visible = failed ? [] : filterCoursesForEducationSearch(courses, q, lessonTitles);

  return (
    <div data-social-courses="" data-education-courses="">
      <PageHeader title={SOCIAL.courses.title} subtitle={SOCIAL.courses.subtitle} />
      {failed ? (
        <div data-course-error="" className="flex flex-col items-start gap-[var(--space-3)]">
          <HouseEmpty>{SOCIAL.courses.error}</HouseEmpty>
          <CourseRetry label={SOCIAL.courses.retry} />
        </div>
      ) : null}
      {!failed && visible.length === 0 ? <HouseEmpty>{SOCIAL.courses.empty}</HouseEmpty> : null}
      {!failed && visible.length > 0 ? (
        <ul
          data-course-grid=""
          className="grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-2"
        >
          {visible.map((course) => (
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
