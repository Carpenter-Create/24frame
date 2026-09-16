import { Card, CardBody } from "@/components/ui/card";
import { ClientFinanceDashboardView } from "@/components/finance/client-finance-dashboard";
import { ReportsBreakdown, ReportsCatalogChart } from "@/components/reports/reports-chart";
import { dashboardCatalogValue, type ClientHomeJustInItem } from "@/lib/dashboard-home";
import { REPORTS_PAGE, type ReportsCountRow } from "@/lib/reports";
import { REPORTS_HERO_CELL_CLASS, REPORTS_HERO_CLASS, REPORTS_STACK_CLASS } from "@/lib/reports-craft";
import type { ClientFinanceDashboard } from "@/lib/finance-dashboard";
import { TITLE_STATUS_LABELS, type TitleStatus } from "@/lib/titles";
import Link from "next/link";

export function ReportsHero({
  catalog,
  live,
  needsAttention,
  catalogIsPartial,
  findingsIsPartial,
}: {
  catalog: number;
  live: number;
  needsAttention: number;
  catalogIsPartial: boolean;
  findingsIsPartial: boolean;
}) {
  const cells = [
    { key: "catalog", label: "Catalog", value: dashboardCatalogValue(catalog, catalogIsPartial) },
    { key: "live", label: "Live", value: dashboardCatalogValue(live, catalogIsPartial) },
    {
      key: "attention",
      label: "Needs attention",
      value: dashboardCatalogValue(needsAttention, findingsIsPartial),
    },
  ] as const;
  return (
    <dl data-reports-hero="" className={REPORTS_HERO_CLASS}>
      {cells.map((cell, i) => (
        <div
          key={cell.key}
          className={`${REPORTS_HERO_CELL_CLASS} ${i > 0 ? "border-t border-hairline sm:border-t-0 sm:border-l" : ""}`}
        >
          <dt className="t-label text-ink-3">{cell.label}</dt>
          <dd className="t-data t-title text-ink">{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ReportsTitleList({ items }: { items: readonly ClientHomeJustInItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="t-label text-ink-3">{REPORTS_PAGE.topTitles}</p>
          <p className="mt-[var(--space-4)] t-body text-ink-2">{REPORTS_PAGE.topTitlesEmpty}</p>
        </CardBody>
      </Card>
    );
  }
  return (
    <section className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface">
      <p className="px-[var(--space-6)] py-[var(--space-4)] t-label text-ink-3">{REPORTS_PAGE.topTitles}</p>
      <ul className="divide-y divide-hairline border-t border-hairline">
        {items.map((item) => {
          const status =
            Object.hasOwn(TITLE_STATUS_LABELS, item.status)
              ? TITLE_STATUS_LABELS[item.status as TitleStatus]
              : null;
          return (
            <li
              key={item.id}
              className="flex items-center justify-between gap-[var(--space-6)] px-[var(--space-6)] py-[var(--space-4)]"
            >
              <Link href={`/titles/${item.id}`} className="t-body font-medium text-ink hover:text-ink-2">
                {item.title}
              </Link>
              {status ? <span className="t-body-sm text-ink-3">{status}</span> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ReportsBody({
  createdAt,
  nowMs,
  catalog,
  live,
  needsAttention,
  catalogIsPartial,
  findingsIsPartial,
  platforms,
  territories,
  statuses,
  deliveryStatuses,
  topTitles,
  money,
}: {
  createdAt: number[];
  nowMs: number;
  catalog: number;
  live: number;
  needsAttention: number;
  catalogIsPartial: boolean;
  findingsIsPartial: boolean;
  platforms: readonly ReportsCountRow[];
  territories: readonly ReportsCountRow[];
  statuses: readonly ReportsCountRow[];
  deliveryStatuses: readonly ReportsCountRow[];
  topTitles: readonly ClientHomeJustInItem[];
  money: ClientFinanceDashboard | null;
}) {
  return (
    <div data-reports-body="" className={REPORTS_STACK_CLASS}>
      <ReportsHero
        catalog={catalog}
        live={live}
        needsAttention={needsAttention}
        catalogIsPartial={catalogIsPartial}
        findingsIsPartial={findingsIsPartial}
      />
      <ReportsCatalogChart createdAt={createdAt} nowMs={nowMs} />
      <div className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2">
        <ReportsBreakdown
          label={REPORTS_PAGE.status}
          empty={REPORTS_PAGE.statusEmpty}
          rows={statuses}
          testId="status"
        />
        <ReportsBreakdown
          label={REPORTS_PAGE.deliveries}
          empty={REPORTS_PAGE.deliveriesEmpty}
          rows={deliveryStatuses}
          testId="deliveries"
        />
      </div>
      <div className="grid grid-cols-1 gap-[var(--space-6)] lg:grid-cols-2">
        <ReportsBreakdown
          label={REPORTS_PAGE.platforms}
          empty={REPORTS_PAGE.platformsEmpty}
          rows={platforms}
          testId="platforms"
        />
        <ReportsBreakdown
          label={REPORTS_PAGE.territories}
          empty={REPORTS_PAGE.territoriesEmpty}
          rows={territories}
          testId="territories"
        />
      </div>
      <ReportsTitleList items={topTitles} />
      {money ? <ClientFinanceDashboardView dashboard={money} /> : null}
    </div>
  );
}
