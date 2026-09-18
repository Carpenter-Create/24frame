import Link from "next/link";

import { CourseCover } from "@/components/courses/course-cover";
import { SocialAvatar } from "@/components/social/social-ui";
import { PageHeader } from "@/components/ui/page-header";
import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { DASHBOARD_HREF } from "@/lib/dashboard-admin";
import { HOUSE_CARD_PAD, HOUSE_MODULE_CLASS } from "@/lib/house-shell";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { SOCIAL_ROUTES } from "@/lib/social";
import { WORKSPACE_EDUCATION_HREF } from "@/lib/workspace-menu";
import {
  OVERVIEW,
  OVERVIEW_AI_CHIPS,
  overviewCoursePercentLabel,
  overviewRevenueLabel,
  overviewSocialUnreadLabel,
  overviewTopPerformersLine,
  type OverviewCourse,
  type OverviewPulseModel,
} from "@/lib/overview";

const MODULE_STACK_CLASS = "flex flex-col gap-[var(--space-6)]";
const MODULE_CLASS = `${HOUSE_MODULE_CLASS} ${HOUSE_CARD_PAD} flex flex-col gap-[var(--space-3)]`;
const STRIP_CLASS = "flex flex-col gap-[var(--space-4)] md:flex-row md:flex-wrap md:items-start md:gap-[var(--space-8)]";
const COVER_ROW_CLASS =
  "grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3 lg:grid-cols-5";

export function OverviewPulse({ model }: { model: OverviewPulseModel }) {
  const revenue = overviewRevenueLabel(model.revenueCents);
  const topLine = overviewTopPerformersLine(model.topTitleNames);

  return (
    <div data-overview-pulse="" className={MODULE_STACK_CLASS}>
      <PageHeader title={OVERVIEW.title} subtitle={OVERVIEW.subtitle} />

      <section data-overview-aggregation="" className={MODULE_CLASS}>
        <h2 className="t-heading text-ink">{OVERVIEW.aggregation}</h2>
        <div className={STRIP_CLASS}>
          <div>
            <p className="t-label text-ink-3">{OVERVIEW.revenue}</p>
            <p className="t-title text-ink">{revenue ?? "—"}</p>
            <p className="t-label text-ink-3">{OVERVIEW.ytdReports}</p>
          </div>
          <div>
            <p className="t-label text-ink-3">{OVERVIEW.topPerformers}</p>
            <p className="t-body text-ink">{topLine ?? DASHBOARD_HOME.topTitlesEmpty}</p>
            <Link href="/titles" className={TEXT_ACTION_CLASS}>
              {OVERVIEW.viewTitles}
            </Link>
          </div>
          <div>
            <Link href={DASHBOARD_HREF} className={TEXT_ACTION_CLASS}>
              {OVERVIEW.openDashboard}
            </Link>
          </div>
        </div>
      </section>

      {model.socialEntered ? (
        <section data-overview-social="" className={MODULE_CLASS}>
          <h2 className="t-heading text-ink">{OVERVIEW.social}</h2>
          <div className={STRIP_CLASS}>
            <div>
              <p className="t-label text-ink-3">{OVERVIEW.unread}</p>
              <p className="t-body text-ink">{overviewSocialUnreadLabel(model.socialUnread)}</p>
            </div>
            {model.socialAvatars.length > 0 ? (
              <div data-overview-social-avatars="" className="flex items-center gap-[var(--space-2)]">
                {model.socialAvatars.map((avatar) => (
                  <SocialAvatar
                    key={avatar.id}
                    name={avatar.name}
                    photoUrl={avatar.photoUrl}
                    size="sm"
                  />
                ))}
              </div>
            ) : null}
            <Link href={SOCIAL_ROUTES.home} className={TEXT_ACTION_CLASS}>
              {OVERVIEW.openSocial}
            </Link>
          </div>
        </section>
      ) : (
        <section data-overview-social-empty="" className={MODULE_CLASS}>
          <h2 className="t-heading text-ink">{OVERVIEW.social}</h2>
          <p className="t-body text-ink">{OVERVIEW.socialEmptyTitle}</p>
          <p className="t-body-sm text-ink-3">{OVERVIEW.socialEmptyBody}</p>
          <Link href={SOCIAL_ROUTES.home} className={TEXT_ACTION_CLASS}>
            {OVERVIEW.enterSocial}
          </Link>
        </section>
      )}

      {model.courses.length > 0 ? (
        <section data-overview-education="" className={MODULE_CLASS}>
          <h2 className="t-heading text-ink">{OVERVIEW.education}</h2>
          <ul data-overview-education-covers="" className={COVER_ROW_CLASS}>
            {model.courses.map((course) => (
              <OverviewCourseCover key={course.id} course={course} />
            ))}
          </ul>
          <Link href={WORKSPACE_EDUCATION_HREF} className={TEXT_ACTION_CLASS}>
            {OVERVIEW.openEducation}
          </Link>
        </section>
      ) : (
        <section data-overview-education-empty="" className={MODULE_CLASS}>
          <h2 className="t-heading text-ink">{OVERVIEW.education}</h2>
          <p className="t-body text-ink">{OVERVIEW.educationEmptyTitle}</p>
          <p className="t-body-sm text-ink-3">{OVERVIEW.educationEmptyBody}</p>
          <Link href={WORKSPACE_EDUCATION_HREF} className={TEXT_ACTION_CLASS}>
            {OVERVIEW.enterEducation}
          </Link>
        </section>
      )}

      <section data-overview-needs-you="" className={MODULE_CLASS}>
        <h2 className="t-heading text-ink">{OVERVIEW.needsYou}</h2>
        {model.needsYou.length === 0 ? (
          <p className="t-body-sm text-ink-3">{OVERVIEW.needsYouEmpty}</p>
        ) : (
          <ul className="flex flex-col">
            {model.needsYou.map((row) => (
              <li key={row.id} className="border-b border-hairline last:border-b-0">
                <Link
                  href={row.href}
                  className="flex flex-col gap-[var(--space-2)] py-[var(--space-3)] md:flex-row md:items-center md:justify-between"
                >
                  <span className="t-body text-ink">{row.title}</span>
                  <span className="t-body-sm text-ink-3">{row.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section data-overview-this-week="" className={MODULE_CLASS}>
        <h2 className="t-heading text-ink">{OVERVIEW.thisWeek}</h2>
        <p className="t-body text-ink">{model.thisWeek ?? OVERVIEW.thisWeekEmpty}</p>
      </section>

      <section data-overview-ai-next="" className={MODULE_CLASS}>
        <h2 className="t-heading text-ink">{OVERVIEW.aiNext}</h2>
        <div className="flex flex-col gap-[var(--space-2)] md:flex-row md:flex-wrap">
          {OVERVIEW_AI_CHIPS.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="rounded-full bg-surface px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewCourseCover({ course }: { course: OverviewCourse }) {
  const percent = overviewCoursePercentLabel(course.percent);
  return (
    <li className="min-w-0">
      <Link href={course.href} className="flex flex-col gap-[var(--space-2)]">
        <CourseCover title={course.title} src={course.coverUrl} />
        <span className="t-body-sm text-ink">{course.title}</span>
        {percent ? (
          <span data-overview-course-percent="" className="flex flex-col gap-[var(--space-1)]">
            <span className="block h-1.5 overflow-hidden rounded-full bg-surface">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${Math.round(course.percent ?? 0)}%` }}
              />
            </span>
            <span className="t-label text-ink-3">{percent}</span>
          </span>
        ) : null}
      </Link>
    </li>
  );
}
