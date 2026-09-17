"use client";

import { useState } from "react";
import Link from "next/link";

import { DashboardViewAll, DashboardViewAlts } from "@/components/dashboard/dashboard-view-alts";
import { DashboardTerritoryMap } from "@/components/dashboard/dashboard-territory-map";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_KICKER_CLASS,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_MONEY_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
} from "@/lib/dashboard-craft";
import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import {
  dashboardModuleMetaLine,
  dashboardShareLabel,
  dashboardSharePercent,
  rankedRowsFromCounts,
  rankedRowsFromTitles,
  rankedTotal,
  type DashboardRankedRow,
  type DashboardRegisterView,
} from "@/lib/dashboard-register";
import type { DashboardRankedTitle } from "@/lib/dashboard-home";
import type { ReportsCountRow } from "@/lib/reports";
import { cn } from "@/lib/cn";

export function DashboardRankedRows({
  rows,
  mode,
}: {
  rows: readonly DashboardRankedRow[];
  mode: Exclude<DashboardRegisterView, "map">;
}) {
  const total = rankedTotal(rows);
  const max = Math.max(0, ...rows.map((row) => row.count));
  return (
    <ol data-dashboard-ranked-rows={mode} className={DASHBOARD_ROW_LIST_CLASS}>
      {rows.map((row, i) => {
        const share = dashboardSharePercent(row.count, max);
        const name = (
          <span className="min-w-0 truncate t-body-sm text-ink">
            {row.label}
            {row.code ? (
              <span className="text-ink-3">{` · ${row.code}`}</span>
            ) : null}
          </span>
        );
        return (
          <li key={row.key} className={cn(DASHBOARD_ROW_CLASS, mode === "bars" && "flex-col items-stretch")}>
            {mode === "list" ? (
              <>
                <span className={cn("flex min-w-0 items-center", DASHBOARD_RELATED_GAP_CLASS)}>
                  <span className="t-data t-body-sm w-4 shrink-0 text-ink-3">{i + 1}</span>
                  {row.href ? (
                    <Link href={row.href} className="min-w-0 truncate t-body-sm font-medium text-ink hover:text-ink-2">
                      {row.label}
                      {row.code ? <span className="font-normal text-ink-3">{` · ${row.code}`}</span> : null}
                    </Link>
                  ) : (
                    name
                  )}
                </span>
                <span className={cn("flex shrink-0 items-center", DASHBOARD_RELATED_GAP_CLASS)}>
                  <span
                    aria-hidden
                    className="h-1 w-16 overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted"
                  >
                    <span
                      className={`block h-full ${i === 0 ? "bg-accent" : "bg-ink-3"}`}
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="t-data t-body-sm w-10 text-right text-ink-3">
                    {dashboardShareLabel(row.count, total)}
                  </span>
                  <span className={DASHBOARD_MONEY_CLASS}>{row.count}</span>
                </span>
              </>
            ) : (
              <>
                <div className={cn("flex items-center justify-between", DASHBOARD_RELATED_GAP_CLASS)}>
                  <span className={cn("flex min-w-0 items-center", DASHBOARD_RELATED_GAP_CLASS)}>
                    <span className="t-data t-body-sm w-4 shrink-0 text-ink-3">{i + 1}</span>
                    {row.href ? (
                      <Link href={row.href} className="truncate t-body-sm font-medium text-ink hover:text-ink-2">
                        {row.label}
                      </Link>
                    ) : (
                      name
                    )}
                  </span>
                  <span className={DASHBOARD_MONEY_CLASS}>{row.count}</span>
                </div>
                {share > 0 ? (
                  <div className="h-1 overflow-hidden rounded-[var(--radius-sm)] bg-surface-muted">
                    <div
                      className={`h-full ${i === 0 ? "bg-accent" : "bg-ink-3"}`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function DashboardRankedModule({
  label,
  empty,
  rows,
  testId,
  viewAllHref,
  modes,
  defaultMode,
  territory = false,
  periodLabel,
  updated,
}: {
  label: string;
  empty: string;
  rows: readonly DashboardRankedRow[];
  testId: string;
  viewAllHref: string;
  modes: readonly DashboardRegisterView[];
  defaultMode: DashboardRegisterView;
  territory?: boolean;
  periodLabel?: string | null;
  updated?: string | null;
}) {
  const start = modes.includes(defaultMode) ? defaultMode : modes[0];
  const [mode, setMode] = useState<DashboardRegisterView>(start);
  const meta = dashboardModuleMetaLine({ period: periodLabel, updated });
  const view = modes.includes(mode) ? mode : start;

  return (
    <section
      data-dashboard-module={testId}
      data-dashboard-ranked={testId}
      data-dashboard-view={view}
      {...(territory ? { "data-dashboard-territory": "" } : {})}
      className={DASHBOARD_MODULE_CARD_CLASS}
    >
      <div className={cn("flex items-start justify-between", DASHBOARD_RELATED_GAP_CLASS, DASHBOARD_CARD_PAD_LIST)}>
        <div className={cn("min-w-0", DASHBOARD_RELATED_GAP_CLASS, "flex flex-col")}>
          <p className={DASHBOARD_KICKER_CLASS}>{label}</p>
          {meta ? (
            <p data-dashboard-module-meta="" className="t-body-sm text-ink-3">
              {meta}
            </p>
          ) : null}
        </div>
        <div className={cn("flex shrink-0 items-center", DASHBOARD_RELATED_GAP_CLASS)}>
          <DashboardViewAlts modes={modes} mode={view} onChange={setMode} />
          <DashboardViewAll href={viewAllHref} />
        </div>
      </div>
      {rows.length === 0 ? (
        <p
          data-dashboard-ranked-empty=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {empty}
        </p>
      ) : view === "map" && territory ? (
        <DashboardTerritoryMap rows={rows} />
      ) : (
        <DashboardRankedRows rows={rows} mode={view === "map" ? "bars" : view} />
      )}
    </section>
  );
}

export function DashboardRankedBars({
  label,
  empty,
  rows,
  testId,
  viewAllHref,
  territory = false,
  periodLabel,
  updated,
  defaultMode,
}: {
  label: string;
  empty: string;
  rows: readonly ReportsCountRow[];
  testId: string;
  viewAllHref: string;
  territory?: boolean;
  periodLabel?: string | null;
  updated?: string | null;
  defaultMode?: DashboardRegisterView;
}) {
  const modes: DashboardRegisterView[] = territory ? ["map", "list", "bars"] : ["list", "bars"];
  return (
    <DashboardRankedModule
      label={label}
      empty={empty}
      rows={rankedRowsFromCounts(rows, territory)}
      testId={testId}
      viewAllHref={viewAllHref}
      modes={modes}
      defaultMode={defaultMode ?? (territory ? "map" : "bars")}
      territory={territory}
      periodLabel={periodLabel}
      updated={updated}
    />
  );
}

export function DashboardTopTitles({
  items,
  periodLabel,
  updated,
  quietEmpty = false,
}: {
  items: readonly DashboardRankedTitle[];
  periodLabel?: string | null;
  updated?: string | null;
  quietEmpty?: boolean;
}) {
  void quietEmpty;
  return (
    <DashboardRankedModule
      label={DASHBOARD_HOME.topTitles}
      empty={DASHBOARD_HOME.topTitlesEmpty}
      rows={rankedRowsFromTitles(items)}
      testId="top-titles"
      viewAllHref="/titles"
      modes={["list", "bars"]}
      defaultMode="bars"
      periodLabel={periodLabel}
      updated={updated}
    />
  );
}
