import Link from "next/link";

import { TextAction } from "@/components/chrome/house";
import { DashboardAdminControls } from "@/components/dashboard/dashboard-admin-controls";
import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart";
import {
  DASHBOARD_ADMIN,
  dashboardAsOfLine,
  dashboardDeltaLine,
  dashboardHeroMoney,
  revenuePlayheadKey,
  type DashboardActivityRow,
  type DashboardPeriod,
  type DashboardPeriodOption,
  type DashboardRevenueHero,
} from "@/lib/dashboard-admin";
import {
  DASHBOARD_ADMIN_CHROME_CLASS,
  DASHBOARD_ADMIN_OVERVIEW_CLASS,
  DASHBOARD_ADMIN_STACK_CLASS,
  DASHBOARD_CARD_CLASS,
  DASHBOARD_CARD_PAD_HERO,
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_FIXTURE_BANNER_CLASS,
  DASHBOARD_HERO_ASOF_CLASS,
  DASHBOARD_HERO_DELTA_CLASS,
  DASHBOARD_HERO_TO_CHART_GAP_CLASS,
  DASHBOARD_HERO_VALUE_CLASS,
  DASHBOARD_KICKER_CLASS,
  DASHBOARD_RANKED_LIST_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_TITLE_DESKTOP_CLASS,
  DASHBOARD_TITLE_MOBILE_CLASS,
} from "@/lib/dashboard-craft";
import { DASHBOARD_FIXTURE, dashboardFixtureLabel } from "@/lib/dashboard-fixture";
import { dashboardJustInDate, rankedBarPercent } from "@/lib/dashboard-home";
import { cn } from "@/lib/cn";

export function DashboardFixtureBanner() {
  return (
    <p
      data-dashboard-fixture-banner=""
      role="status"
      className={DASHBOARD_FIXTURE_BANNER_CLASS}
    >
      {DASHBOARD_FIXTURE.banner} · {DASHBOARD_FIXTURE.note}
    </p>
  );
}

export function DashboardAdminChrome({
  orgName,
  periodKey,
  options,
  periodMenuOpen = false,
}: {
  orgName: string;
  periodKey: string;
  options: readonly DashboardPeriodOption[];
  periodMenuOpen?: boolean;
}) {
  return (
    <div
      data-dashboard-admin-chrome=""
      data-dashboard-identity-row=""
      className={DASHBOARD_ADMIN_CHROME_CLASS}
    >
      <header className="min-w-0">
        <h1 data-dashboard-title="">
          <span data-dashboard-title-mobile="" className={DASHBOARD_TITLE_MOBILE_CLASS}>
            {orgName}
          </span>
          <span data-dashboard-title-desktop="" className={DASHBOARD_TITLE_DESKTOP_CLASS}>
            {orgName}
          </span>
        </h1>
      </header>
      <DashboardAdminControls
        periodKey={periodKey}
        options={options}
        defaultOpen={periodMenuOpen}
      />
    </div>
  );
}

export function DashboardRevenueCard({
  period,
  hero,
  fixture = false,
}: {
  period: DashboardPeriod;
  hero: DashboardRevenueHero;
  fixture?: boolean;
}) {
  const raw = dashboardHeroMoney(hero.totalCents);
  const value = fixture ? dashboardFixtureLabel(raw) : raw;
  return (
    <section
      data-dashboard-hero=""
      data-dashboard-revenue=""
      aria-label={DASHBOARD_ADMIN.revenue}
      className={DASHBOARD_CARD_CLASS}
    >
      <div className={cn("flex flex-col", DASHBOARD_RELATED_GAP_CLASS, DASHBOARD_CARD_PAD_HERO)}>
        <p className={DASHBOARD_KICKER_CLASS}>{DASHBOARD_ADMIN.revenue}</p>
        <p data-dashboard-stat="revenue" className={DASHBOARD_HERO_VALUE_CLASS}>
          {value}
        </p>
        {hero.compare ? (
          <p
            data-dashboard-revenue-compare=""
            className={DASHBOARD_HERO_DELTA_CLASS}
          >
            {dashboardDeltaLine(hero.compare)}
          </p>
        ) : null}
        <p data-dashboard-revenue-asof="" className={DASHBOARD_HERO_ASOF_CLASS}>
          {dashboardAsOfLine(hero)}
        </p>
      </div>
      <div className={cn("border-t border-hairline", DASHBOARD_HERO_TO_CHART_GAP_CLASS)}>
        <DashboardRevenueChart
          points={hero.points}
          playheadKey={revenuePlayheadKey(period, hero.points)}
          fixture={fixture}
        />
      </div>
    </section>
  );
}

