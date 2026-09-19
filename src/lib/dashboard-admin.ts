import {
  DASHBOARD_HOME_STACK,
  dashboardTitleStatusLabel,
  type ClientHomeTitle,
} from "@/lib/dashboard-home";
import { formatUsdCents } from "@/lib/finance";
import { parseReportsUserId, reportsUserLabel, type ReportsUserOption } from "@/lib/reports";
import { titleClientPath } from "@/lib/title-public-id";
import { aggregationPath } from "@/lib/workspace";

// Company-admin Dashboard hero. Period URL state rematch RL Overview
// behavior only — Geist / Sporty Blue / hairline. One unlabeled period menu.
// Find-user chrome is gone; leftover ?user= parsing stays inert for data.
// Live money is never invented here; craft sample series lives in the fixture.

export const DASHBOARD_HREF = aggregationPath("dashboard");

export const DASHBOARD_ADMIN = {
  revenue: "Net revenue",
  // Killed from the hero metric slot after #332 Mac FAIL — tests lock absence.
  revenueEmpty: "No revenue for this period.",
  chartEmpty: "No closed statement for this period.",
  asOfPrefix: "As of",
  updatedPrefix: "Updated",
  updatedNone: "No closed statement.",
  activity: "Recent activity",
  activityEmpty: "No account activity for this period.",
  viewAll: "View all",
  // Killed from Dashboard chrome after the 2026-09-16 Adam lock — tests lock absence.
  findUser: "Find a user account",
  close: "Close",
  allCompany: "All company activity",
  period: "Period",
  allTime: "All time",
  ytd: "YTD",
  year: "Year",
  quarter: "Quarter",
  month: "Month",
  titleAdded: "Title added",
  deliveryUpdated: "Delivery updated",
  findingOpened: "Finding opened",
  performanceReportAvailable: "New performance report available",
  titleStatusUpdated: "status updated to",
} as const;

export function dashboardTitleStatusUpdatedDetail(statusLabel: string): string {
  return `${DASHBOARD_ADMIN.titleStatusUpdated} ${statusLabel}`;
}

export function isCompanyAdminRole(role: string | null | undefined): boolean {
  return role === "account_owner";
}

export type DashboardPeriodKind = "all" | "ytd" | "year" | "quarter" | "month";

export type DashboardPeriod =
  | { kind: "all"; key: "all"; label: string }
  | { kind: "ytd"; key: "ytd"; year: number; label: string }
  | { kind: "year"; key: string; year: number; label: string }
  | { kind: "quarter"; key: string; year: number; quarter: 1 | 2 | 3 | 4; label: string }
  | { kind: "month"; key: string; year: number; month: number; label: string };

export type DashboardPeriodOption = {
  key: string;
  label: string;
  group: DashboardPeriodKind;
};

export const DASHBOARD_PERIOD_MENU_GROUPS = [
  { group: "all" as const, label: DASHBOARD_ADMIN.allTime },
  { group: "ytd" as const, label: DASHBOARD_ADMIN.ytd },
  { group: "year" as const, label: DASHBOARD_ADMIN.year },
  { group: "quarter" as const, label: DASHBOARD_ADMIN.quarter },
  { group: "month" as const, label: DASHBOARD_ADMIN.month },
] as const;

export type DashboardPeriodMenuGroup = {
  group: DashboardPeriodKind;
  label: string;
  options: DashboardPeriodOption[];
};

function periodOptionRecency(option: DashboardPeriodOption): number {
  if (option.group === "all") return Number.POSITIVE_INFINITY;
  if (option.group === "ytd") return Number.POSITIVE_INFINITY - 1;
  if (option.group === "year") return Number(option.key) * 100;
  const quarter = /^Q([1-4])(\d{4})$/i.exec(option.key);
  if (quarter) return Number(quarter[2]) * 100 + Number(quarter[1]) * 20;
  const month = /^(\d{4})-(\d{2})$/.exec(option.key);
  if (month) return Number(month[1]) * 100 + Number(month[2]);
  return 0;
}

