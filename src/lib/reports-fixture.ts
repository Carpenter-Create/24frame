import {
  reportsMonthKey,
  utcYearMonth,
  type ReportsCountRow,
  type ReportsUserOption,
} from "@/lib/reports";

// Craft-settlement fixture for company-admin `/reports` only.
// Labeled always. Staff/admin + env gate. Never enters download, ledger, or Earn.
// Do not import `@/lib/dashboard-fixture` from Reports money paths.

export const REPORTS_CRAFT_FIXTURE_ENV = "DASHBOARD_CRAFT_FIXTURE";

export const REPORTS_FIXTURE = {
  banner: "Sample data",
  note: "Craft preview. Not a live statement.",
  sampleMark: "(sample)",
} as const;

export type ReportsFixturePoint = {
  key: string;
  label: string;
  year: number;
  month: number;
  netCents: number;
};

export function reportsFixtureEnabled(input: {
  isGcStaff: boolean;
  isCompanyAdmin: boolean;
}): boolean {
  if (!input.isGcStaff && !input.isCompanyAdmin) return false;
  return process.env[REPORTS_CRAFT_FIXTURE_ENV] === "1";
}

export function reportsFixtureLabel(value: string): string {
  return `${value} ${REPORTS_FIXTURE.sampleMark}`;
}

/** Round demo nets — not a live GCNH total. Banner + (sample) required when used. */
export const REPORTS_FIXTURE_POINTS: ReportsFixturePoint[] = [
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

export const REPORTS_FIXTURE_PLATFORMS: ReportsCountRow[] = [
  { name: "Window A", count: 18 },
  { name: "Window B", count: 11 },
  { name: "Window C", count: 7 },
  { name: "Window D", count: 4 },
];

export const REPORTS_FIXTURE_USERS: ReportsUserOption[] = [
  { id: "fixture-user-1", label: reportsFixtureLabel("Sample user 01") },
  { id: "fixture-user-2", label: reportsFixtureLabel("Sample user 02") },
  { id: "fixture-user-3", label: reportsFixtureLabel("Sample user 03") },
];

export const REPORTS_FIXTURE_USER_ROWS: ReportsCountRow[] = [
  { name: REPORTS_FIXTURE_USERS[0].label, count: 8 },
  { name: REPORTS_FIXTURE_USERS[1].label, count: 5 },
  { name: REPORTS_FIXTURE_USERS[2].label, count: 3 },
];

const FIXTURE_TITLES = [
  { id: "fixture-title-1", title: "Sample title 01", count: 4 },
  { id: "fixture-title-2", title: "Sample title 02", count: 3 },
  { id: "fixture-title-3", title: "Sample title 03", count: 2 },
  { id: "fixture-title-4", title: "Sample title 04", count: 2 },
  { id: "fixture-title-5", title: "Sample title 05", count: 1 },
] as const;

function fixtureIso(year: number, month: number, day: number): string {
  return `${reportsMonthKey(year, month)}-${String(day).padStart(2, "0")}T12:00:00.000Z`;
}

export function reportsFixtureSources(): { year: number; month: number }[] {
  return REPORTS_FIXTURE_POINTS.map((point) => ({ year: point.year, month: point.month }));
}

export function reportsFixtureTopTitles(now: Date): {
  id: string;
  title: string;
  status: string;
  created_at: string;
  count: number;
}[] {
  const current = utcYearMonth(now);
  return FIXTURE_TITLES.map((title, index) => ({
    id: title.id,
    title: reportsFixtureLabel(title.title),
    status: "live",
    created_at: fixtureIso(current.year, current.month, 12 - index),
    count: title.count,
  }));
}

export function reportsFixtureComposition(): ReportsCountRow[] {
  return REPORTS_FIXTURE_PLATFORMS;
}

