import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT_HREF } from "./finance";
import {
  REPORTS_HREF,
  REPORTS_PAGE,
  availableReportMonths,
  countNamedRows,
  isoInReportsPeriod,
  isLegacyReportsPath,
  parseReportsPeriod,
  parseReportsUserId,
  reportsDownloadHref,
  reportsHref,
  reportsPeriodIsConcrete,
  reportsUserLabel,
  yearMonthFromIso,
} from "./reports";

describe("reports period and scope", () => {
  const now = new Date("2026-09-16T12:00:00.000Z");

  it("defaults to all time and keeps this-month plus YYYY-MM concrete", () => {
    expect(parseReportsPeriod(undefined, now)).toEqual({ kind: "all", key: "all" });
    expect(parseReportsPeriod("all", now)).toEqual({ kind: "all", key: "all" });
    expect(parseReportsPeriod(["this-month"], now)).toEqual({ kind: "all", key: "all" });
    expect(parseReportsPeriod("this-month", now)).toEqual({
      kind: "this-month",
      key: "this-month",
      year: 2026,
      month: 9,
    });
    expect(parseReportsPeriod("2026-08", now)).toEqual({
      kind: "month",
      key: "2026-08",
      year: 2026,
      month: 8,
    });
    expect(parseReportsPeriod("nope", now)).toEqual({ kind: "all", key: "all" });
    expect(reportsPeriodIsConcrete(parseReportsPeriod("all", now))).toBe(false);
    expect(reportsPeriodIsConcrete(parseReportsPeriod("this-month", now))).toBe(true);
    expect(reportsPeriodIsConcrete(parseReportsPeriod("2026-08", now))).toBe(true);
  });

  it("filters ISO timestamps in UTC and lists available months newest first", () => {
    const august = parseReportsPeriod("2026-08", now);
    expect(isoInReportsPeriod("2026-08-02T00:00:00.000Z", august)).toBe(true);
    expect(isoInReportsPeriod("2026-09-01T00:00:00.000Z", august)).toBe(false);
    expect(isoInReportsPeriod("2026-08-02T00:00:00.000Z", parseReportsPeriod("all", now))).toBe(
      true,
    );
    expect(yearMonthFromIso("2026-08-15T00:00:00.000Z")).toEqual({ year: 2026, month: 8 });
    expect(availableReportMonths([{ year: 2026, month: 8 }, { year: 2026, month: 8 }, { year: 2026, month: 9 }])).toEqual(
      [
        { year: 2026, month: 9, key: "2026-09", label: "2026-09" },
        { year: 2026, month: 8, key: "2026-08", label: "2026-08" },
      ],
    );
  });

  it("gates download on a closed matching period and keeps the existing export href", () => {
    const periods = [
      { id: "p-closed", period_year: 2026, period_month: 8, status: "closed" },
      { id: "p-open", period_year: 2026, period_month: 9, status: "open" },
    ];
    expect(reportsDownloadHref({ period: parseReportsPeriod("all", now), periods })).toBeNull();
    expect(reportsDownloadHref({ period: parseReportsPeriod("this-month", now), periods })).toBeNull();
    expect(reportsDownloadHref({ period: parseReportsPeriod("2026-08", now), periods })).toBe(
      `${FINANCE_CLIENT_HREF}/p-closed/export?format=pdf`,
    );
  });

  it("keeps user scope single-select and does not invent labels", () => {
    expect(parseReportsUserId(undefined)).toBeNull();
    expect(parseReportsUserId("all")).toBeNull();
    expect(parseReportsUserId("user-1")).toBe("user-1");
    expect(reportsUserLabel({ displayName: "  Maya  ", handle: "maya" })).toBe("Maya");
    expect(reportsUserLabel({ displayName: "", handle: "maya" })).toBe("maya");
    expect(reportsUserLabel({ displayName: null, handle: null })).toBeNull();
    expect(reportsHref({ period: "all" })).toBe(REPORTS_HREF);
    expect(reportsHref({ period: "this-month", user: "user-1" })).toBe(
      `${REPORTS_HREF}?period=this-month&user=user-1`,
    );
  });

  it("counts real names only and never ranks", () => {
    expect(
      countNamedRows([{ name: "US" }, { name: " US " }, { name: "CA" }, { name: "" }]),
    ).toEqual([
      { name: "US", count: 2 },
      { name: "CA", count: 1 },
    ]);
    expect(REPORTS_PAGE.title).toBe("Reports");
    expect(REPORTS_PAGE.empty).toBe("No report data for this period yet.");
    expect(isLegacyReportsPath("/analytics")).toBe(true);
    expect(isLegacyReportsPath("/earn/p1")).toBe(true);
    expect(isLegacyReportsPath("/finance")).toBe(true);
    expect(isLegacyReportsPath("/gc/finance")).toBe(false);
    expect(isLegacyReportsPath("/reports")).toBe(false);
  });
});
