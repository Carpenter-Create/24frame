import Link from "next/link";

import { DashboardViewAll } from "@/components/dashboard/dashboard-view-alts";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import { dashboardJustInDate } from "@/lib/dashboard-home";
import { REPORTS_PAGE } from "@/lib/reports";
import {
  REPORTS_TABLE_CELL_CLASS,
  REPORTS_TABLE_CLASS,
  REPORTS_TABLE_HEAD_CLASS,
} from "@/lib/reports-craft";
import type { ReportsDetailRow } from "@/lib/reports-view";
import { cn } from "@/lib/cn";

export function ReportsDetailTable({
  rows,
  periodLabel,
}: {
  rows: readonly ReportsDetailRow[];
  periodLabel?: string | null;
}) {
  return (
    <section data-reports-detail="" className={DASHBOARD_MODULE_CARD_CLASS}>
      <div className={cn("flex items-center justify-between", DASHBOARD_RELATED_GAP_CLASS, DASHBOARD_CARD_PAD_LIST)}>
        <div className={cn("min-w-0", DASHBOARD_RELATED_GAP_CLASS, "flex flex-col")}>
          <p className={DASHBOARD_SECTION_TITLE_CLASS}>{REPORTS_PAGE.detail}</p>
          {periodLabel ? <p className="t-body-sm text-ink-3">{periodLabel}</p> : null}
        </div>
        <DashboardViewAll href="/titles" />
      </div>
      {rows.length === 0 ? (
        <p
          data-reports-detail-empty=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {REPORTS_PAGE.detailEmpty}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className={REPORTS_TABLE_CLASS}>
            <thead>
              <tr className="border-b border-hairline">
                <th className={cn(REPORTS_TABLE_HEAD_CLASS, "px-[var(--space-4)] py-[var(--space-2)]")}>
                  {REPORTS_PAGE.detailTitle}
                </th>
                <th className={cn(REPORTS_TABLE_HEAD_CLASS, "px-[var(--space-4)] py-[var(--space-2)]")}>
                  {REPORTS_PAGE.detailUser}
                </th>
                <th className={cn(REPORTS_TABLE_HEAD_CLASS, "px-[var(--space-4)] py-[var(--space-2)]")}>
                  {REPORTS_PAGE.detailStatus}
                </th>
                <th className={cn(REPORTS_TABLE_HEAD_CLASS, "px-[var(--space-4)] py-[var(--space-2)] text-right")}>
                  {REPORTS_PAGE.detailDeliveries}
                </th>
                <th className={cn(REPORTS_TABLE_HEAD_CLASS, "px-[var(--space-4)] py-[var(--space-2)] text-right")}>
                  {REPORTS_PAGE.detailWhen}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-reports-detail-row={row.id} className="border-b border-hairline last:border-b-0">
                  <td className={cn(REPORTS_TABLE_CELL_CLASS, "px-[var(--space-4)] py-[var(--space-2)]")}>
                    <Link href={row.href} className="font-medium text-ink hover:text-ink-2">
                      {row.title}
                    </Link>
                  </td>
                  <td className={cn(REPORTS_TABLE_CELL_CLASS, "px-[var(--space-4)] py-[var(--space-2)] text-ink-3")}>
                    {row.user ?? "—"}
                  </td>
                  <td className={cn(REPORTS_TABLE_CELL_CLASS, "px-[var(--space-4)] py-[var(--space-2)] text-ink-3")}>
                    {row.status ?? "—"}
                  </td>
                  <td className={cn(REPORTS_TABLE_CELL_CLASS, "t-data px-[var(--space-4)] py-[var(--space-2)] text-right")}>
                    {row.deliveries}
                  </td>
                  <td className={cn(REPORTS_TABLE_CELL_CLASS, "t-data px-[var(--space-4)] py-[var(--space-2)] text-right text-ink-3")}>
                    {row.lastAt ? dashboardJustInDate(row.lastAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