export function DashboardRecentActivity({ items }: { items: readonly DashboardActivityRow[] }) {
  const max = Math.max(0, ...items.map((item) => item.count));
  return (
    <section
      aria-label={DASHBOARD_ADMIN.activity}
      data-dashboard-module="recent-activity"
      className={DASHBOARD_CARD_CLASS}
    >
      <div className={cn("flex items-center justify-between", DASHBOARD_RELATED_GAP_CLASS, DASHBOARD_CARD_PAD_LIST)}>
        <p className={DASHBOARD_KICKER_CLASS}>{DASHBOARD_ADMIN.activity}</p>
        <TextAction href="/titles">{DASHBOARD_ADMIN.viewAll}</TextAction>
      </div>
      {items.length === 0 ? (
        <p className="border-t border-hairline px-[var(--space-4)] py-[var(--space-4)] t-body-sm text-ink-3">
          {DASHBOARD_ADMIN.activityEmpty}
        </p>
      ) : (
        <ol className={DASHBOARD_RANKED_LIST_CLASS}>
          {items.map((item, i) => {
            const percent = rankedBarPercent(item.count, max);
            return (
              <li key={item.id} className={cn("flex min-h-10 flex-col", DASHBOARD_RELATED_GAP_CLASS)}>
                <div className={cn("flex items-center justify-between", DASHBOARD_RELATED_GAP_CLASS)}>
                  <span className={cn("flex min-w-0 items-center", DASHBOARD_RELATED_GAP_CLASS)}>
                    <span className="t-data t-body-sm w-4 shrink-0 text-ink-3">{i + 1}</span>
                    <span className="min-w-0">
                      <Link
                        href={item.href}
                        className="block truncate t-body-sm font-medium text-ink hover:text-ink-2"
                      >
                        {item.title}
                      </Link>
                      <span className="t-body-sm text-ink-3">{item.detail}</span>
                    </span>
                  </span>
                  <time className="t-data t-body-sm shrink-0 text-right text-ink-3" dateTime={item.at}>
                    {dashboardJustInDate(item.at)}
                  </time>
                </div>
                {percent > 0 ? (
                  <div className="h-1 overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted">
                    <div
                      className={`h-full ${i === 0 ? "bg-accent" : "bg-ink-3"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function DashboardAdminHero({
  orgName,
  period,
  options,
  hero,
  activity,
  fixture = false,
  periodMenuOpen = false,
}: {
  orgName: string;
  period: DashboardPeriod;
  options: readonly DashboardPeriodOption[];
  hero: DashboardRevenueHero;
  activity: readonly DashboardActivityRow[];
  fixture?: boolean;
  periodMenuOpen?: boolean;
}) {
  return (
    <div data-dashboard-admin-hero="" className={DASHBOARD_ADMIN_STACK_CLASS}>
      {fixture ? <DashboardFixtureBanner /> : null}
      <DashboardAdminChrome
        orgName={orgName}
        periodKey={period.key}
        options={options}
        periodMenuOpen={periodMenuOpen}
      />
      <div
        data-dashboard-overview-row=""
        data-dashboard-mobile-stack=""
        className={DASHBOARD_ADMIN_OVERVIEW_CLASS}
      >
        <div className="lg:col-span-3">
          <DashboardRevenueCard period={period} hero={hero} fixture={fixture} />
        </div>
        <div className="lg:col-span-2">
          <DashboardRecentActivity items={activity} />
        </div>
      </div>
    </div>
  );
}
