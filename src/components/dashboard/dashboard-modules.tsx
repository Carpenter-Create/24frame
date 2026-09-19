import Link from "next/link";

import { TextAction } from "@/components/chrome/house";
import {
  DashboardHomeEmpty,
  DashboardHomePanel,
  DashboardHomeStatusPill,
} from "@/components/dashboard/dashboard-home";
import { Card, CardBody } from "@/components/ui/card";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_SECTION_TITLE_CLASS,
  DASHBOARD_MONEY_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
} from "@/lib/dashboard-craft";
import { ATTENTION_HREF } from "@/lib/findings";
import {
  DASHBOARD_HOME,
  dashboardCatalogValue,
  dashboardJustInDate,
  dashboardTitleStatusLabel,
  type ClientHomeJustInItem,
  type DashboardChangeRow,
  type DashboardDeliveryRow,
} from "@/lib/dashboard-home";
import { CATALOG_HEALTH_EMPTY } from "@/lib/findings";
import { REPORTS_HREF } from "@/lib/reports";
import type { ReportsCountRow } from "@/lib/reports";

export function DashboardFramedEmpty({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <p className="t-body text-ink-2">{children}</p>
      </CardBody>
    </Card>
  );
}

export function DashboardListPanel({
  label,
  empty,
  children,
  testId,
}: {
  label: string;
  empty: string;
  children?: React.ReactNode;
  testId: string;
}) {
  return (
    <DashboardHomePanel aria-label={label} data-dashboard-module={testId}>
      <span className={`${DASHBOARD_CARD_PAD_LIST} ${DASHBOARD_SECTION_TITLE_CLASS}`}>{label}</span>
      {children ?? <DashboardHomeEmpty>{empty}</DashboardHomeEmpty>}
    </DashboardHomePanel>
  );
}

export function DashboardTitleRows({ items }: { items: readonly ClientHomeJustInItem[] }) {
  return (
    <ul className={DASHBOARD_ROW_LIST_CLASS}>
      {items.map((item) => {
        const statusLabel = dashboardTitleStatusLabel(item.status);
        return (
          <li
            key={item.id}
            className={DASHBOARD_ROW_CLASS}
          >
            <span className={`flex min-w-0 flex-wrap items-center ${DASHBOARD_RELATED_GAP_CLASS}`}>
              <Link
                href={`/titles/${item.id}`}
                className="t-body-sm font-medium text-ink transition-colors hover:text-ink-2"
              >
                {item.title}
              </Link>
              {statusLabel ? <DashboardHomeStatusPill label={statusLabel} /> : null}
            </span>
            <time className="t-body-sm shrink-0 text-ink-3" dateTime={item.created_at}>
              {dashboardJustInDate(item.created_at)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}

export { DashboardTopPerforming, DashboardTopTitles } from "@/components/dashboard/dashboard-ranked";

export function DashboardDeliveriesAction({ rows }: { rows: readonly DashboardDeliveryRow[] }) {
  return (
    <DashboardListPanel
      label={DASHBOARD_HOME.deliveriesAction}
      empty={DASHBOARD_HOME.deliveriesActionEmpty}
      testId="deliveries-action"
    >
      {rows.length > 0 ? (
        <ul className={DASHBOARD_ROW_LIST_CLASS}>
          {rows.map((row) => (
            <li
              key={row.delivery_id}
              className={DASHBOARD_ROW_CLASS}
            >
              <Link
                href={`/titles/${row.title_id}`}
                className="t-body-sm font-medium text-ink transition-colors hover:text-ink-2"
              >
                {row.title}
              </Link>
              <span className="t-body-sm shrink-0 text-ink-3">
                {row.vendor_name} · {row.territory}
              </span>
            </li>
          ))}
        </ul>
      ) : undefined}
    </DashboardListPanel>
  );
}

export function DashboardFindingsGlance({
  count,
  isPartial,
}: {
  count: number;
  isPartial: boolean;
}) {
  return (
    <DashboardHomePanel aria-label={DASHBOARD_HOME.findingsGlance} data-dashboard-module="findings-glance">
      <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD_LIST}`}>
        <p className={DASHBOARD_SECTION_TITLE_CLASS}>{DASHBOARD_HOME.findingsGlance}</p>
        <TextAction href={ATTENTION_HREF}>{DASHBOARD_HOME.findingsGlanceCta}</TextAction>
      </div>
      <div className="border-t border-hairline px-[var(--space-4)] py-[var(--space-4)]">
        <p
          data-dashboard-findings-count=""
          data-dashboard-stat="needsAttention"
          className="t-title t-data text-ink"
        >
          {dashboardCatalogValue(count, isPartial)}
        </p>
        {count === 0 ? (
          <p className="mt-[var(--space-2)] t-body-sm text-ink-3">{CATALOG_HEALTH_EMPTY}</p>
        ) : null}
      </div>
    </DashboardHomePanel>
  );
}

export function DashboardCountList({
  label,
  empty,
  rows,
  testId,
}: {
  label: string;
  empty: string;
  rows: readonly ReportsCountRow[];
  testId: string;
}) {
  return (
    <DashboardListPanel label={label} empty={empty} testId={testId}>
      {rows.length > 0 ? (
        <ul className={DASHBOARD_ROW_LIST_CLASS}>
          {rows.map((row) => (
            <li
              key={row.name}
              className={DASHBOARD_ROW_CLASS}
            >
              <span className="t-body-sm text-ink">{row.name}</span>
              <span className={DASHBOARD_MONEY_CLASS}>{row.count}</span>
            </li>
          ))}
        </ul>
      ) : undefined}
    </DashboardListPanel>
  );
}

export function DashboardWhatChanged({
  firstVisit,
  rows,
}: {
  firstVisit: boolean;
  rows: readonly DashboardChangeRow[];
}) {
  return (
    <DashboardListPanel
      label={DASHBOARD_HOME.whatChanged}
      empty={firstVisit ? DASHBOARD_HOME.whatChangedFirst : DASHBOARD_HOME.whatChangedEmpty}
      testId="what-changed"
    >
      {rows.length > 0 ? (
        <ul className={DASHBOARD_ROW_LIST_CLASS}>
          {rows.map((row) => (
            <li
              key={row.key}
              data-dashboard-change={row.key}
              className={DASHBOARD_ROW_CLASS}
            >
              <span className="t-body-sm text-ink">{row.label}</span>
              <span className="t-data t-body-sm shrink-0 text-right text-ink-2">{row.count}</span>
            </li>
          ))}
        </ul>
      ) : undefined}
    </DashboardListPanel>
  );
}

export function DashboardPendingSubmissions({ items }: { items: readonly ClientHomeJustInItem[] }) {
  if (items.length === 0) return null;
  return (
    <DashboardListPanel
      label={DASHBOARD_HOME.pending}
      empty={DASHBOARD_HOME.pendingEmpty}
      testId="pending"
    >
      <DashboardTitleRows items={items} />
    </DashboardListPanel>
  );
}

export function DashboardReportsCta() {
  return (
    <div data-dashboard-reports-cta="" className="flex flex-col gap-[var(--space-2)]">
      <p className="t-body-sm text-ink-3">{DASHBOARD_HOME.reportsPointer}</p>
      <TextAction href={REPORTS_HREF}>{DASHBOARD_HOME.reportsCta}</TextAction>
    </div>
  );
}

