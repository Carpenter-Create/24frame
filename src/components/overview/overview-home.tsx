import Link from "next/link";

import { CourseCard } from "@/components/courses/course-card";
import { TextAction } from "@/components/chrome/house";
import {
  DashboardHomeEmpty,
  DashboardHomePanel,
} from "@/components/dashboard/dashboard-home";
import { OverviewModule } from "@/components/overview/overview-module";
import { NewsRail } from "@/components/news/news-rail";
import { PageHeader } from "@/components/ui/page-header";
import type { CourseRow } from "@/lib/courses";
import type { DashboardPeriod } from "@/lib/dashboard-admin";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import type { ClientHomeDoNextItem, DashboardChangeRow } from "@/lib/dashboard-home";
import { formatUsdCents } from "@/lib/finance";
import type { NewsItem } from "@/lib/news";
import {
  OVERVIEW_AREA_AI_CLASS,
  OVERVIEW_AREA_EDUCATION_CLASS,
  OVERVIEW_AREA_NEEDS_CLASS,
  OVERVIEW_AREA_NEWS_CLASS,
  OVERVIEW_AREA_REVENUE_CLASS,
  OVERVIEW_AREA_SOCIAL_CLASS,
  OVERVIEW_HOME_LAYOUT_CLASS,
  OVERVIEW_MODULE_NEST_CLASS,
  OVERVIEW_PAGE,
  overviewHref,
} from "@/lib/overview";
import {
  REPORTS_PERIOD_CHIP_CLASS,
  REPORTS_PERIOD_CHIP_OFF_CLASS,
  REPORTS_PERIOD_CHIP_ON_CLASS,
} from "@/lib/reports-craft";
import { REPORTS_PERIOD_PRESETS, reportsPeriodPresetKey } from "@/lib/reports";
import { SOCIAL_AVATAR_32_CLASS } from "@/lib/social-chrome";
import type { SocialHomeChat } from "@/lib/social-home-chats";
import { socialDmHref, socialInitials } from "@/lib/social";
import { cn } from "@/lib/cn";

// Home IA v2 order rewrite — Net revenue first. News is the right
// rail on desktop and the last full-width stack on phone (after AI).
// This-week pulse stays with Net revenue. Social stays avatars-only.
// Period chips are the Aggregation/Finance house presets — not a
// Home lookalike. Top performing is not on Home.

