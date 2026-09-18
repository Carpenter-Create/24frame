import Link from "next/link";

import { CourseCover } from "@/components/courses/course-cover";
import { Card, CardBody, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { DASHBOARD_HREF } from "@/lib/dashboard-admin";
import { SOCIAL_ROUTES } from "@/lib/social";
import { WORKSPACE_EDUCATION_HREF } from "@/lib/workspace-menu";
import {
  OVERVIEW,
  OVERVIEW_AI_CHIPS,
  overviewCoursePercentLabel,
  overviewRevenueLabel,
  overviewSocialUnreadLabel,
  overviewTopPerformersLine,
  type OverviewPulseModel,
} from "@/lib/overview";

const MODULE_STACK_CLASS = "flex flex-col gap-[var(--space-6)]";
const MODULE_BODY_CLASS = "flex flex-col gap-[var(--space-3)]";
const COVER_ROW_CLASS =
  "grid grid-cols-2 gap-[var(--space-4)] sm:grid-cols-3 lg:grid-cols-5";

export function OverviewPulse({ model }: { model: OverviewPulseModel }) {
  const revenue = overviewRevenueLabel(model.revenueCents);
  const topLine = overviewTopPerformersLine(model.topTitleNames);

  return (
    <div data-overview-pulse="" className={MODULE_STACK_CLASS}>
      <PageHeader title={OVERVIEW.title} subtitle={OVERVIEW.subtitle} />

      <Card data-overview-aggregation="">
        <CardBody className={MODULE_BODY_CLASS}>
          <CardTitle>{OVERVIEW.aggregation}</CardTitle>
          <div className="flex flex-wrap items-start gap-[var(--space-8)]">
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
              <p className="t-label text-ink-3">Deep link</p>
              <Link href={DASHBOARD_HREF} className={TEXT_ACTION_CLASS}>
                {OVERVIEW.openDashboard}
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>

      {model.socialEntered ? (
        <Card data-overview-social="">
          <CardBody className={MODULE_BODY_CLASS}>
            <CardTitle>{OVERVIEW.social}</CardTitle>
            <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
              <div>
                <p className="t-label text-ink-3">{OVERVIEW.unread}</p>
                <p className="t-body text-ink">{overviewSocialUnreadLabel(model.socialUnread)}</p>
              </div>
              {model.socialAvatars.length > 0 ? (
                <div data-overview-social-avatars="" className="flex items-center gap-[var(--space-2)]">
                  {model.socialAvatars.map((avatar) => (
                    <span
                      key={avatar.id}
                      className="flex size-8 items-center justify-center rounded-full bg-surface-muted t-label text-ink-2"
                    >
                      {avatar.initials}
                    </span>
                  ))}
                </div>
              ) : null}
              <Link href={SOCIAL_ROUTES.home} className={TEXT_ACTION_CLASS}>
                {OVERVIEW.openSocial}
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card data-overview-social-empty="">
          <CardBody className={MODULE_BODY_CLASS}>
            <CardTitle>{OVERVIEW.social}</CardTitle>
            <p className="t-body text-ink">{OVERVIEW.socialEmptyTitle}</p>
            <p className="t-body-sm text-ink-3">{OVERVIEW.socialEmptyBody}</p>
            <Link href={SOCIAL_ROUTES.home} className={TEXT_ACTION_CLASS}>
              {OVERVIEW.enterSocial}
            </Link>
          </CardBody>
        </Card>
      )}

      <Card data-overview-education="">
        <CardBody className={MODULE_BODY_CLASS}>
          <CardTitle>{OVERVIEW.education}</CardTitle>
          {model.courses.length === 0 ? (
            <p className="t-body-sm text-ink-3">{OVERVIEW.educationEmpty}</p>
          ) : (
            <ul data-overview-education-covers="" className={COVER_ROW_CLASS}>
              {model.courses.map((course) => {
                const percent = overviewCoursePercentLabel(course.percent);
                return (
                  <li key={course.id} className="min-w-0">
                    <Link href={course.href} className="flex flex-col gap-[var(--space-2)]">
                      <CourseCover title={course.title} src={course.coverUrl} />
                      <span className="t-body-sm text-ink">{course.title}</span>
                      {percent ? (
                        <span data-overview-course-percent="" className="t-label text-ink-3">
                          {percent}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href={WORKSPACE_EDUCATION_HREF} className={TEXT_ACTION_CLASS}>
            {OVERVIEW.openEducation}
          </Link>
        </CardBody>
      </Card>

      <Card data-overview-needs-you="">
        <CardBody className={MODULE_BODY_CLASS}>
          <CardTitle>{OVERVIEW.needsYou}</CardTitle>
          {model.needsYou.length === 0 ? (
            <p className="t-body-sm text-ink-3">{OVERVIEW.needsYouEmpty}</p>
          ) : (
            <ul className="flex flex-col">
              {model.needsYou.map((row) => (
                <li key={row.id} className="border-b border-hairline last:border-b-0">
                  <Link
                    href={row.href}
                    className="flex items-center justify-between gap-[var(--space-4)] py-[var(--space-3)]"
                  >
                    <span className="t-body text-ink">{row.title}</span>
                    <span className="t-body-sm text-ink-3">{row.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card data-overview-this-week="">
        <CardBody className={MODULE_BODY_CLASS}>
          <CardTitle>{OVERVIEW.thisWeek}</CardTitle>
          <p className="t-body text-ink">{model.thisWeek ?? OVERVIEW.thisWeekEmpty}</p>
        </CardBody>
      </Card>

      <Card data-overview-ai-next="">
        <CardBody className={MODULE_BODY_CLASS}>
          <CardTitle>{OVERVIEW.aiNext}</CardTitle>
          <div className="flex flex-wrap gap-[var(--space-2)]">
            {OVERVIEW_AI_CHIPS.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="rounded-full bg-surface-muted px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
