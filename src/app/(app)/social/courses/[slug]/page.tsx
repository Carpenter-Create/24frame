import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { loadCourseDetail } from "@/lib/courses";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { slug } = await params;
  const supabase = await createClient();
  const detail = await loadCourseDetail(supabase, slug, ctx.user.id);

  if (!detail.course) {
    return (
      <div data-social-course-missing="">
        <PageHeader title={SOCIAL.courses.title} backLink={{ href: SOCIAL_ROUTES.courses }} />
        <HouseEmpty>{SOCIAL.courses.missing}</HouseEmpty>
      </div>
    );
  }

  return (
    <div data-social-course={detail.course.slug}>
      <PageHeader
        title={detail.course.title}
        subtitle={detail.course.description ?? undefined}
        backLink={{ href: SOCIAL_ROUTES.courses, label: SOCIAL.courses.title }}
      />
      {!detail.hasAccess ? (
        <p data-course-denied="" className="t-body text-ink-2">
          {SOCIAL.courses.denied}
        </p>
      ) : null}
      {detail.hasAccess && detail.modules.length === 0 ? (
        <HouseEmpty>{SOCIAL.courses.empty}</HouseEmpty>
      ) : null}
      {detail.modules.length > 0 ? (
        <section data-course-modules="" className="mt-[var(--space-6)]">
          <h2 className="t-label text-ink-3">{SOCIAL.courses.modules}</h2>
          <ol className="mt-[var(--space-3)] flex flex-col gap-[var(--space-6)]">
            {detail.modules.map((module) => (
              <li key={module.id} data-course-module={module.id}>
                <h3 className="t-body font-medium text-ink">{module.title}</h3>
                {module.lessons.length === 0 ? (
                  <p className="mt-[var(--space-2)] t-body-sm text-ink-3">{SOCIAL.courses.empty}</p>
                ) : (
                  <ol className="mt-[var(--space-2)] flex flex-col gap-[var(--space-2)]">
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        data-course-lesson={lesson.id}
                        data-course-preview={lesson.free_preview && !detail.hasAccess ? "" : undefined}
                        className="t-body-sm text-ink-2"
                      >
                        {lesson.title}
                        {lesson.free_preview && !detail.hasAccess ? (
                          <span className="text-ink-3"> ({SOCIAL.courses.preview})</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
