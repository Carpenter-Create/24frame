import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

import { parseDashboardPeriod } from "@/lib/dashboard-admin";
import {
  OVERVIEW_REVENUE_PERIOD_CLASS,
  OVERVIEW_REVENUE_PERIOD_SELECT_CLASS,
} from "@/lib/overview";
import { REPORTS_PAGE, REPORTS_PERIOD_PRESETS } from "@/lib/reports";
import { REPORTS_PERIOD_CLUSTER_CLASS } from "@/lib/reports-craft";
import { OverviewRevenuePeriodSelect } from "./overview-revenue-period";

const NOW = new Date("2026-09-18T18:00:00.000Z");
const PHONE_WIDTH_PX = 390;

function classWouldWrapAt(className: string, widthPx: number): boolean {
  const wraps = /\bflex-wrap\b/.test(className);
  const hiddenOnPhone = /(?:^|\s)hidden(?:\s|$)/.test(className) && /\bmd:flex\b/.test(className);
  const phoneOnlySelect = className === "md:hidden" || /\bmd:hidden\b/.test(className);
  if (hiddenOnPhone || phoneOnlySelect) return false;
  return wraps && widthPx < 768;
}

describe("OverviewRevenuePeriodSelect", () => {
  it("uses HousePageSelect on phone so All time · YTD · Year · Quarter · Month cannot wrap", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewRevenuePeriodSelect, {
        period: parseDashboardPeriod("all", NOW),
        now: NOW,
        defaultOpen: true,
      }),
    );
    const homeSrc = readFileSync("src/components/overview/overview-home.tsx", "utf8");
    const selectSrc = readFileSync(
      "src/components/overview/overview-revenue-period.tsx",
      "utf8",
    );

    expect(html).toContain("data-overview-revenue-period-select");
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-overview-revenue-period-trigger");
    expect(html).toContain("data-overview-revenue-period-sheet");
    expect(html).toContain(OVERVIEW_REVENUE_PERIOD_SELECT_CLASS);
    expect(html).toContain(REPORTS_PAGE.allTime);
    expect(html).toContain(REPORTS_PAGE.ytd);
    expect(html).toContain(REPORTS_PAGE.year);
    expect(html).toContain(REPORTS_PAGE.quarter);
    expect(html).toContain(REPORTS_PAGE.month);
    for (const preset of REPORTS_PERIOD_PRESETS) {
      expect(html).toContain(`data-overview-revenue-period-option=`);
      expect(html).toContain(preset.label);
    }
    expect(html).not.toContain("MTD");
    expect(html).not.toContain("<select");

    expect(OVERVIEW_REVENUE_PERIOD_CLASS).toBe("px-[var(--space-4)]");
    expect(OVERVIEW_REVENUE_PERIOD_CLASS).not.toMatch(/\bflex-wrap\b/);
    expect(OVERVIEW_REVENUE_PERIOD_SELECT_CLASS).toBe("md:hidden");
    expect(REPORTS_PERIOD_CLUSTER_CLASS).toContain("hidden");
    expect(REPORTS_PERIOD_CLUSTER_CLASS).toContain("md:flex");
    expect(REPORTS_PERIOD_CLUSTER_CLASS).not.toMatch(/\bflex-wrap\b/);

    expect(classWouldWrapAt(OVERVIEW_REVENUE_PERIOD_CLASS, PHONE_WIDTH_PX)).toBe(false);
    expect(classWouldWrapAt(OVERVIEW_REVENUE_PERIOD_SELECT_CLASS, PHONE_WIDTH_PX)).toBe(
      false,
    );
    expect(classWouldWrapAt(REPORTS_PERIOD_CLUSTER_CLASS, PHONE_WIDTH_PX)).toBe(false);
    expect(
      classWouldWrapAt("flex flex-wrap items-center gap-[var(--space-2)]", PHONE_WIDTH_PX),
    ).toBe(true);

    expect(homeSrc).toContain("OverviewRevenuePeriodSelect");
    expect(homeSrc).toContain("REPORTS_PERIOD_CLUSTER_CLASS");
    expect(homeSrc).not.toMatch(/data-overview-revenue-period=""[\s\S]*flex-wrap/);
    expect(selectSrc).toContain("HousePageSelect");
    expect(selectSrc).toContain("Dashboard All time");
    expect(selectSrc).not.toMatch(/\bflex-wrap\b/);
  });

  it("keeps the selected grain label on the quiet phone trigger", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewRevenuePeriodSelect, {
        period: parseDashboardPeriod("ytd", NOW),
        now: NOW,
      }),
    );
    expect(html).toContain("data-overview-revenue-period-current");
    expect(html).toContain(REPORTS_PAGE.ytd);
    expect(html).not.toContain("MTD");
  });
});
