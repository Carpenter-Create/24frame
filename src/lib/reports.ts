import { financeExportHref, financePeriodLabel } from "@/lib/finance";

// Reports is the Aggregation deep-dive surface. Copy lives here, not JSX.
// Period + download rematch Overview composition only — no foreign brand or data.
// No ledger math. Download reuses the existing closed-period export.
// Find-user / export stay on Reports. Dashboard keeps one quiet Period.

export const REPORTS_HREF = "/reports";

export const REPORTS_PAGE = {
  title: "Reports",
  subtitle: "Activity across Aggregation.",
  empty: "No report data for this period yet.",
  noOrg: "Choose an organization to read reports.",
  allTime: "All time",
  thisMonth: "This month",
  ytd: "YTD",
  year: "Year",
  quarter: "Quarter",
  month: "Month",
  custom: "Custom",
  customStub: "Custom range is not available yet.",
  period: "Period",
  download: "Download",
  export: "Export",
  scope: "Scope",
  allActivity: "All activity",
  findUser: "Find Aggregation users",
  clearScope: "Clear",
  close: "Close",
  navAria: "Reports",
  revenue: "Net revenue",
  composition: "Composition",
  compositionEmpty: "No composition for this period yet.",
  platforms: "Top platforms",
  territories: "Territories",
  users: "Top users",
  status: "Status",
  deliveries: "Deliveries",
  topTitles: "Top titles",
  topPerforming: "Top performing",
  platformsEmpty: "No platform activity for this period yet.",
  territoriesEmpty: "No territory activity for this period yet.",
  usersEmpty: "No user activity for this period yet.",
  statusEmpty: "No titles for this period yet.",
  deliveriesEmpty: "No delivery activity for this period yet.",
  topTitlesEmpty: "No title activity for this period yet.",
  series: "Net revenue",
  seriesEmpty: "No closed statement for this period.",
  detail: "Activity",
  detailEmpty: "No activity for this period yet.",
  detailTitle: "Title",
  detailUser: "User",
  detailStatus: "Status",
  detailDeliveries: "Deliveries",
  detailWhen: "Last activity",
  viewAll: "View all",
} as const;

export const REPORTS_PERIOD_ALL = "all";
export const REPORTS_PERIOD_THIS_MONTH = "this-month";
export const REPORTS_PERIOD_CUSTOM = "custom";

export type ReportsPeriodKind = "all" | "ytd" | "year" | "quarter" | "month";

export type ReportsPeriod =
  | { kind: "all"; key: typeof REPORTS_PERIOD_ALL; label: string }
  | { kind: "ytd"; key: "ytd"; year: number; label: string }
  | { kind: "year"; key: string; year: number; label: string }
  | { kind: "quarter"; key: string; year: number; quarter: 1 | 2 | 3 | 4; label: string }
  | { kind: "month"; key: string; year: number; month: number; label: string };

export type ReportsPeriodOption = {
  key: string;
  label: string;
  group: ReportsPeriodKind | "custom";
};

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

export const REPORTS_PERIOD_PRESETS = [
  { grain: "all" as const, label: REPORTS_PAGE.allTime },
  { grain: "ytd" as const, label: REPORTS_PAGE.ytd },
  { grain: "year" as const, label: REPORTS_PAGE.year },
  { grain: "quarter" as const, label: REPORTS_PAGE.quarter },
  { grain: "month" as const, label: REPORTS_PAGE.month },
] as const;

