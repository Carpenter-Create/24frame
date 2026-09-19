import { DASHBOARD_ADMIN } from "@/lib/dashboard-admin";
import { DASHBOARD_HOME, rankedBarPercent } from "@/lib/dashboard-home";
import { TITLES_HREF } from "@/lib/title-public-id";
import { isoAlpha2FromNumeric, isoNumericForAlpha2 } from "@/lib/iso3166-numeric";
import { ISO_COUNTRIES } from "@/lib/territories";
import type { ReportsCountRow } from "@/lib/reports";

// Company-admin `/dashboard` register rematches RL Overview
// (`HeadlineStats` → taller Net revenue left, Recent activity glance
// right — account announcements, not findings — Licensing status
// full-width nested title→endpoint, `TopWorksCard` → Top titles,
// `TerritoryMap` → Territories map/list/bars). One feed only. House
// tokens only — Geist · Sporty Blue · hairline. 24Frame nouns only. No
// Top works / sources / contributors / Exports. Coinbase quieter than
// RL flourish.

export const DASHBOARD_REGISTER_VIEWS = ["map", "list", "bars"] as const;

export type DashboardRegisterView = (typeof DASHBOARD_REGISTER_VIEWS)[number];

export const DASHBOARD_TOP_PILLS = ["titles", "platforms", "territories"] as const;

export type DashboardTopPill = (typeof DASHBOARD_TOP_PILLS)[number];

/** RL TerritoryMap LIST_DEFAULT_LIMIT. */
export const DASHBOARD_LIST_DEFAULT_LIMIT = 10;

/** RL catalog_breakdown territory p_limit — map needs the long tail. */
export const DASHBOARD_TERRITORY_LIMIT = 200;

export const DASHBOARD_PLATFORM_LIMIT = 10;

/**
 * Discrete LOW→HIGH house scale. RL uses a 6-stop brand ramp; rematch is
 * muted surface → Sporty Blue wash. Never amber, never 100% accent.
 */
export const DASHBOARD_CHOROPLETH_SCALE = [
  "var(--surface-muted)",
  "color-mix(in srgb, var(--accent) 16%, var(--surface-muted))",
  "color-mix(in srgb, var(--accent) 28%, var(--surface-muted))",
  "color-mix(in srgb, var(--accent) 40%, var(--surface-muted))",
  "color-mix(in srgb, var(--accent) 52%, var(--surface-muted))",
  "color-mix(in srgb, var(--accent) 64%, var(--surface-muted))",
] as const;

export const DASHBOARD_CHOROPLETH_HOVER =
  "color-mix(in srgb, var(--accent) 72%, var(--surface-muted))";

export const DASHBOARD_MAP_WIDTH = 700;
export const DASHBOARD_MAP_HEIGHT = 340;
export const DASHBOARD_MAP_SCALE = 120;
export const DASHBOARD_MAP_CENTER: [number, number] = [0, 30];

export type DashboardRankedRow = {
  key: string;
  label: string;
  code?: string;
  count: number;
  href?: string;
  numeric?: number | null;
};

const NAME_TO_CODE = new Map(
  Object.entries(ISO_COUNTRIES).map(([code, name]) => [name.toLowerCase(), code]),
);

const TERRITORY_ALIASES: Record<string, string> = {
  usa: "US",
  uk: "GB",
  "great britain": "GB",
  "united states of america": "US",
  "czech republic": "CZ",
};

export function resolveTerritoryRef(raw: string): { code: string | null; name: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { code: null, name: "" };
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && ISO_COUNTRIES[upper]) {
    return { code: upper, name: ISO_COUNTRIES[upper] };
  }
  const alias = TERRITORY_ALIASES[trimmed.toLowerCase()];
  if (alias && ISO_COUNTRIES[alias]) {
    return { code: alias, name: ISO_COUNTRIES[alias] };
  }
  const byName = NAME_TO_CODE.get(trimmed.toLowerCase());
  if (byName) return { code: byName, name: ISO_COUNTRIES[byName] };
  return { code: null, name: trimmed };
}

export function dashboardShareRatio(count: number, total: number): number {
  if (total <= 0 || count <= 0) return 0;
  return count / total;
}

export function dashboardSharePercent(count: number, total: number): number {
  return rankedBarPercent(count, total);
}

export function dashboardShareLabel(count: number, total: number): string {
  return `${dashboardSharePercent(count, total)}%`;
}

/**
 * RL TerritoryMap getColor — discrete steps, never a continuous wash.
 * amount<=0 or max<=0 → scale[0]; else floor(ratio*(n-1))+1.
 */
export function dashboardChoroplethIndex(amount: number, max: number): number {
  if (amount <= 0 || max <= 0) return 0;
  const ratio = Math.min(amount / max, 1);
  return Math.min(
    Math.floor(ratio * (DASHBOARD_CHOROPLETH_SCALE.length - 1)) + 1,
    DASHBOARD_CHOROPLETH_SCALE.length - 1,
  );
}

