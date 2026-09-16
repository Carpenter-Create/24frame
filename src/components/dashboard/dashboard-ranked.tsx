"use client";

import { useState } from "react";
import { ChartBar, List } from "@phosphor-icons/react";

import { TextAction } from "@/components/chrome/house";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_KICKER_CLASS,
  DASHBOARD_MONEY_CLASS,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_RANKED_LIST_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
} from "@/lib/dashboard-craft";
import { DASHBOARD_HOME, rankedBarPercent } from "@/lib/dashboard-home";
import {
  PHOSPHOR_CHROME_ICON_CLASS,
  PHOSPHOR_CHROME_IDLE_WEIGHT,
} from "@/lib/phosphor-icon";
import type { ReportsCountRow } from "@/lib/reports";

export function DashboardRankedBars({
  label,
  empty,
  rows,
  testId,
  viewAllHref,
  territory = false,
}: {
  label: string;
  empty: string;
  rows: readonly ReportsCountRow[];
  testId: string;
  viewAllHref: string;
  territory?: boolean;
}) {
  const [mode, setMode] = useState<"chart" | "list">("chart");
  const max = rows[0]?.count ?? 0;

  return (
    <section
      data-dashboard-module={testId}
      data-dashboard-ranked={testId}
      {...(territory ? { "data-dashboard-territory": "" } : {})}
      className={DASHBOARD_MODULE_CARD_CLASS}
    >
      <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD_LIST}`}>
        <p className={DASHBOARD_KICKER_CLASS}>{label}</p>
        <div className={`flex items-center ${DASHBOARD_RELATED_GAP_CLASS}`}>
          <div className={`flex items-center ${DASHBOARD_RELATED_GAP_CLASS}`}>
            <button
              type="button"
              aria-label={DASHBOARD_HOME.viewChart}
              aria-pressed={mode === "chart"}
              data-dashboard-rank-mode="chart"
              onClick={() => setMode("chart")}
              className={mode === "chart" ? "text-accent" : "text-ink-3"}
            >
              <ChartBar className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
            </button>
            <button
              type="button"
              aria-label={DASHBOARD_HOME.viewList}
              aria-pressed={mode === "list"}
              data-dashboard-rank-mode="list"
              onClick={() => setMode("list")}
              className={mode === "list" ? "text-accent" : "text-ink-3"}
            >
              <List className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
            </button>
          </div>
          <TextAction href={viewAllHref}>{DASHBOARD_HOME.viewAll}</TextAction>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="border-t border-hairline px-[var(--space-4)] py-[var(--space-4)] t-body-sm text-ink-3">
          {empty}
        </p>
      ) : (
        <ol className={DASHBOARD_RANKED_LIST_CLASS}>
          {rows.map((row, i) => {
            const percent = rankedBarPercent(row.count, max);
            return (
              <li key={row.name} className={`flex min-h-10 flex-col ${DASHBOARD_RELATED_GAP_CLASS}`}>
                <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS}`}>
                  <span className={`flex min-w-0 items-center ${DASHBOARD_RELATED_GAP_CLASS}`}>
                    <span className="t-data t-body-sm w-4 shrink-0 text-ink-3">{i + 1}</span>
                    <span className="t-body-sm text-ink">{row.name}</span>
                  </span>
                  <span className={DASHBOARD_MONEY_CLASS}>{row.count}</span>
                </div>
                {mode === "chart" ? (
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