export function dashboardPeriodMenuGroups(
  options: readonly DashboardPeriodOption[],
): DashboardPeriodMenuGroup[] {
  return DASHBOARD_PERIOD_MENU_GROUPS.flatMap((section) => {
    const rows = options
      .filter((option) => option.group === section.group)
      .sort((a, b) => periodOptionRecency(b) - periodOptionRecency(a));
    if (rows.length === 0) return [];
    return [{ group: section.group, label: section.label, options: rows }];
  });
}

export function dashboardPeriodOption(
  options: readonly DashboardPeriodOption[],
  key: string,
): DashboardPeriodOption | undefined {
  return options.find((option) => option.key === key);
}

export type DashboardRevenuePoint = {
  key: string;
  label: string;
  year: number;
  month: number;
  netCents: number;
};

export type DashboardRevenueHero = {
  totalCents: number | null;
  asOf: string;
  updated: string | null;
  compare: DashboardCompare | null;
  points: DashboardRevenuePoint[];
};

export type DashboardCompare = {
  text: string;
  priorLabel: string;
};

export type DashboardActivityActor = {
  id: string | null;
  initial: string;
};

export const DASHBOARD_ACTIVITY_KINDS = [
  "title_added",
  "delivery_updated",
  "title_status",
  "performance_report",
] as const;
export type DashboardActivityKind = (typeof DASHBOARD_ACTIVITY_KINDS)[number];

export type DashboardActivityRow = {
  id: string;
  title: string;
  href: string;
  at: string;
  count: number;
  detail: string;
  actorId: string | null;
  actor: DashboardActivityActor;
  kind: DashboardActivityKind;
};

export type DashboardActivityReport = {
  id: string;
  at: string;
  href: string;
};

