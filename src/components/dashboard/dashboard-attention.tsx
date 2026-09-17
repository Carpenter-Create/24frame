import Link from "next/link";

import { DashboardViewAll } from "@/components/dashboard/dashboard-view-alts";
import { cn } from "@/lib/cn";
import {
  DASHBOARD_ATTENTION,
  type AttentionRow,
  type AttentionSnapshot,
} from "@/lib/dashboard-attention";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import { dashboardJustInDate, dashboardJustInTime } from "@/lib/dashboard-home";

export function DashboardAttention({ snapshot }: { snapshot: AttentionSnapshot }) {
  return (
    <section
      aria-label={DASHBOARD_ATTENTION.title}
      data-dashboard-module="attention"
      className={DASHBOARD_CARD_CLASS}
    >
      <div className={cn("flex items-center justify-between", DASHBOARD_RELATED_GAP_CLASS, DASHBOARD_CARD_PAD_LIST)}>
        <p className={DASHBOARD_SECTION_TITLE_CLASS}>{DASHBOARD_ATTENTION.title}</p>
        <DashboardViewAll href={DASHBOARD_ATTENTION.viewAllHref} />
      </div>
      {snapshot.rows.length === 0 ? (
        <p
          data-dashboard-attention-empty=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {DASHBOARD_ATTENTION.empty}
        </p>
      ) : (
        <ul className={DASHBOARD_ROW_LIST_CLASS}>
          {snapshot.rows.map((row: AttentionRow) => (
            <li key={row.id} className={DASHBOARD_ROW_CLASS} data-dashboard-attention-row={row.id}>
              <Link
                href={row.href}
                data-dashboard-attention-what=""
                className="min-w-0 flex-1 truncate t-body-sm text-ink hover:text-ink-2"
              >
                {row.what}
              </Link>
              <time
                className="shrink-0 text-right"
                dateTime={row.at}
                data-dashboard-attention-time=""
              >
                <span className="block t-body-sm text-ink-3">{dashboardJustInDate(row.at)}</span>
                <span
                  data-dashboard-attention-clock=""
                  className="block t-body-sm text-ink-3"
                >
                  {dashboardJustInTime(row.at)}
                </span>
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
