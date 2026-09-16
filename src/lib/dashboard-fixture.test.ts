import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DASHBOARD_CRAFT_FIXTURE_ENV,
  DASHBOARD_FIXTURE,
  DASHBOARD_FIXTURE_POINTS,
  dashboardFixtureEnabled,
  dashboardFixtureLabel,
} from "./dashboard-fixture";

describe("dashboard craft fixture", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("gates on staff/admin plus the env flag and always labels sample money", () => {
    expect(dashboardFixtureEnabled({ isGcStaff: false, isCompanyAdmin: false })).toBe(false);
    expect(dashboardFixtureEnabled({ isGcStaff: true, isCompanyAdmin: false })).toBe(false);
    expect(dashboardFixtureEnabled({ isGcStaff: false, isCompanyAdmin: true })).toBe(false);
    vi.stubEnv(DASHBOARD_CRAFT_FIXTURE_ENV, "1");
    expect(dashboardFixtureEnabled({ isGcStaff: false, isCompanyAdmin: false })).toBe(false);
    expect(dashboardFixtureEnabled({ isGcStaff: true, isCompanyAdmin: false })).toBe(true);
    expect(dashboardFixtureEnabled({ isGcStaff: false, isCompanyAdmin: true })).toBe(true);
    expect(dashboardFixtureLabel("$120,000.00")).toBe(`$120,000.00 ${DASHBOARD_FIXTURE.sampleMark}`);
    expect(DASHBOARD_FIXTURE.banner).toBe("Sample data");
    expect(DASHBOARD_FIXTURE_POINTS.length).toBeGreaterThan(1);
    expect(DASHBOARD_FIXTURE_POINTS.every((point) => point.netCents % 100 === 0)).toBe(true);
  });

  it("stays out of Reports download, ledger, and Earn money paths", () => {
    const reports = readFileSync("src/lib/reports.ts", "utf8");
    const reportsView = readFileSync("src/lib/reports-view.ts", "utf8");
    const finance = readFileSync("src/lib/finance.ts", "utf8");
    const financeDashboard = readFileSync("src/lib/finance-dashboard.ts", "utf8");
    const page = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");
    for (const src of [reports, reportsView, finance, financeDashboard]) {
      expect(src).not.toContain("dashboard-fixture");
      expect(src).not.toContain("DASHBOARD_FIXTURE");
    }
    expect(page).toContain("dashboard-fixture");
    expect(page).toContain("dashboardFixtureEnabled");
  });
});
