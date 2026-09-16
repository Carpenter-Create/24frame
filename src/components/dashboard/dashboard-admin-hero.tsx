import Link from "next/link";

import { TextAction } from "@/components/chrome/house";
import { DashboardHomeEmpty, DashboardHomePanel } from "@/components/dashboard/dashboard-home";
import { DashboardAdminControls } from "@/components/dashboard/dashboard-admin-controls";
import { DashboardRevenueChart } from "@/components/dashboard/dashboard-revenue-chart";
import {
  DASHBOARD_ADMIN,
  dashboardAsOfLine,
  dashboardDeltaLine,
  revenuePlayheadKey,
  type DashboardActivityRow,
  type DashboardPeriod,
  type DashboardPeriodOption,
  type DashboardRevenueHero,
} from "@/lib/dashboard-admin";
import { dashboardJustInDate, rankedBarPercent } from "@/lib/dashboard-home";
import { formatUsdCents } from "@/lib/finance";
import type { ReportsUserOption } from "@/lib/reports";

export function DashboardAdminChrome({
  orgName,
  period,
  options,
  userId,
  users,
}: {
  orgName: string;
  period: DashboardPeriod;
  options: readonly DashboardPeriodOption[];
  userId: string | null;
  users: readonly ReportsUserOption[];
}) {
  return (
    <div
      data-dashboard-admin-chrome=""
      className="flex flex-col gap-[var(--space-4)] sm:flex-row sm:items-start sm:justify-between"
    >
      <header className="min-w-0">
        <p className="t-label text-ink-3">{orgName}</p>
        <h1 className="t-section text-ink">{period.label}</h1>
      </header>
      <DashboardAdminControls
        periodKey={period.key}
        options={options}
        userId={userId}
        users={users}
      />
    </div>
  );
}

export function DashboardRevenueCard({
  period,
  hero,
}: {
  period: DashboardPeriod;
  hero: DashboardRevenueHero;
}) {
  const value =
    hero.totalCents === null ? DASHBOARD_ADMIN.revenueEmpty : formatUsdCents(hero.totalCents);
  return (
    <section
      data-dashboard-hero=""
      data-dashboard-revenue=""
      aria-label={DASHBOARD_ADMIN.revenue}
      className="h-full overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface"
    >
      <div className="flex flex-col gap-[var(--space-2)] px-[var(--space-6)] py-[var(--space-6)]">
        <p className="t-label text-ink-3">{DASHBOARD_ADMIN.revenue}</p>
        <p
          data-dashboard-stat="revenue"
          className="t-display t-data leading-none text-ink"
        >
          {value}
        </p>
        <p className="t-body-sm text-ink-3">{dashboardAsOfLine(hero)}</p>
        {hero.compare ? (
          <p data-dashboard-revenue-compare="" className="t-body-sm text-ink-3">
            {dashboardDeltaLine(hero.compare)}
          </p>
        ) : null}
      </div>
      <div className="border-t border-hairline">
        <DashboardRevenueChart
          points={hero.points}
          playheadKey={revenuePlayheadKey(period, hero.points)}
        />
      </div>
    </section>
  );
}

export function DashboardRecentActivity({ items }: { items: readonly DashboardActivityRow[] }) {
  const max = Math.max(0, ...items.map((item) => item.count));
  return (
    <DashboardHomePanel aria-label={DASHBOARD_ADMIN.activity} data-dashboard-module="recent-activity">
      <div className="flex items-center justify-between gap-[var(--space-4)] px-[var(--space-6)] py-[var(--space-4)]">
        <p className="t-label text-ink-3">{DASHBOARD_ADMIN.activity}</p>
        <TextAction href="/titles">{DASHBOARD_ADMIN.viewAll}</TextAction>
      </div>
      {items.length === 0 ? (
        <DashboardHomeEmpty>{DASHBOARD_ADMIN.activityEmpty}</DashboardHomeEmpty>
      ) : (
        <ol className="flex flex-col gap-[var(--space-4)] border-t border-hairline px-[var(--space-6)] py-[var(--space-6)]">
          {items.map((item, i) => {
            const percent = rankedBarPercent(item.count, max);
            return (
              <li key={item.id} className="flex flex-col gap-[var(--space-2)]">
                <div className="flex items-center justify-between gap-[var(--space-4)]">
                  <span className="flex min-w-0 items-center gap-[var(--space-4)]">
                    <span className="t-data t-body-sm w-4 shrink-0 text-ink-3">{i + 1}</span>
                    <span className="min-w-0">
                      <Link
                        href={item.href}
                        className="block truncate t-body font-medium text-ink hover:text-ink-2"
                      >
                        {item.title}
                      </Link>
                      <span className="t-body-sm text-ink-3">{item.detail}</span>
                    </span>
                  </span>
                  <time className="t-body-sm shrink-0 text-ink-3" dateTime={item.at}>
                    {dashboardJustInDate(item.at)}
                  </time>
                </div>
                {percent > 0 ? (
                  <div className="h-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-accent" : "bg-ink-3"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </DashboardHomePanel>
  );
}

export function DashboardAdminHero({
  orgName,
  period,
  options,
  userId,
  users,
  hero,
  activity,
}: {
  orgName: string;
  period: DashboardPeriod;
  options: readonly DashboardPeriodOption[];
  userId: string | null;
  users: readonly ReportsUserOption[];
  hero: DashboardRevenueHero;
  activity: readonly DashboardActivityRow[];
}) {
  return (
    <div data-dashboard-admin-hero="" className="flex flex-col gap-[var(--space-6)]">
      <DashboardAdminChrome
        orgName={orgName}
        period={period}
        options={options}
        userId={userId}
        users={users}
      />
      <div
        data-dashboard-overview-row=""
        className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-5"
      >
        <div className="lg:col-span-3">
          <DashboardRevenueCard period={period} hero={hero} />
        </div>
        <div className="lg:col-span-2">
          <DashboardRecentActivity items={activity} />
        </div>
      </div>
    </div>
  );
}
