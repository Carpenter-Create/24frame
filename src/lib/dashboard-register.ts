import { DASHBOARD_ADMIN } from "@/lib/dashboard-admin";
import { DASHBOARD_HOME, rankedBarPercent } from "@/lib/dashboard-home";
import { isoAlpha2FromNumeric, isoNumericForAlpha2 } from "@/lib/iso3166-numeric";
import { ISO_COUNTRIES } from "@/lib/territories";
import type { ReportsCountRow } from "@/lib/reports";

// Company-admin `/dashboard` register: Overview structure (hero · activity ·
// ranked modules · view alts) rematched to house tokens. 24Frame nouns only —
// Net revenue, Recent account activity, Top titles, Top platforms,
// Top territories, Reports. No Top works / sources / contributors / Exports.

export const DASHBOARD_REGISTER_VIEWS = ["map", "list", "bars"] as const;

export type DashboardRegisterView = (typeof DASHBOARD_REGISTER_VIEWS)[number];

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
    href: `/titles/${item.id}`,
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

/** Sporty Blue wash — house accent mixed into muted surface. No amber/green. */
export function dashboardChoroplethFill(ratio: number): string {
  const clamped = Math.max(0, Math.min(1, ratio));
  if (clamped <= 0) return "var(--surface-muted)";
  const pct = Math.round(18 + clamped * 82);
  return `color-mix(in srgb, var(--accent) ${pct}%, var(--surface-muted))`;
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
