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
  DASHBOARD_LIST_DEFAULT_LIMIT,
  dashboardConcentrationLine,
  dashboardListLimitLabel,
  dashboardModuleMetaLine,
  dashboardShareLabel,
  dashboardSharePercent,
  dashboardShowTopLabel,
  rankedRowsFromCounts,
  rankedRowsFromTitles,
  rankedTotal,
  splitDashboardTitle,
  type DashboardRankedRow,
  type DashboardRegisterView,
} from "@/lib/dashboard-register";
import type { DashboardRankedTitle } from "@/lib/dashboard-home";
import type { ReportsCountRow } from "@/lib/reports";
import { cn } from "@/lib/cn";

function RankedName({ row }: { row: DashboardRankedRow }) {
  const [main, qualifier] = splitDashboardTitle(row.label);
  const extra = row.code ? ` · ${row.code}` : null;
  return (
    <span className="min-w-0 truncate t-body-sm text-ink">
      {main}
      {qualifier ? <span className="font-normal text-ink-3">{` ${qualifier}`}</span> : null}
      {extra ? <span className="text-ink-3">{extra}</span> : null}
    </span>
  );
}

export function DashboardRankedRows({
  rows,
  mode,
  shareTotal,
}: {
  rows: readonly DashboardRankedRow[];
  mode: Exclude<DashboardRegisterView, "map">;
  shareTotal?: number;
}) {
  const total = shareTotal ?? rankedTotal(rows);
  return (
    <ol data-dashboard-ranked-rows={mode} className={DASHBOARD_ROW_LIST_CLASS}>
      {rows.map((row, i) => {
        const share = dashboardSharePercent(row.count, total);
        const name = <RankedName row={row} />;
        return (
          <li key={row.key} className={cn(DASHBOARD_ROW_CLASS, mode === "bars" && "flex-col items-stretch")}>
            {mode === "list" ? (
              <>
                <span className={cn("flex min-w-0 items-center", DASHBOARD_RELATED_GAP_CLASS)}>
                  <span className="t-data t-body-sm w-4 shrink-0 text-ink-3">{i + 1}</span>
                  {row.href ? (
                    <Link href={row.href} className="min-w-0 truncate t-body-sm font-medium text-ink hover:text-ink-2">
                      <RankedName row={row} />
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
                      className={`block h-full ${i === 0 ? "bg-accent/70" : "bg-ink-3"}`}
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
                        <RankedName row={row} />
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
                      className={`h-full ${i === 0 ? "bg-accent/70" : "bg-ink-3"}`}
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
  concentrate = false,
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
  concentrate?: boolean;
}) {
  const start = modes.includes(defaultMode) ? defaultMode : modes[0];
  const [mode, setMode] = useState<DashboardRegisterView>(start);
  const [showAll, setShowAll] = useState(false);
  const meta = dashboardModuleMetaLine({ period: periodLabel, updated });
  const view = modes.includes(mode) ? mode : start;
  const listCapped =
    territory && view === "list" && !showAll && rows.length > DASHBOARD_LIST_DEFAULT_LIMIT;
  const visibleRows = listCapped ? rows.slice(0, DASHBOARD_LIST_DEFAULT_LIMIT) : rows;
  const concentration = concentrate && rows.length > 0
    ? dashboardConcentrationLine(rows.map((row) => row.count))
    : null;

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
      {view === "map" && territory ? (
        <>
          <DashboardTerritoryMap rows={rows} />
          {rows.length === 0 ? (
            <p
              data-dashboard-ranked-empty=""
              className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
            >
              {empty}
            </p>
          ) : null}
        </>
      ) : rows.length === 0 ? (
        <p
          data-dashboard-ranked-empty=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {empty}
        </p>
      ) : (
        <DashboardRankedRows
          rows={visibleRows}
          mode={view === "map" ? "bars" : view}
          shareTotal={rankedTotal(rows)}
        />
      )}
      {territory && view === "list" && rows.length > DASHBOARD_LIST_DEFAULT_LIMIT ? (
        <div className="flex items-center justify-between border-t border-hairline px-[var(--space-4)] py-[var(--space-2)]">
          <button
            type="button"
            data-dashboard-territory-more=""
            className="t-body-sm text-ink-3 hover:text-ink"
            onClick={() => setShowAll((open) => !open)}
          >
            {showAll ? dashboardShowTopLabel() : dashboardListLimitLabel(rows.length)}
          </button>
        </div>
      ) : null}
      {concentration ? (
        <p
          data-dashboard-concentration=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {concentration}
        </p>
      ) : null}
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
      concentrate
    />
  );
}