/** Quiet Sporty Blue / neutral house scale. No amber, gold, or 100% accent. */
export function dashboardChoroplethFill(amount: number, max: number): string {
  return DASHBOARD_CHOROPLETH_SCALE[dashboardChoroplethIndex(amount, max)];
}

export function dashboardChoroplethHoverFill(amount: number, max: number): string {
  if (amount <= 0 || max <= 0) return DASHBOARD_CHOROPLETH_SCALE[0];
  return DASHBOARD_CHOROPLETH_HOVER;
}

/**
 * Split a title into [main, parenthetical] for typographic weighting.
 * "Winter Light (Director's Cut)" → ["Winter Light", "(Director's Cut)"].
 * Port of RL TopWorksCard.splitTitle — 24Frame titles, not works.
 */
export function splitDashboardTitle(title: string): [string, string | null] {
  const match = title.match(/^(.*?)\s*(\(.+\))\s*$/);
  if (!match) return [title, null];
  return [match[1].trim(), match[2].trim()];
}

/** Top-1 and Top-5 share of the ranked total. RL TopWorksCard concentration. */
export function dashboardConcentration(
  counts: readonly number[],
): { top1Pct: number; top5Pct: number } {
  const total = counts.reduce((sum, count) => sum + count, 0);
  if (total <= 0) return { top1Pct: 0, top5Pct: 0 };
  const top1Pct = ((counts[0] ?? 0) / total) * 100;
  const top5Pct = (counts.slice(0, 5).reduce((sum, count) => sum + count, 0) / total) * 100;
  return { top1Pct, top5Pct };
}

export function dashboardConcentrationLine(counts: readonly number[]): string {
  const { top1Pct, top5Pct } = dashboardConcentration(counts);
  return `${top1Pct.toFixed(1)}% ${DASHBOARD_HOME.top1} · ${top5Pct.toFixed(1)}% ${DASHBOARD_HOME.top5}`;
}

export function dashboardListLimitLabel(count: number, limit = DASHBOARD_LIST_DEFAULT_LIMIT): string {
  return count > limit
    ? `${DASHBOARD_HOME.viewAll} ${count} ${count === 1 ? "territory" : "territories"}`
    : dashboardTerritoryCountLabel(count);
}

export function dashboardShowTopLabel(limit = DASHBOARD_LIST_DEFAULT_LIMIT): string {
  return `${DASHBOARD_HOME.showTop} ${limit}`;
}

export function rankedRowsFromCounts(
  rows: readonly ReportsCountRow[],
  territory = false,
): DashboardRankedRow[] {
  return rows.map((row) => {
    if (!territory) {
      return { key: row.name, label: row.name, count: row.count };
    }
    const ref = resolveTerritoryRef(row.name);
    return {
      key: ref.code ?? row.name,
      label: ref.name,
      code: ref.code ?? undefined,
      count: row.count,
      numeric: ref.code ? isoNumericForAlpha2(ref.code) : null,
    };
  });
}

export function rankedRowsFromTitles(
  items: readonly { id: string; title: string; count: number }[],
): DashboardRankedRow[] {
  return items.map((item) => ({
    key: item.id,
    label: item.title,
    count: item.count,
    href: `${TITLES_HREF}/${item.id}`,
  }));
}

export function rankedTotal(rows: readonly { count: number }[]): number {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

export function dashboardModuleMetaLine(input: {
  period?: string | null;
  updated?: string | null;
}): string | null {
  const period = input.period?.trim();
  const updated = input.updated?.trim();
  if (!period && !updated) return null;
  if (period && updated) return `${period} · ${DASHBOARD_ADMIN.updatedPrefix} ${updated}`;
  if (period) return period;
  return `${DASHBOARD_ADMIN.updatedPrefix} ${updated}`;
}

export function dashboardTerritoryCountLabel(count: number): string {
  return count === 1 ? "1 territory" : `${count} territories`;
}

export function dashboardRowForNumeric(
  byNumeric: ReadonlyMap<number, DashboardRankedRow>,
  rawId: string | number | null | undefined,
): DashboardRankedRow | null {
  const code = isoAlpha2FromNumeric(rawId);
  if (!code) {
    const numeric = typeof rawId === "number" ? rawId : Number(rawId);
    if (!Number.isInteger(numeric)) return null;
    return byNumeric.get(numeric) ?? null;
  }
  const numeric = isoNumericForAlpha2(code);
  if (numeric == null) return null;
  return byNumeric.get(numeric) ?? null;
}

export function isDashboardRegisterView(value: string): value is DashboardRegisterView {
  return (DASHBOARD_REGISTER_VIEWS as readonly string[]).includes(value);
}

export const DASHBOARD_REGISTER_COPY = {
  map: DASHBOARD_HOME.viewMap,
  list: DASHBOARD_HOME.viewList,
  bars: DASHBOARD_HOME.viewBars,
  low: DASHBOARD_HOME.legendLow,
  high: DASHBOARD_HOME.legendHigh,
} as const;
