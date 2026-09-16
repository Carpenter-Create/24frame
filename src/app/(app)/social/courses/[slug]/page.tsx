import { CourseConsume } from "@/components/courses/course-consume";
import { CourseRetry } from "@/components/courses/course-retry";
import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { loadCourseDetail, loadCourseInstructorName } from "@/lib/courses";
import { attachEducationLessonPlayback, signedEducationCoverUrl } from "@/lib/s3-education";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { requireSocialSession } from "@/lib/social-session";

export default async function SocialCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [session, { slug }] = await Promise.all([requireSocialSession(), params]);
  const { ctx, supabase } = session;
  const loaded = await loadCourseDetail(supabase, slug, ctx.user.id);
  const [modules, coverUrl, instructorName] = loaded.course
    ? await Promise.all([
        attachEducationLessonPlayback(loaded.modules),
        loaded.course.cover_key
          ? signedEducationCoverUrl(loaded.course.cover_key)
          : Promise.resolve(null),
        loadCourseInstructorName(supabase, loaded.course.instructor_id),
      ])
    : [loaded.modules, null, null];
  const detail = { ...loaded, modules };

  if (detail.failed) {
    return (
      <div data-social-course-error="">
        <PageHeader
          title={SOCIAL.courses.title}
          backLink={{ href: SOCIAL_ROUTES.courses, label: SOCIAL.courses.title }}
        />
        <div data-course-error="" className="flex flex-col items-start gap-[var(--space-3)]">
          <HouseEmpty>{SOCIAL.courses.detailError}</HouseEmpty>
          <CourseRetry label={SOCIAL.courses.retry} />
        </div>
      </div>
    );
  }

  if (!detail.course) {
    return (
      <div data-social-course-missing="">
        <PageHeader
          title={SOCIAL.courses.title}
          backLink={{ href: SOCIAL_ROUTES.courses, label: SOCIAL.courses.title }}
        />
        <HouseEmpty>{SOCIAL.courses.missing}</HouseEmpty>
      </div>
    );
  }

  return (
    <div data-social-course={detail.course.slug}>
      <PageHeader
        title={detail.course.title}
        backLink={{ href: SOCIAL_ROUTES.courses, label: SOCIAL.courses.title }}
        className="pb-0"
      />
      {instructorName ? (
        <p data-course-instructor="" className="mt-[var(--space-2)] t-body-sm text-ink-3">
          {instructorName}
        </p>
      ) : null}
      {detail.course.description ? (
        <p className="mt-[var(--space-4)] t-body text-ink-2">{detail.course.description}</p>
      ) : null}
      {!detail.hasAccess ? (
        <div data-course-denied="" className="mt-[var(--space-6)]">
          <HouseEmpty>{SOCIAL.courses.denied}</HouseEmpty>
        </div>
      ) : null}
      {detail.hasAccess && detail.modules.length === 0 ? (
        <div className="mt-[var(--space-6)]">
          <HouseEmpty>{SOCIAL.courses.empty}</HouseEmpty>
        </div>
      ) : null}
      {detail.modules.length > 0 ? (
        <div className="mt-[var(--space-12)]">
          <CourseConsume
            modules={detail.modules}
            hasAccess={detail.hasAccess}
            coverUrl={coverUrl}
          />
        </div>
      ) : null}
    </div>
  );
}
