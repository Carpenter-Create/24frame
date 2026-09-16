import { financeExportHref, financePeriodLabel } from "@/lib/finance";

// Reports is the one Aggregation activity surface. Copy lives here, not JSX.
// Period + download rematch RL Overview composition only — no RL brand or data.
// No ledger math. Download reuses the existing closed-period export.

export const REPORTS_HREF = "/reports";

export const REPORTS_PAGE = {
  title: "Reports",
  subtitle: "Activity across Aggregation.",
  empty: "No report data for this period yet.",
  noOrg: "Choose an organization to read reports.",
  allTime: "All time",
  thisMonth: "This month",
  period: "Period",
  download: "Download",
  scope: "Scope",
  allActivity: "All activity",
  navAria: "Reports",
  platforms: "Platforms",
  territories: "Territories",
  status: "Status",
  deliveries: "Deliveries",
  topTitles: "Top titles",
  platformsEmpty: "No platform activity for this period yet.",
  territoriesEmpty: "No territory activity for this period yet.",
  statusEmpty: "No titles for this period yet.",
  deliveriesEmpty: "No delivery activity for this period yet.",
  topTitlesEmpty: "No title activity for this period yet.",
  series: "Catalog activity",
  seriesEmpty: "No catalog activity for this period yet.",
} as const;

export const REPORTS_PERIOD_ALL = "all";
export const REPORTS_PERIOD_THIS_MONTH = "this-month";

export type ReportsPeriod =
  | { kind: "all"; key: typeof REPORTS_PERIOD_ALL }
  | { kind: "this-month"; key: typeof REPORTS_PERIOD_THIS_MONTH; year: number; month: number }
  | { kind: "month"; key: string; year: number; month: number };

export type ReportsMonthOption = {
  year: number;
  month: number;
  key: string;
  label: string;
};

export type ReportsUserOption = {
  id: string;
  label: string;
};

export type ReportsCountRow = {
  name: string;
  count: number;
};

function scalarQuery(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function reportsMonthKey(year: number, month: number): string {
  return financePeriodLabel(year, month);
}

export function parseYearMonthKey(raw: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return { year, month };
}

export function utcYearMonth(now: Date): { year: number; month: number } {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function parseReportsPeriod(
  raw: string | string[] | undefined,
  now: Date,
): ReportsPeriod {
  const value = scalarQuery(raw);
  const current = utcYearMonth(now);
  if (!value || value === REPORTS_PERIOD_ALL) {
    return { kind: "all", key: REPORTS_PERIOD_ALL };
  }
  if (value === REPORTS_PERIOD_THIS_MONTH) {
    return { kind: "this-month", key: REPORTS_PERIOD_THIS_MONTH, ...current };
  }
  const parsed = parseYearMonthKey(value);
  if (!parsed) return { kind: "all", key: REPORTS_PERIOD_ALL };
  return { kind: "month", key: reportsMonthKey(parsed.year, parsed.month), ...parsed };
}

export function reportsPeriodIsConcrete(period: ReportsPeriod): boolean {
  return period.kind !== "all";
}

export function isoInReportsPeriod(iso: string, period: ReportsPeriod): boolean {
  if (period.kind === "all") return true;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return false;
  const date = new Date(ms);
  return date.getUTCFullYear() === period.year && date.getUTCMonth() + 1 === period.month;
}

export function parseReportsUserId(raw: string | string[] | undefined): string | null {
  const value = scalarQuery(raw);
  if (!value || value === "all") return null;
  return value;
}

export function reportsHref(input: { period?: string; user?: string | null }): string {
  const params = new URLSearchParams();
  if (input.period && input.period !== REPORTS_PERIOD_ALL) params.set("period", input.period);
  if (input.user) params.set("user", input.user);
  const query = params.toString();
  return query ? `${REPORTS_HREF}?${query}` : REPORTS_HREF;
}

export function availableReportMonths(
  sources: readonly { year: number; month: number }[],
): ReportsMonthOption[] {
  const seen = new Set<string>();
  const months: ReportsMonthOption[] = [];
  for (const source of sources) {
    if (!Number.isInteger(source.year) || source.month < 1 || source.month > 12) continue;
    const key = reportsMonthKey(source.year, source.month);
    if (seen.has(key)) continue;
    seen.add(key);
    months.push({
      year: source.year,
      month: source.month,
      key,
      label: key,
    });
  }
  return months.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
}

export function yearMonthFromIso(iso: string): { year: number; month: number } | null {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const date = new Date(ms);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

export function reportsUserLabel(input: {
  displayName?: string | null;
  handle?: string | null;
}): string | null {
  const name = input.displayName?.trim();
  if (name) return name;
  const handle = input.handle?.trim();
  if (handle) return handle;
  return null;
}

export function reportsDownloadHref(input: {
  period: ReportsPeriod;
  periods: readonly { id: string; period_year: number; period_month: number; status: string }[];
}): string | null {
  if (!reportsPeriodIsConcrete(input.period)) return null;
  const match = input.periods.find(
    (period) =>
      period.status === "closed" &&
      period.period_year === input.period.year &&
      period.period_month === input.period.month,
  );
  return match ? financeExportHref(match.id, "pdf") : null;
}

export function countNamedRows(
  rows: readonly { name: string }[],
): ReportsCountRow[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function isLegacyReportsPath(pathname: string): boolean {
  return (
    pathname === "/analytics" ||
    pathname.startsWith("/analytics/") ||
    pathname === "/earn" ||
    pathname.startsWith("/earn/") ||
    pathname === "/finance" ||
    pathname.startsWith("/finance/")
  );
}
