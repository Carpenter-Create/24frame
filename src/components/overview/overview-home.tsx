import Link from "next/link";

import { CourseCard } from "@/components/courses/course-card";
import { TextAction } from "@/components/chrome/house";
import {
  DashboardHomeEmpty,
  DashboardHomePanel,
} from "@/components/dashboard/dashboard-home";
import {
  DashboardListPanel,
  DashboardTitleRows,
} from "@/components/dashboard/dashboard-modules";
import { PageHeader } from "@/components/ui/page-header";
import type { CourseRow } from "@/lib/courses";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import type { ClientHomeDoNextItem, ClientHomeJustInItem, DashboardChangeRow } from "@/lib/dashboard-home";
import { formatUsdCents } from "@/lib/finance";
import { OVERVIEW_PAGE, overviewModuleHeaderAction } from "@/lib/overview";
import { SOCIAL_AVATAR_32_CLASS } from "@/lib/social-chrome";
import type { SocialHomeChat } from "@/lib/social-home-chats";
import { socialDmHref, socialInitials } from "@/lib/social";
import { cn } from "@/lib/cn";

// Home IA v2 — five modules, positive first. This-week pulse folds
// into Aggregation (top performing + net revenue / pulse). Social
// stays avatars-only. House primitives only.

export function OverviewHome({
  revenueCents,
  topTitles,
  socialUnread,
  socialChats,
  socialFaces,
  courses,
  courseCovers,
  courseMeta,
  needsYou,
  weekPulse,
  aiNext,
}: {
  revenueCents: number | null;
  topTitles: readonly ClientHomeJustInItem[];
  socialUnread: number;
  socialChats: readonly SocialHomeChat[];
  socialFaces: ReadonlyMap<string, string | null>;
  courses: readonly CourseRow[];
  courseCovers: ReadonlyMap<string, string>;
  courseMeta: ReadonlyMap<string, string | null>;
  needsYou: readonly { id: string; what: string; href: string }[];
  weekPulse: readonly DashboardChangeRow[];
  aiNext: readonly ClientHomeDoNextItem[];
}) {
  return (
    <div data-overview="" className={cn("flex flex-col", DASHBOARD_SECTION_AIR_CLASS)}>
      <PageHeader title={OVERVIEW_PAGE.title} />

      <OverviewModule
        testId="social"
        title={OVERVIEW_PAGE.social}
        href={OVERVIEW_PAGE.socialHref}
        empty={OVERVIEW_PAGE.socialEmpty}
      >
        {socialChats.length > 0 ? (
          <div className="flex flex-col gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-4)]">
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

      <OverviewModule
        testId="education"
        title={OVERVIEW_PAGE.education}
        href={OVERVIEW_PAGE.educationHref}
        empty={OVERVIEW_PAGE.educationEmpty}
      >
        {courses.length > 0 ? (
          <ul
            data-overview-education-covers=""
            className="grid grid-cols-1 gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-5"
          >
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                coverUrl={courseCovers.get(course.id)}
                metaLabel={courseMeta.get(course.id)}
              />
            ))}
          </ul>
        ) : null}
      </OverviewModule>

      <section data-overview-aggregation="" className={cn("flex flex-col", DASHBOARD_SECTION_AIR_CLASS)}>
        <DashboardListPanel
          label={OVERVIEW_PAGE.topPerforming}
          empty={OVERVIEW_PAGE.topPerformingEmpty}
          testId="overview-top-performing"
        >
          {topTitles.length > 0 ? <DashboardTitleRows items={topTitles} /> : undefined}
        </DashboardListPanel>
        <DashboardHomePanel aria-label={OVERVIEW_PAGE.revenue} data-overview-revenue="">
          <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD_LIST}`}>
            <p className={DASHBOARD_SECTION_TITLE_CLASS}>{OVERVIEW_PAGE.revenue}</p>
            <TextAction href={OVERVIEW_PAGE.revenueHref}>{OVERVIEW_PAGE.aggregation}</TextAction>
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
      </section>

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
  );
}

function OverviewModule({
  testId,
  title,
  href,
  cta,
  empty,
  children,
}: {
  testId: string;
  title: string;
  href?: string;
  cta?: string;
  empty: string;
  children?: React.ReactNode;
}) {
  const hasBody = Boolean(children);
  const action = overviewModuleHeaderAction(title, href, cta);
  return (
    <DashboardHomePanel aria-label={title} data-overview-module={testId}>
      <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD_LIST}`}>
        <p className={DASHBOARD_SECTION_TITLE_CLASS}>{title}</p>
        {action ? <TextAction href={action.href}>{action.label}</TextAction> : null}
      </div>
      {hasBody ? children : <DashboardHomeEmpty>{empty}</DashboardHomeEmpty>}
    </DashboardHomePanel>
  );
}
