import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { parseDashboardPeriod } from "./dashboard-admin";
import {
  DASHBOARD_CRAFT_FIXTURE_ENV,
  DASHBOARD_FIXTURE,
  DASHBOARD_FIXTURE_PLATFORMS,
  DASHBOARD_FIXTURE_POINTS,
  DASHBOARD_FIXTURE_TERRITORIES,
  dashboardFixtureActivity,
  dashboardFixtureEnabled,
  dashboardFixtureLabel,
  dashboardFixtureSources,
  dashboardFixtureTopTitles,
} from "./dashboard-fixture";

const now = new Date("2026-09-16T12:00:00.000Z");

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
    expect(DASHBOARD_FIXTURE_POINTS.length).toBeGreaterThan(12);
    expect(DASHBOARD_FIXTURE_POINTS.every((point) => point.netCents % 100 === 0)).toBe(true);
  });

  it("covers current month, quarter, year, and YTD so the hero is not empty", () => {
    const keys = DASHBOARD_FIXTURE_POINTS.map((point) => point.key);
    expect(keys).toContain("2026-09");
    expect(keys).toContain("2026-07");
    expect(keys).toContain("2026-01");
    expect(keys).toContain("2025-10");
    expect(DASHBOARD_FIXTURE_POINTS.some((point) => point.year === 2026 && point.month === 9)).toBe(
      true,
    );
    expect(dashboardFixtureSources().some((row) => row.year === 2026 && row.month === 9)).toBe(true);
  });

  it("fills platforms, territories, and in-period activity without vendor names", () => {
    expect(DASHBOARD_FIXTURE_PLATFORMS.length).toBeGreaterThan(1);
    expect(DASHBOARD_FIXTURE_TERRITORIES.length).toBeGreaterThan(1);
    expect(dashboardFixtureTopTitles(now).every((row) => row.title.includes(DASHBOARD_FIXTURE.sampleMark))).toBe(
      true,
    );
    expect(DASHBOARD_FIXTURE_PLATFORMS.every((row) => row.name.startsWith("Window"))).toBe(true);
    const all = dashboardFixtureActivity(parseDashboardPeriod("all", now), now);
    expect(all.length).toBeGreaterThan(1);
    expect(all.every((row) => row.title.includes(DASHBOARD_FIXTURE.sampleMark))).toBe(true);
    const month = dashboardFixtureActivity(parseDashboardPeriod("2026-09", now), now);
    expect(month.length).toBeGreaterThan(0);
    expect(month.every((row) => row.at.startsWith("2026-09"))).toBe(true);
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
    expect(page).toContain("DASHBOARD_FIXTURE_PLATFORMS");
    expect(page).toContain("dashboardFixtureActivity");
  });
});
