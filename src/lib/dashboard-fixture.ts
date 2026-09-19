import {
  DASHBOARD_ADMIN,
  dashboardMonthKey,
  isoInDashboardPeriod,
  utcYearMonth,
  type DashboardActivityRow,
  type DashboardPeriod,
  type DashboardRevenuePoint,
} from "@/lib/dashboard-admin";
import type { DashboardRankedTitle } from "@/lib/dashboard-home";
import type { ReportsCountRow } from "@/lib/reports";
import { TITLES_HREF } from "@/lib/title-public-id";

// Craft-settlement fixture for company-admin `/dashboard` only.
// Labeled always. Staff/admin + env gate. Strip after Mac PASS.
// Hard kill: do not import this from reports, export, ledger, or Earn.

export const DASHBOARD_CRAFT_FIXTURE_ENV = "DASHBOARD_CRAFT_FIXTURE";

export const DASHBOARD_FIXTURE = {
  banner: "Sample data",
  note: "Craft preview. Not a live statement.",
  sampleMark: "(sample)",
} as const;

export function dashboardFixtureEnabled(input: {
  isGcStaff: boolean;
  isCompanyAdmin: boolean;
}): boolean {
  if (!input.isGcStaff && !input.isCompanyAdmin) return false;
  return process.env[DASHBOARD_CRAFT_FIXTURE_ENV] === "1";
}

/** Round demo nets — not a live GCNH total. Banner + (sample) required when used. */
export const DASHBOARD_FIXTURE_POINTS: DashboardRevenuePoint[] = [
  { key: "2025-04", label: "2025-04", year: 2025, month: 4, netCents: 82_000_00 },
  { key: "2025-05", label: "2025-05", year: 2025, month: 5, netCents: 90_000_00 },
  { key: "2025-06", label: "2025-06", year: 2025, month: 6, netCents: 104_000_00 },
  { key: "2025-07", label: "2025-07", year: 2025, month: 7, netCents: 98_000_00 },
  { key: "2025-08", label: "2025-08", year: 2025, month: 8, netCents: 110_000_00 },
  { key: "2025-09", label: "2025-09", year: 2025, month: 9, netCents: 116_000_00 },
  { key: "2025-10", label: "2025-10", year: 2025, month: 10, netCents: 120_000_00 },
  { key: "2025-11", label: "2025-11", year: 2025, month: 11, netCents: 108_000_00 },
  { key: "2025-12", label: "2025-12", year: 2025, month: 12, netCents: 126_000_00 },
  { key: "2026-01", label: "2026-01", year: 2026, month: 1, netCents: 96_000_00 },
  { key: "2026-02", label: "2026-02", year: 2026, month: 2, netCents: 102_000_00 },
  { key: "2026-03", label: "2026-03", year: 2026, month: 3, netCents: 118_000_00 },
  { key: "2026-04", label: "2026-04", year: 2026, month: 4, netCents: 148_000_00 },
  { key: "2026-05", label: "2026-05", year: 2026, month: 5, netCents: 136_000_00 },
  { key: "2026-06", label: "2026-06", year: 2026, month: 6, netCents: 124_000_00 },
  { key: "2026-07", label: "2026-07", year: 2026, month: 7, netCents: 132_000_00 },
  { key: "2026-08", label: "2026-08", year: 2026, month: 8, netCents: 140_000_00 },
  { key: "2026-09", label: "2026-09", year: 2026, month: 9, netCents: 154_000_00 },
];

// Window labels only — never a vendor, partner, or platform name.
export const DASHBOARD_FIXTURE_PLATFORMS: ReportsCountRow[] = [
  { name: "Window A", count: 18 },
  { name: "Window B", count: 11 },
  { name: "Window C", count: 7 },
  { name: "Window D", count: 4 },
];

export const DASHBOARD_FIXTURE_TERRITORIES: ReportsCountRow[] = [
  { name: "United States", count: 14 },
  { name: "United Kingdom", count: 9 },
  { name: "Canada", count: 6 },
  { name: "Germany", count: 4 },
  { name: "Australia", count: 3 },
];

const FIXTURE_TITLES = [
  {
    id: "fixture-title-1",
    title: "Sample title 01",
    count: 4,
    detail: DASHBOARD_ADMIN.titleAdded,
    kind: "title_added" as const,
  },
  {
    id: "fixture-title-2",
    title: "Sample title 02",
    count: 2,
    detail: DASHBOARD_ADMIN.deliveryUpdated,
    kind: "delivery_updated" as const,
  },
  {
    id: "fixture-title-3",
    title: "Sample title 03",
    count: 3,
    detail: DASHBOARD_ADMIN.titleAdded,
    kind: "title_added" as const,
  },
  {
    id: "fixture-title-4",
    title: "Sample title 04",
    count: 1,
    detail: DASHBOARD_ADMIN.titleAdded,
    kind: "title_added" as const,
  },
  {
    id: "fixture-title-5",
    title: "Sample title 05",
    count: 2,
    detail: DASHBOARD_ADMIN.deliveryUpdated,
    kind: "delivery_updated" as const,
  },
] as const;

export function dashboardFixtureLabel(value: string): string {
  return `${value} ${DASHBOARD_FIXTURE.sampleMark}`;
}

function fixtureIso(year: number, month: number, day: number): string {
  return `${dashboardMonthKey(year, month)}-${String(day).padStart(2, "0")}T12:00:00.000Z`;
}

export function dashboardFixtureActivity(
  period: DashboardPeriod,
  now: Date,
): DashboardActivityRow[] {
  const current = utcYearMonth(now);
  const stamps = [
    fixtureIso(current.year, current.month, 12),
    fixtureIso(current.year, current.month, 6),
    fixtureIso(current.year, Math.max(1, current.month - 1), 18),
    fixtureIso(2026, 4, 9),
    fixtureIso(2025, 10, 14),
  ];
  return FIXTURE_TITLES.flatMap((title, index) => {
    const at = stamps[index];
    if (!at || !isoInDashboardPeriod(at, period)) return [];
    return [
      {
        id: title.id,
        title: dashboardFixtureLabel(title.title),
        href: TITLES_HREF,
        at,
        count: title.count,
        detail: title.detail,
        actorId: null,
        actor: { id: null, initial: "?" },
        kind: title.kind,
      },
    ];
  });
}

export function dashboardFixtureSources(): { year: number; month: number }[] {
  return DASHBOARD_FIXTURE_POINTS.map((point) => ({ year: point.year, month: point.month }));
}

export function dashboardFixtureTopTitles(now: Date): DashboardRankedTitle[] {
  const current = utcYearMonth(now);
  return FIXTURE_TITLES.map((title, index) => ({
    id: title.id,
    title: dashboardFixtureLabel(title.title),
    status: "live",
    created_at: fixtureIso(current.year, current.month, 12 - index),
    count: title.count,
  }));
}
