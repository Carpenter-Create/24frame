import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { parseReportsPeriod } from "./reports";
import {
  REPORTS_CRAFT_FIXTURE_ENV,
  REPORTS_FIXTURE,
  REPORTS_FIXTURE_PLATFORMS,
  REPORTS_FIXTURE_POINTS,
  REPORTS_FIXTURE_USER_ROWS,
  reportsFixtureEnabled,
  reportsFixtureLabel,
  reportsFixtureSources,
  reportsFixtureTopTitles,
} from "./reports-fixture";

const now = new Date("2026-09-16T12:00:00.000Z");

describe("reports craft fixture", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("gates on staff/admin plus the env flag and always labels sample money", () => {
    expect(reportsFixtureEnabled({ isGcStaff: false, isCompanyAdmin: false })).toBe(false);
    expect(reportsFixtureEnabled({ isGcStaff: true, isCompanyAdmin: false })).toBe(false);
    expect(reportsFixtureEnabled({ isGcStaff: false, isCompanyAdmin: true })).toBe(false);
    vi.stubEnv(REPORTS_CRAFT_FIXTURE_ENV, "1");
    expect(reportsFixtureEnabled({ isGcStaff: false, isCompanyAdmin: false })).toBe(false);
    expect(reportsFixtureEnabled({ isGcStaff: true, isCompanyAdmin: false })).toBe(true);
    expect(reportsFixtureEnabled({ isGcStaff: false, isCompanyAdmin: true })).toBe(true);
    expect(reportsFixtureLabel("$120,000.00")).toBe(`$120,000.00 ${REPORTS_FIXTURE.sampleMark}`);
    expect(REPORTS_FIXTURE.banner).toBe("Sample data");
    expect(REPORTS_FIXTURE_POINTS.every((point) => point.netCents % 100 === 0)).toBe(true);
  });

  it("covers current month, quarter, year, and YTD so the hero is not empty", () => {
    const keys = REPORTS_FIXTURE_POINTS.map((point) => point.key);
    expect(keys).toContain("2026-09");
    expect(keys).toContain("2026-07");
    expect(keys).toContain("2026-01");
    expect(reportsFixtureSources().some((row) => row.year === 2026 && row.month === 9)).toBe(true);
    expect(parseReportsPeriod("2026-09", now).key).toBe("2026-09");
  });

  it("fills platforms and users without vendor names and stays out of download", () => {
    expect(REPORTS_FIXTURE_PLATFORMS.every((row) => row.name.startsWith("Window"))).toBe(true);
    expect(REPORTS_FIXTURE_USER_ROWS.every((row) => row.name.includes(REPORTS_FIXTURE.sampleMark))).toBe(
      true,
    );
    expect(
      reportsFixtureTopTitles(now).every((row) => row.title.includes(REPORTS_FIXTURE.sampleMark)),
    ).toBe(true);
    const reports = readFileSync("src/lib/reports.ts", "utf8");
    const download = readFileSync("src/lib/reports.ts", "utf8");
    expect(reports).not.toContain("reports-fixture");
    expect(download).not.toContain("REPORTS_FIXTURE_POINTS");
    expect(readFileSync("src/app/(app)/aggregation/reports/page.tsx", "utf8")).toContain("reports-fixture");
    expect(readFileSync("src/app/(app)/aggregation/reports/page.tsx", "utf8")).not.toContain("dashboard-fixture");
  });
});