export function OverviewHome({
  revenueCents,
  period,
  socialUnread,
  socialChats,
  socialFaces,
  courses,
  courseCovers,
  courseProgress,
  needsYou,
  weekPulse,
  aiNext,
  news,
  now,
}: {
  revenueCents: number | null;
  period: DashboardPeriod;
  socialUnread: number;
  socialChats: readonly SocialHomeChat[];
  socialFaces: ReadonlyMap<string, string | null>;
  courses: readonly CourseRow[];
  courseCovers?: ReadonlyMap<string, string>;
  courseProgress?: ReadonlyMap<string, number>;
  needsYou: readonly { id: string; what: string; href: string }[];
  weekPulse: readonly DashboardChangeRow[];
  aiNext: readonly ClientHomeDoNextItem[];
  news: readonly NewsItem[];
  now: Date;
}) {
  return (
    <div data-overview="" className={cn("flex flex-col", DASHBOARD_SECTION_AIR_CLASS)}>
      <PageHeader title={OVERVIEW_PAGE.title} />

      <div data-overview-layout="" className={OVERVIEW_HOME_LAYOUT_CLASS}>
      <div className={OVERVIEW_AREA_REVENUE_CLASS}>
      <DashboardHomePanel aria-label={OVERVIEW_PAGE.revenue} data-overview-revenue="">
        <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD_LIST}`}>
          <p className={DASHBOARD_SECTION_TITLE_CLASS}>{OVERVIEW_PAGE.revenue}</p>
          <TextAction href={OVERVIEW_PAGE.revenueHref}>{OVERVIEW_PAGE.aggregation}</TextAction>
        </div>
        <div
          data-overview-revenue-period=""
          className={`flex flex-wrap items-center ${DASHBOARD_RELATED_GAP_CLASS} px-[var(--space-4)]`}
        >
          {REPORTS_PERIOD_PRESETS.map((preset) => {
            const on = period.kind === preset.grain;
            const key = reportsPeriodPresetKey(preset.grain, now);
            return (
              <Link
                key={preset.grain}
                href={overviewHref({ period: key })}
                aria-pressed={on}
                data-overview-revenue-period-chip={preset.grain}
                className={cn(
                  REPORTS_PERIOD_CHIP_CLASS,
                  on ? REPORTS_PERIOD_CHIP_ON_CLASS : REPORTS_PERIOD_CHIP_OFF_CLASS,
                )}
              >
                {preset.label}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-hairline px-[var(--space-4)] py-[var(--space-4)]">
          {revenueCents === null ? (
            <DashboardHomeEmpty>{OVERVIEW_PAGE.revenueEmpty}</DashboardHomeEmpty>
          ) : (
            <p data-overview-revenue-value="" className="t-display t-data text-ink">
              {formatUsdCents(revenueCents)}
            </p>
          )}
        </div>
        {weekPulse.length > 0 ? (
          <ul data-overview-pulse="" className={DASHBOARD_ROW_LIST_CLASS}>
            {weekPulse.map((row) => (
              <li key={row.key} data-overview-week-row={row.key} className={DASHBOARD_ROW_CLASS}>
                <span className="t-body-sm text-ink">{row.label}</span>
                <span className="t-data t-body-sm text-ink-2">{row.count}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardHomePanel>
      </div>

      <div className={OVERVIEW_AREA_SOCIAL_CLASS}>
      <OverviewModule
        testId="social"
        title={OVERVIEW_PAGE.social}
        href={OVERVIEW_PAGE.socialHref}
        empty={OVERVIEW_PAGE.socialEmpty}
      >
        {socialChats.length > 0 ? (
          <div className={`flex flex-col ${OVERVIEW_MODULE_NEST_CLASS}`}>
            <p data-overview-social-unread="" className="t-body-sm text-ink-2">
              {socialUnread} {OVERVIEW_PAGE.socialUnread}
            </p>
            <div data-overview-social-faces="" className="flex items-center gap-[var(--space-2)]">
              {socialChats.map((chat) => {
                const peerId = chat.peerIds[0];
                const photo = peerId ? socialFaces.get(peerId) : null;
                return (
                  <Link
                    key={chat.conversationId}
                    href={socialDmHref(chat.conversationId)}
                    data-overview-social-face={chat.conversationId}
                    className={SOCIAL_AVATAR_32_CLASS}
                  >
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed GET from the private avatars bucket
                      <img src={photo} alt="" className="size-full object-cover" />
                    ) : (
                      socialInitials(chat.label)
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </OverviewModule>
      </div>

      <div className={OVERVIEW_AREA_EDUCATION_CLASS}>
      <OverviewModule
        testId="education"
        title={OVERVIEW_PAGE.education}
        href={OVERVIEW_PAGE.educationHref}
        empty={OVERVIEW_PAGE.educationEmpty}
      >
        {courses.length > 0 ? (
          <ul
            data-overview-education-covers=""
            className={`grid grid-cols-1 ${OVERVIEW_MODULE_NEST_CLASS} sm:grid-cols-2 lg:grid-cols-3`}
          >
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                coverUrl={courseCovers?.get(course.id)}
                density="home"
                progressPercent={courseProgress?.get(course.id)}
              />
            ))}
          </ul>
        ) : null}
      </OverviewModule>
      </div>

      <div className={OVERVIEW_AREA_NEEDS_CLASS}>
      <OverviewModule
        testId="needs-you"
        title={OVERVIEW_PAGE.needsYou}
        href={OVERVIEW_PAGE.needsYouHref}
        empty={OVERVIEW_PAGE.needsYouEmpty}
      >
        {needsYou.length > 0 ? (
          <ul className={DASHBOARD_ROW_LIST_CLASS}>
            {needsYou.map((row) => (
              <li key={row.id} className={DASHBOARD_ROW_CLASS}>
                <Link href={row.href} className="t-body-sm font-medium text-ink">
                  {row.what}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </OverviewModule>
      </div>

      <div className={OVERVIEW_AREA_AI_CLASS}>
      <OverviewModule
        testId="ai-next"
        title={OVERVIEW_PAGE.aiNext}
        href={OVERVIEW_PAGE.aiNextHref}
        cta={OVERVIEW_PAGE.aiAsk}
        empty={OVERVIEW_PAGE.aiNextEmpty}
      >
        {aiNext.length > 0 ? (
          <ul className={DASHBOARD_ROW_LIST_CLASS}>
            {aiNext.map((row) => (
              <li key={row.id} data-overview-ai-next={row.id} className={DASHBOARD_ROW_CLASS}>
                <Link
                  href={`/titles/${row.id}`}
                  className="min-w-0 truncate t-body-sm font-medium text-ink"
                >
                  {row.title}
                </Link>
                {row.reason ? <span className="t-body-sm text-ink-3">{row.reason}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </OverviewModule>
      </div>

      <aside data-overview-news="" className={OVERVIEW_AREA_NEWS_CLASS}>
        <NewsRail items={news} now={now} viewAll />
      </aside>
      </div>
    </div>
  );
}