function scalarQuery(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function reportsMonthKey(year: number, month: number): string {
  return financePeriodLabel(year, month);
}

export function reportsYearKey(year: number): string {
  return String(year);
}

export function reportsQuarterKey(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `Q${quarter}${year}`;
}

export function reportsQuarterLabel(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `Q${quarter} ${year}`;
}

export function reportsYtdLabel(year: number): string {
  return `${REPORTS_PAGE.ytd} ${year}`;
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

export function utcQuarter(month: number): 1 | 2 | 3 | 4 {
  return Math.ceil(month / 3) as 1 | 2 | 3 | 4;
}

export function parseReportsPeriod(
  raw: string | string[] | undefined,
  now: Date,
): ReportsPeriod {
  const value = scalarQuery(raw);
  const current = utcYearMonth(now);
  const currentQuarter = utcQuarter(current.month);
  if (!value || value === REPORTS_PERIOD_ALL || value === REPORTS_PERIOD_CUSTOM) {
    return { kind: "all", key: REPORTS_PERIOD_ALL, label: REPORTS_PAGE.allTime };
  }
  if (value === "ytd") {
    return { kind: "ytd", key: "ytd", year: current.year, label: reportsYtdLabel(current.year) };
  }
  if (value === "year") {
    return {
      kind: "year",
      key: reportsYearKey(current.year),
      year: current.year,
      label: reportsYearKey(current.year),
    };
  }
  if (value === "quarter") {
    return {
      kind: "quarter",
      key: reportsQuarterKey(current.year, currentQuarter),
      year: current.year,
      quarter: currentQuarter,
      label: reportsQuarterLabel(current.year, currentQuarter),
    };
  }
  if (value === "month" || value === REPORTS_PERIOD_THIS_MONTH) {
    return {
      kind: "month",
      key: reportsMonthKey(current.year, current.month),
      year: current.year,
      month: current.month,
      label: reportsMonthKey(current.year, current.month),
    };
  }
  const quarter = /^Q([1-4])\s*(\d{4})$/i.exec(value);
  if (quarter) {
    const q = Number(quarter[1]) as 1 | 2 | 3 | 4;
    const year = Number(quarter[2]);
    return {
      kind: "quarter",
      key: reportsQuarterKey(year, q),
      year,
      quarter: q,
      label: reportsQuarterLabel(year, q),
    };
  }
  if (/^\d{4}$/.test(value)) {
    const year = Number(value);
    return { kind: "year", key: reportsYearKey(year), year, label: reportsYearKey(year) };
  }
  const parsed = parseYearMonthKey(value);
  if (parsed) {
    return {
      kind: "month",
      key: reportsMonthKey(parsed.year, parsed.month),
      year: parsed.year,
      month: parsed.month,
      label: reportsMonthKey(parsed.year, parsed.month),
    };
  }
  return { kind: "all", key: REPORTS_PERIOD_ALL, label: REPORTS_PAGE.allTime };
}

export function reportsPeriodIsConcrete(period: ReportsPeriod): boolean {
  return period.kind !== "all";
}

export function reportsYearMonthInPeriod(
  year: number,
  month: number,
  period: ReportsPeriod,
): boolean {
  if (period.kind === "all") return true;
  if (period.kind === "year" || period.kind === "ytd") return year === period.year;
  if (period.kind === "quarter") {
    return year === period.year && utcQuarter(month) === period.quarter;
  }
  return year === period.year && month === period.month;
}

export function isoInReportsPeriod(iso: string, period: ReportsPeriod): boolean {
  if (period.kind === "all") return true;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return false;
  const date = new Date(ms);
  return reportsYearMonthInPeriod(date.getUTCFullYear(), date.getUTCMonth() + 1, period);
}

export function parseReportsUserId(raw: string | string[] | undefined): string | null {
  const value = scalarQuery(raw);
  if (!value || value === "all") return null;
  return value;
}

export function parseReportsUserIds(raw: string | string[] | undefined): string[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    for (const part of value.split(",")) {
      const id = part.trim();
      if (!id || id === "all" || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export function reportsHref(input: {
  period?: string;
  user?: string | null;
  users?: readonly string[];
}): string {
  const params = new URLSearchParams();
  if (input.period && input.period !== REPORTS_PERIOD_ALL && input.period !== REPORTS_PERIOD_CUSTOM) {
    params.set("period", input.period);
  }
  const users = input.users?.filter(Boolean) ?? (input.user ? [input.user] : []);
  if (users.length === 1) params.set("user", users[0]);
  if (users.length > 1) params.set("user", users.join(","));
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

export function reportsPeriodPresetKey(grain: ReportsPeriodKind, now: Date): string {
  return parseReportsPeriod(grain === "all" ? "all" : grain, now).key;
}

export function reportsPeriodOptions(
  now: Date,
  sources: readonly { year: number; month: number }[],
): ReportsPeriodOption[] {
  const current = parseReportsPeriod("month", now);
  const year = parseReportsPeriod("year", now);
  const quarter = parseReportsPeriod("quarter", now);
  const ytd = parseReportsPeriod("ytd", now);
  const seen = new Set<string>(["all", ytd.key, year.key, quarter.key, current.key]);
  const options: ReportsPeriodOption[] = [
    { key: "all", label: REPORTS_PAGE.allTime, group: "all" },
    { key: ytd.key, label: ytd.label, group: "ytd" },
    { key: year.key, label: year.label, group: "year" },
    { key: quarter.key, label: quarter.label, group: "quarter" },
    { key: current.key, label: current.label, group: "month" },
  ];
  const extra: ReportsPeriodOption[] = [];
  for (const source of sources) {
    if (!Number.isInteger(source.year) || source.month < 1 || source.month > 12) continue;
    const monthKey = reportsMonthKey(source.year, source.month);
    const yearKey = reportsYearKey(source.year);
    const q = utcQuarter(source.month);
    const quarterKey = reportsQuarterKey(source.year, q);
    const candidates: ReportsPeriodOption[] = [
      { key: yearKey, label: yearKey, group: "year" },
      { key: quarterKey, label: reportsQuarterLabel(source.year, q), group: "quarter" },
      { key: monthKey, label: monthKey, group: "month" },
    ];
    for (const candidate of candidates) {
      if (seen.has(candidate.key)) continue;
      seen.add(candidate.key);
      extra.push(candidate);
    }
  }
  extra.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
  return [...options, ...extra];
}

export function reportsPeriodOptionsFor(
  period: ReportsPeriod,
  now: Date,
  sources: readonly { year: number; month: number }[],
): ReportsPeriodOption[] {
  const options = reportsPeriodOptions(now, sources);
  if (options.some((option) => option.key === period.key)) return options;
  return [...options, { key: period.key, label: period.label, group: period.kind }];
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

export function filterReportsUsers(
  users: readonly ReportsUserOption[],
  query: string,
): ReportsUserOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...users];
  return users.filter((user) => user.label.toLowerCase().includes(needle));
}

export function reportsDownloadHref(input: {
  period: ReportsPeriod;
  periods: readonly { id: string; period_year: number; period_month: number; status: string }[];
}): string | null {
  const selected = input.period;
  if (selected.kind === "all") return null;
  const matches = input.periods
    .filter(
      (period) =>
        period.status === "closed" &&
        reportsYearMonthInPeriod(period.period_year, period.period_month, selected),
    )
    .sort((a, b) =>
      a.period_year !== b.period_year
        ? b.period_year - a.period_year
        : b.period_month - a.period_month,
    );
  const match = matches[0];
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
