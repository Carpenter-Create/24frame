import type { DashboardRevenuePoint } from "@/lib/dashboard-admin";

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
  { key: "2025-10", label: "2025-10", year: 2025, month: 10, netCents: 120_000_00 },
  { key: "2026-01", label: "2026-01", year: 2026, month: 1, netCents: 96_000_00 },
  { key: "2026-04", label: "2026-04", year: 2026, month: 4, netCents: 148_000_00 },
  { key: "2026-07", label: "2026-07", year: 2026, month: 7, netCents: 132_000_00 },
];

export function dashboardFixtureLabel(value: string): string {
  return `${value} ${DASHBOARD_FIXTURE.sampleMark}`;
}