function scalarQuery(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function utcYearMonth(now: Date): { year: number; month: number } {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function utcQuarter(month: number): 1 | 2 | 3 | 4 {
  return Math.ceil(month / 3) as 1 | 2 | 3 | 4;
}

export function dashboardYearKey(year: number): string {
  return String(year);
}

export function dashboardQuarterKey(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `Q${quarter}${year}`;
}

export function dashboardMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function dashboardQuarterLabel(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `Q${quarter} ${year}`;
}

export function dashboardYtdLabel(year: number): string {
  return `${DASHBOARD_ADMIN.ytd} ${year}`;
}

export function parseDashboardPeriod(
  raw: string | string[] | undefined,
  now: Date,
): DashboardPeriod {
  const value = scalarQuery(raw);
  const current = utcYearMonth(now);
  const currentQuarter = utcQuarter(current.month);
  if (!value || value === "all") {
    return { kind: "all", key: "all", label: DASHBOARD_ADMIN.allTime };
  }
  if (value === "ytd") {
    return { kind: "ytd", key: "ytd", year: current.year, label: dashboardYtdLabel(current.year) };
  }
  if (value === "year") {
    return {
      kind: "year",
      key: dashboardYearKey(current.year),
      year: current.year,
      label: dashboardYearKey(current.year),
    };
  }
  if (value === "quarter") {
    return {
      kind: "quarter",
      key: dashboardQuarterKey(current.year, currentQuarter),
      year: current.year,
      quarter: currentQuarter,
      label: dashboardQuarterLabel(current.year, currentQuarter),
    };
  }
  if (value === "month" || value === "this-month") {
    return {
      kind: "month",
      key: dashboardMonthKey(current.year, current.month),
      year: current.year,
      month: current.month,
      label: dashboardMonthKey(current.year, current.month),
    };
  }
  const quarter = /^Q([1-4])\s*(\d{4})$/i.exec(value);
  if (quarter) {
    const q = Number(quarter[1]) as 1 | 2 | 3 | 4;
    const year = Number(quarter[2]);
    return {
      kind: "quarter",
      key: dashboardQuarterKey(year, q),
      year,
      quarter: q,
      label: dashboardQuarterLabel(year, q),
    };
  }
  if (/^\d{4}$/.test(value)) {
    const year = Number(value);
    return { kind: "year", key: dashboardYearKey(year), year, label: dashboardYearKey(year) };
  }
  const month = /^(\d{4})-(\d{2})$/.exec(value);
  if (month) {
    const year = Number(month[1]);
    const monthNumber = Number(month[2]);
    if (monthNumber >= 1 && monthNumber <= 12) {
      return {
        kind: "month",
        key: dashboardMonthKey(year, monthNumber),
        year,
        month: monthNumber,
        label: dashboardMonthKey(year, monthNumber),
      };
    }
  }
  return { kind: "all", key: "all", label: DASHBOARD_ADMIN.allTime };
}

export function dashboardHref(input: { period?: string; user?: string | null }): string {
  const params = new URLSearchParams();
  if (input.period && input.period !== "all") params.set("period", input.period);
  if (input.user) params.set("user", input.user);
  const query = params.toString();
  return query ? `${DASHBOARD_HREF}?${query}` : DASHBOARD_HREF;
}

export function parseDashboardUserId(raw: string | string[] | undefined): string | null {
  return parseReportsUserId(raw);
}

export function dashboardUserLabel(input: {
  displayName?: string | null;
  handle?: string | null;
}): string | null {
  return reportsUserLabel(input);
}

export function filterDashboardUsers(
  users: readonly ReportsUserOption[],
  query: string,
): ReportsUserOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return users.filter((user) => user.label.toLowerCase().includes(needle));
}

function yearMonthInPeriod(year: number, month: number, period: DashboardPeriod): boolean {
  if (period.kind === "all") return true;
  if (period.kind === "year" || period.kind === "ytd") return year === period.year;
  if (period.kind === "quarter") {
    return year === period.year && utcQuarter(month) === period.quarter;
  }
  return year === period.year && month === period.month;
}

export function isoInDashboardPeriod(iso: string, period: DashboardPeriod): boolean {
  if (period.kind === "all") return true;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return false;
  const date = new Date(ms);
  return yearMonthInPeriod(date.getUTCFullYear(), date.getUTCMonth() + 1, period);
}

export function dashboardPeriodOptions(
  now: Date,
  sources: readonly { year: number; month: number }[],
): DashboardPeriodOption[] {
  const current = parseDashboardPeriod("month", now);
  const year = parseDashboardPeriod("year", now);
  const quarter = parseDashboardPeriod("quarter", now);
  const ytd = parseDashboardPeriod("ytd", now);
  const seen = new Set<string>(["all", ytd.key, year.key, quarter.key, current.key]);
  const options: DashboardPeriodOption[] = [
    { key: "all", label: DASHBOARD_ADMIN.allTime, group: "all" },
    { key: ytd.key, label: ytd.label, group: "ytd" },
    { key: year.key, label: year.label, group: "year" },
    { key: quarter.key, label: quarter.label, group: "quarter" },
    { key: current.key, label: current.label, group: "month" },
  ];

  const extra: DashboardPeriodOption[] = [];
  for (const source of sources) {
    if (!Number.isInteger(source.year) || source.month < 1 || source.month > 12) continue;
    const monthKey = dashboardMonthKey(source.year, source.month);
    const yearKey = dashboardYearKey(source.year);
    const q = utcQuarter(source.month);
    const quarterKey = dashboardQuarterKey(source.year, q);
    const candidates: DashboardPeriodOption[] = [
      { key: yearKey, label: yearKey, group: "year" },
      { key: quarterKey, label: dashboardQuarterLabel(source.year, q), group: "quarter" },
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

export function dashboardPeriodOptionsFor(
  period: DashboardPeriod,
  now: Date,
  sources: readonly { year: number; month: number }[],
): DashboardPeriodOption[] {
  const options = dashboardPeriodOptions(now, sources);
  if (options.some((option) => option.key === period.key)) return options;
  return [
    ...options,
    { key: period.key, label: period.label, group: period.kind },
  ];
}

export function filterDashboardTitles<T extends ClientHomeTitle & { created_by?: string | null }>(
  titles: readonly T[],
  period: DashboardPeriod,
  userId: string | null,
): T[] {
  return titles.filter((title) => {
    if (userId && title.created_by !== userId) return false;
    return isoInDashboardPeriod(title.created_at, period);
  });
}

export function dashboardUserTitleIds<T extends { id: string; created_by?: string | null }>(
  titles: readonly T[],
  userId: string | null,
): Set<string> | null {
  if (!userId) return null;
  return new Set(titles.filter((title) => title.created_by === userId).map((title) => title.id));
}

export function filterDashboardDeliveries<
  T extends { title_id: string; updated_at: string | null },
>(
  deliveries: readonly T[],
  period: DashboardPeriod,
  titleIds: ReadonlySet<string> | null,
): T[] {
  return deliveries.filter((row) => {
    if (titleIds && !titleIds.has(row.title_id)) return false;
    if (!row.updated_at) return period.kind === "all";
    return isoInDashboardPeriod(row.updated_at, period);
  });
}

export function formatUsdCompact(cents: number): string {
  const abs = Math.abs(cents) / 100;
  const sign = cents < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return formatUsdCents(cents);
}

export function revenueCompare(
  currentCents: number,
  priorCents: number | null,
  priorLabel: string,
): DashboardCompare | null {
  if (priorCents === null) return null;
  if (priorCents === 0) return null;
  const raw = ((currentCents - priorCents) / Math.abs(priorCents)) * 100;
  const sign = raw > 0 ? "+" : raw < 0 ? "−" : "";
  return {
    text: `${sign}${Math.abs(raw).toFixed(1)}%`,
    priorLabel,
  };
}

export function pointDelta(
  points: readonly DashboardRevenuePoint[],
  index: number,
): DashboardCompare | null {
  if (index <= 0) return null;
  const current = points[index];
  const prior = points[index - 1];
  if (!current || !prior) return null;
  return revenueCompare(current.netCents, prior.netCents, prior.label);
}

/** TrendChart tooltip line: period already shown above; this is ↑/↓ % vs prior. */
export function dashboardDeltaLine(compare: DashboardCompare): string {
  const arrow = compare.text.startsWith("−") ? "↓" : compare.text.startsWith("+") ? "↑" : "";
  return `${arrow} ${compare.text} vs ${compare.priorLabel}`.trim();
}

export function revenuePlayheadKey(
  period: DashboardPeriod,
  points: readonly DashboardRevenuePoint[],
): string | null {
  const inPeriod = points.filter((point) => yearMonthInPeriod(point.year, point.month, period));
  return inPeriod[inPeriod.length - 1]?.key ?? points[points.length - 1]?.key ?? null;
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function priorPeriod(period: DashboardPeriod): DashboardPeriod | null {
  if (period.kind === "all") return null;
  if (period.kind === "ytd" || period.kind === "year") {
    const year = period.year - 1;
    return period.kind === "ytd"
      ? { kind: "ytd", key: "ytd", year, label: dashboardYtdLabel(year) }
      : { kind: "year", key: dashboardYearKey(year), year, label: dashboardYearKey(year) };
  }
  if (period.kind === "quarter") {
    const prevQ = (period.quarter === 1 ? 4 : period.quarter - 1) as 1 | 2 | 3 | 4;
    const year = period.quarter === 1 ? period.year - 1 : period.year;
    return {
      kind: "quarter",
      key: dashboardQuarterKey(year, prevQ),
      year,
      quarter: prevQ,
      label: dashboardQuarterLabel(year, prevQ),
    };
  }
  const prev = shiftMonth(period.year, period.month, -1);
  return {
    kind: "month",
    key: dashboardMonthKey(prev.year, prev.month),
    year: prev.year,
    month: prev.month,
    label: dashboardMonthKey(prev.year, prev.month),
  };
}

function sumPoints(points: readonly DashboardRevenuePoint[]): number {
  return points.reduce((sum, point) => sum + point.netCents, 0);
}

export function buildDashboardRevenueHero(input: {
  period: DashboardPeriod;
  points: readonly DashboardRevenuePoint[];
  userId: string | null;
}): DashboardRevenueHero {
  if (input.userId) {
    return {
      totalCents: null,
      asOf: input.period.label,
      updated: null,
      compare: null,
      points: [],
    };
  }
  const inPeriod = input.points.filter((point) =>
    yearMonthInPeriod(point.year, point.month, input.period),
  );
  const latest = inPeriod[inPeriod.length - 1] ?? null;
  const prior = priorPeriod(input.period);
  const priorPoints = prior
    ? input.points.filter((point) => yearMonthInPeriod(point.year, point.month, prior))
    : [];
  const totalCents = inPeriod.length > 0 ? sumPoints(inPeriod) : null;
  const priorTotal = prior && priorPoints.length > 0 ? sumPoints(priorPoints) : null;
  return {
    totalCents,
    asOf: input.period.label,
    updated: latest?.label ?? null,
    compare: totalCents === null ? null : revenueCompare(totalCents, priorTotal, prior?.label ?? ""),
    points: [...input.points],
  };
}

export function revenuePointsFromLabels(
  rows: readonly { label: string; netCents: number }[],
): DashboardRevenuePoint[] {
  return closedRevenuePoints(
    rows.flatMap((row) => {
      const match = /^(\d{4})-(\d{2})$/.exec(row.label);
      if (!match) return [];
      return [{ year: Number(match[1]), month: Number(match[2]), netCents: row.netCents }];
    }),
  );
}

export function closedRevenuePoints(
  rows: readonly { year: number; month: number; netCents: number | null }[],
): DashboardRevenuePoint[] {
  return rows
    .filter((row) => row.netCents !== null)
    .map((row) => ({
      key: dashboardMonthKey(row.year, row.month),
      label: dashboardMonthKey(row.year, row.month),
      year: row.year,
      month: row.month,
      netCents: row.netCents ?? 0,
    }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

export type DashboardChartXY = DashboardRevenuePoint & { x: number; y: number };

export function dashboardChartGeometry(
  points: readonly DashboardRevenuePoint[],
  width: number,
  height: number,
  pad: { top: number; right: number; bottom: number; left: number },
): {
  xy: DashboardChartXY[];
  line: string;
  area: string;
  baseY: number;
  innerH: number;
  ticks: { x: number; label: string }[];
  w: number;
} | null {
  if (points.length === 0 || width <= 0) return null;
  const innerW = Math.max(width - pad.left - pad.right, 1);
  const innerH = height - pad.top - pad.bottom;
  const values = points.map((point) => point.netCents);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = Math.max(max - min, 1);
  const px = (index: number) =>
    pad.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const py = (value: number) => pad.top + innerH - ((value - min) / span) * innerH;
  const xy = points.map((point, index) => ({ ...point, x: px(index), y: py(point.netCents) }));
  const line = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const baseY = pad.top + innerH;
  const area = `${line} L${xy[xy.length - 1].x.toFixed(2)},${baseY} L${xy[0].x.toFixed(2)},${baseY} Z`;
  const tickIdx =
    xy.length <= 4 ? xy.map((_, i) => i) : [0, Math.floor((xy.length - 1) / 2), xy.length - 1];
  const ticks = [...new Set(tickIdx)].map((i) => ({ x: xy[i].x, label: xy[i].label }));
  return { xy, line, area, baseY, innerH, ticks, w: width };
}

export function nearestChartPoint(
  xy: readonly DashboardChartXY[],
  hoverX: number,
): DashboardChartXY | null {
  if (xy.length === 0) return null;
  let best = xy[0];
  for (const point of xy) {
    if (Math.abs(point.x - hoverX) < Math.abs(best.x - hoverX)) best = point;
  }
  return best;
}

export function dashboardActivityInitial(name: string | null | undefined): string {
  const trimmed = name?.trim() ?? "";
  return (trimmed.charAt(0) || "?").toUpperCase();
}

export function dashboardActivityActor(
  actorId: string | null | undefined,
  name?: string | null,
): DashboardActivityActor {
  const id = actorId?.trim() || null;
  return { id, initial: dashboardActivityInitial(name) };
}

export const DASHBOARD_ACTIVITY_AUDIT_ENTITIES = ["titles", "deliveries"] as const;
export const DASHBOARD_ACTIVITY_AUDIT_ACTIONS = ["insert", "update"] as const;

export type DashboardActivityAuditEntity = (typeof DASHBOARD_ACTIVITY_AUDIT_ENTITIES)[number];
export type DashboardActivityAuditAction = (typeof DASHBOARD_ACTIVITY_AUDIT_ACTIONS)[number];

export type DashboardAuditEvent = {
  entity: string;
  entity_id: string | null;
  action: string;
  actor: string | null;
  at: string;
  after?: unknown;
  before?: unknown;
};

function activityAuditStatus(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const status = (payload as { status?: unknown }).status;
  return typeof status === "string" ? status : null;
}

export type DashboardActivityAuditTarget = {
  entity: DashboardActivityAuditEntity;
  entityId: string;
  action: DashboardActivityAuditAction;
};

export function activityRowEntity(rowId: string): DashboardActivityAuditTarget | null {
  if (rowId.startsWith("title-status:")) {
    const entityId = rowId.slice("title-status:".length).split(":")[0]?.trim();
    return entityId ? { entity: "titles", entityId, action: "update" } : null;
  }
  if (rowId.startsWith("title:")) {
    const entityId = rowId.slice("title:".length).trim();
    return entityId ? { entity: "titles", entityId, action: "insert" } : null;
  }
  if (rowId.startsWith("delivery:")) {
    const entityId = rowId.slice("delivery:".length).trim();
    return entityId ? { entity: "deliveries", entityId, action: "update" } : null;
  }
  return null;
}

export function activityDeliveryId(rowId: string): string | null {
  const target = activityRowEntity(rowId);
  return target?.entity === "deliveries" ? target.entityId : null;
}

export function activityAuditEntityIds(rows: readonly DashboardActivityRow[]): string[] {
  return [
    ...new Set(
      rows
        .map((row) => activityRowEntity(row.id)?.entityId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
}

function latestAuditEvent(
  events: readonly DashboardAuditEvent[],
  target: DashboardActivityAuditTarget,
): DashboardAuditEvent | null {
  const matches = events.filter(
    (event) => event.entity === target.entity && event.entity_id === target.entityId,
  );
  const preferred =
    target.entity === "deliveries"
      ? matches.filter((event) => event.action === "update")
      : matches.filter((event) => event.action === target.action);
  const pool = preferred.length > 0 ? preferred : target.entity === "deliveries"
    ? matches.filter((event) => event.action === "insert")
    : [];
  return [...pool].sort((a, b) => (a.at < b.at ? 1 : -1))[0] ?? null;
}

/**
 * Stamp audit_log.actor + audit_log.at onto synthesized activity rows.
 * Status-change and report rows already carry their event clock — only
 * resolve the actor initial. Missing people stay "?". Findings stay on
 * /attention — not this feed.
 */
export function applyActivityAudit(
  rows: readonly DashboardActivityRow[],
  input: {
    events?: readonly DashboardAuditEvent[];
    profileNames?: ReadonlyMap<string, string | null>;
  } = {},
): DashboardActivityRow[] {
  const events = input.events ?? [];
  return rows
    .map((row) => {
      if (row.kind === "title_status" || row.kind === "performance_report") {
        const name = row.actorId ? (input.profileNames?.get(row.actorId) ?? null) : null;
        return { ...row, actor: dashboardActivityActor(row.actorId, name) };
      }
      const target = activityRowEntity(row.id);
      const event = target ? latestAuditEvent(events, target) : null;
      if (!event) return row;
      const actorId = event.actor?.trim() || null;
      const name = actorId ? (input.profileNames?.get(actorId) ?? null) : null;
      return {
        ...row,
        at: event.at || row.at,
        actorId,
        actor: dashboardActivityActor(actorId, name),
      };
    })
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

function activityHref(catalogId: string | null | undefined): string {
  return titleClientPath(catalogId);
}

export function recentAccountActivity(input: {
  titles: readonly (ClientHomeTitle & {
    created_by?: string | null;
    catalog_id?: string | null;
  })[];
  deliveries: readonly {
    delivery_id: string;
    title_id: string;
    title: string;
    updated_at: string | null;
  }[];
  period: DashboardPeriod;
  userId: string | null;
  events?: readonly DashboardAuditEvent[];
  report?: DashboardActivityReport | null;
}): DashboardActivityRow[] {
  const titleIds = dashboardUserTitleIds(input.titles, input.userId);
  const titles = filterDashboardTitles(input.titles, input.period, input.userId);
  const deliveries = filterDashboardDeliveries(input.deliveries, input.period, titleIds);
  const deliveryCounts = new Map<string, number>();
  for (const row of deliveries) {
    deliveryCounts.set(row.title_id, (deliveryCounts.get(row.title_id) ?? 0) + 1);
  }

  const rows: DashboardActivityRow[] = [];
  if (
    input.report &&
    !input.userId &&
    isoInDashboardPeriod(input.report.at, input.period)
  ) {
    rows.push({
      id: `report:${input.report.id}`,
      title: "",
      href: input.report.href,
      at: input.report.at,
      count: 1,
      detail: DASHBOARD_ADMIN.performanceReportAvailable,
      actorId: null,
      actor: dashboardActivityActor(null),
      kind: "performance_report",
    });
  }
  for (const event of input.events ?? []) {
    if (event.entity !== "titles" || event.action !== "update") continue;
    const entityId = event.entity_id?.trim();
    if (!entityId) continue;
    if (titleIds && !titleIds.has(entityId)) continue;
    if (!isoInDashboardPeriod(event.at, input.period)) continue;
    const after = activityAuditStatus(event.after);
    const before = activityAuditStatus(event.before);
    if (!after || after === before) continue;
    const statusLabel = dashboardTitleStatusLabel(after);
    if (!statusLabel) continue;
    const title = input.titles.find((item) => item.id === entityId);
    if (!title) continue;
    rows.push({
      id: `title-status:${entityId}:${event.at}`,
      title: title.title,
      href: activityHref(title.catalog_id),
      at: event.at,
      count: 1,
      detail: dashboardTitleStatusUpdatedDetail(statusLabel),
      actorId: event.actor?.trim() || null,
      actor: dashboardActivityActor(event.actor),
      kind: "title_status",
    });
  }
  for (const title of titles) {
    rows.push({
      id: `title:${title.id}`,
      title: title.title,
      href: activityHref(title.catalog_id),
      at: title.created_at,
      count: deliveryCounts.get(title.id) ?? 0,
      detail: DASHBOARD_ADMIN.titleAdded,
      actorId: null,
      actor: dashboardActivityActor(null),
      kind: "title_added",
    });
  }
  for (const row of deliveries) {
    if (!row.updated_at) continue;
    const title = input.titles.find((item) => item.id === row.title_id);
    rows.push({
      id: `delivery:${row.delivery_id}`,
      title: row.title,
      href: activityHref(title?.catalog_id),
      at: row.updated_at,
      count: 1,
      detail: DASHBOARD_ADMIN.deliveryUpdated,
      actorId: null,
      actor: dashboardActivityActor(null),
      kind: "delivery_updated",
    });
  }

  return rows
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, DASHBOARD_HOME_STACK);
}

export function dashboardAsOfLine(hero: DashboardRevenueHero): string {
  const asOf = `${DASHBOARD_ADMIN.asOfPrefix} ${hero.asOf}`;
  if (!hero.updated) return `${asOf} · ${DASHBOARD_ADMIN.updatedNone}`;
  return `${asOf} · ${DASHBOARD_ADMIN.updatedPrefix} ${hero.updated}`;
}

/** Tabular hero money. Null / no-statement periods are $0.00 — never an essay. */
export function dashboardHeroMoney(totalCents: number | null): string {
  return formatUsdCents(totalCents ?? 0);
}
