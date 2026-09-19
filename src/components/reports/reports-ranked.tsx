"use client";

import { useState } from "react";

import { DashboardRankedRows } from "@/components/dashboard/dashboard-ranked";
import { DashboardViewAll, DashboardViewAlts } from "@/components/dashboard/dashboard-view-alts";
import { DashboardTerritoryMap } from "@/components/dashboard/dashboard-territory-map";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_ON_CLASS,
  DASHBOARD_TOP_PILL_CLUSTER_CLASS,
  DASHBOARD_TOP_PILL_THUMB_CLASS,
} from "@/lib/dashboard-craft";
import type { DashboardRankedTitle } from "@/lib/dashboard-home";
import { TITLES_HREF } from "@/lib/title-public-id";
import {
  dashboardModuleMetaLine,
  rankedRowsFromCounts,
  rankedRowsFromTitles,
  type DashboardRegisterView,
} from "@/lib/dashboard-register";
import { REPORTS_HREF, REPORTS_PAGE, type ReportsCountRow } from "@/lib/reports";
import { cn } from "@/lib/cn";

export const REPORTS_TOP_PILLS = ["titles", "platforms", "users"] as const;
export type ReportsTopPill = (typeof REPORTS_TOP_PILLS)[number];

const PANES: Record<
  ReportsTopPill,
  {
    label: string;
    empty: string;
    href: string;
    testId: string;
  }
> = {
  titles: {
    label: REPORTS_PAGE.topTitles,
    empty: REPORTS_PAGE.topTitlesEmpty,
    href: TITLES_HREF,
    testId: "titles",
  },
  platforms: {
    label: REPORTS_PAGE.platforms,
    empty: REPORTS_PAGE.platformsEmpty,
    href: TITLES_HREF,
    testId: "platforms",
  },
  users: {
    label: REPORTS_PAGE.users,
    empty: REPORTS_PAGE.usersEmpty,
    href: REPORTS_HREF,
    testId: "users",
  },
};

export function ReportsTopPerforming({
  titles,
  platforms,
  users,
  periodLabel,
  updated,
  showUsers = true,
}: {
  titles: readonly DashboardRankedTitle[];
  platforms: readonly ReportsCountRow[];
  users: readonly ReportsCountRow[];
  periodLabel?: string | null;
  updated?: string | null;
  showUsers?: boolean;
}) {
  const pills: readonly ReportsTopPill[] = showUsers
    ? REPORTS_TOP_PILLS
    : (["titles", "platforms"] as const);
  const [pill, setPill] = useState<ReportsTopPill>("titles");
  const [mode, setMode] = useState<Exclude<DashboardRegisterView, "map">>("list");
  const active: ReportsTopPill = pills.includes(pill) ? pill : "titles";
  const pane = PANES[active];
  const meta = dashboardModuleMetaLine({ period: periodLabel, updated });
  const rows =
    active === "titles"
      ? rankedRowsFromTitles(titles)
      : rankedRowsFromCounts(active === "platforms" ? platforms : users);

  return (
    <section
      data-reports-top-performing=""
      data-reports-ranked={pane.testId}
      data-reports-top-pill-active={active}
      className={DASHBOARD_MODULE_CARD_CLASS}
    >
      <div
        className={cn(
          "flex flex-wrap items-start justify-between",
          DASHBOARD_RELATED_GAP_CLASS,
          DASHBOARD_CARD_PAD_LIST,
        )}
      >
        <div className={cn("min-w-0", DASHBOARD_RELATED_GAP_CLASS, "flex flex-col")}>
          <p className={DASHBOARD_SECTION_TITLE_CLASS}>{REPORTS_PAGE.topPerforming}</p>
          {meta ? (
            <p data-reports-module-meta="" className="t-body-sm text-ink-3">
              {meta}
            </p>
          ) : null}
        </div>
        <div className={cn("flex min-w-0 flex-wrap items-center", DASHBOARD_RELATED_GAP_CLASS)}>
          <SegmentedTrack
            activeIndex={pills.indexOf(active)}
            trackClass={DASHBOARD_TOP_PILL_CLUSTER_CLASS}
            thumbClass={DASHBOARD_TOP_PILL_THUMB_CLASS}
            data-reports-top-pills=""
          >
            {pills.map((id) => {
              const on = id === active;
              const item = PANES[id];
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  data-segmented-item=""
                  data-reports-top-pill={id}
                  className={cn(
                    DASHBOARD_TOP_PILL_BUTTON_CLASS,
                    on ? DASHBOARD_TOP_PILL_BUTTON_ON_CLASS : DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
                  )}
                  onClick={() => setPill(id)}
                >
                  {item.label}
                </button>
              );
            })}
          </SegmentedTrack>
          <DashboardViewAlts
            modes={["list", "bars"]}
            mode={mode}
            onChange={(next) => {
              if (next === "map") return;
              setMode(next);
            }}
          />
          <DashboardViewAll href={pane.href} />
        </div>
      </div>
      <div data-reports-ranked-pane="" className="[overflow-anchor:none]">
        {rows.length === 0 ? (
          <p
            data-reports-ranked-empty=""
            className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
          >
            {pane.empty}
          </p>
        ) : (
          <DashboardRankedRows rows={rows} mode={mode} />
        )}
      </div>
    </section>
  );
}

export function ReportsTerritories({
  rows,
  periodLabel,
  updated,
}: {
  rows: readonly ReportsCountRow[];
  periodLabel?: string | null;
  updated?: string | null;
}) {
  const real = rows.length > 0;
  const [mode, setMode] = useState<DashboardRegisterView>(real ? "map" : "list");
  const ranked = rankedRowsFromCounts(rows, true);
  const meta = dashboardModuleMetaLine({ period: periodLabel, updated });
  const view = real ? mode : "list";

  return (
    <section
      data-reports-territories=""
      data-reports-ranked="territories"
      data-reports-view={view}
      className={DASHBOARD_MODULE_CARD_CLASS}
    >
      <div className={cn("flex items-start justify-between", DASHBOARD_RELATED_GAP_CLASS, DASHBOARD_CARD_PAD_LIST)}>
        <div className={cn("min-w-0", DASHBOARD_RELATED_GAP_CLASS, "flex flex-col")}>
          <p className={DASHBOARD_SECTION_TITLE_CLASS}>{REPORTS_PAGE.territories}</p>
          {meta ? (
            <p data-reports-module-meta="" className="t-body-sm text-ink-3">
              {meta}
            </p>
          ) : null}
        </div>
        <div className={cn("flex shrink-0 items-center", DASHBOARD_RELATED_GAP_CLASS)}>
          {real ? (
            <DashboardViewAlts modes={["map", "list", "bars"]} mode={view} onChange={setMode} />
          ) : null}
          <DashboardViewAll href={TITLES_HREF} />
        </div>
      </div>
      {real && view === "map" ? (
        <DashboardTerritoryMap rows={ranked} />
      ) : ranked.length === 0 ? (
        <p
          data-reports-ranked-empty=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {REPORTS_PAGE.territoriesEmpty}
        </p>
      ) : (
        <DashboardRankedRows rows={ranked} mode={view === "map" ? "bars" : view} />
      )}
    </section>
  );
}
