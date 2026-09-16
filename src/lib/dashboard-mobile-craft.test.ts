import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  DASHBOARD_ADMIN_CHROME_CLASS,
  DASHBOARD_ADMIN_OVERVIEW_CLASS,
  DASHBOARD_ADMIN_STACK_CLASS,
  DASHBOARD_MOBILE_BREAKPOINT_CLASS,
  DASHBOARD_CARD_PAD_HERO,
  DASHBOARD_CHART_FRAME_CLASS,
  DASHBOARD_CHART_HEIGHT_DESKTOP,
  DASHBOARD_CHART_HEIGHT_MOBILE,
  DASHBOARD_DO_NEXT_SECONDARY_CLASS,
  DASHBOARD_FIXTURE_BANNER_CLASS,
  DASHBOARD_TITLE_DESKTOP_CLASS,
  DASHBOARD_TITLE_MOBILE_CLASS,
  DASHBOARD_USER_FIELD_DESKTOP_CLASS,
  DASHBOARD_USER_OVERFLOW_CLASS,
  DASHBOARD_USER_SHEET_HOST_CLASS,
} from "@/lib/dashboard-craft";

describe("company-admin Dashboard mobile craft", () => {
  it("locks phone composition to < md without reopening the desktop 3/5+2/5", () => {
    expect(DASHBOARD_MOBILE_BREAKPOINT_CLASS).toBe("max-md");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("max-md");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("grid-cols-1");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("max-md:flex-col");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).toContain("lg:grid-cols-5");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).not.toContain("md:grid-cols-5");
    expect(DASHBOARD_ADMIN_OVERVIEW_CLASS).not.toContain("sm:grid-cols-5");
    expect(DASHBOARD_ADMIN_CHROME_CLASS).toContain("md:flex-row");
    expect(DASHBOARD_ADMIN_CHROME_CLASS).not.toContain("sm:flex-row");
    expect(DASHBOARD_TITLE_MOBILE_CLASS).toBe("md:hidden");
    expect(DASHBOARD_TITLE_DESKTOP_CLASS).toBe("max-md:hidden");
    expect(DASHBOARD_CARD_PAD_HERO).toContain("max-md:px-[var(--space-4)]");
    expect(DASHBOARD_ADMIN_STACK_CLASS).toContain("gap-[var(--space-6)]");
    expect(DASHBOARD_ADMIN_STACK_CLASS).toContain("md:gap-[var(--space-12)]");
    expect(DASHBOARD_DO_NEXT_SECONDARY_CLASS).toContain("max-md:");
  });

  it("keeps the scrub in the 160–200px band and full width on phone", () => {
    expect(DASHBOARD_CHART_HEIGHT_MOBILE).toBeGreaterThanOrEqual(160);
    expect(DASHBOARD_CHART_HEIGHT_MOBILE).toBeLessThanOrEqual(200);
    expect(DASHBOARD_CHART_HEIGHT_DESKTOP).toBe(200);
    expect(DASHBOARD_CHART_FRAME_CLASS).toContain("w-full");
    expect(DASHBOARD_CHART_FRAME_CLASS).toContain("h-[176px]");
    expect(DASHBOARD_CHART_FRAME_CLASS).toContain("md:h-[200px]");
  });

  it("hides type-to-find behind overflow/sheet on phone", () => {
    expect(DASHBOARD_USER_FIELD_DESKTOP_CLASS).toContain("max-md:hidden");
    expect(DASHBOARD_USER_OVERFLOW_CLASS).toContain("md:hidden");
    expect(DASHBOARD_USER_OVERFLOW_CLASS).toContain("size-[44px]");
    expect(DASHBOARD_USER_SHEET_HOST_CLASS).toContain("md:hidden");
  });

  it("keeps Sample banner + populated fixture rules and kills RL / export / chips", () => {
    const hero = readFileSync("src/components/dashboard/dashboard-admin-hero.tsx", "utf8");
    const controls = readFileSync("src/components/dashboard/dashboard-admin-controls.tsx", "utf8");
    const page = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");
    const chart = readFileSync("src/components/dashboard/dashboard-revenue-chart.tsx", "utf8");
    expect(DASHBOARD_FIXTURE_BANNER_CLASS).toContain("max-md:sticky");
    expect(hero).toContain("data-dashboard-fixture-banner");
    expect(page).toContain("dashboardFixtureActivity");
    expect(page).toContain("DASHBOARD_FIXTURE_PLATFORMS");
    for (const src of [hero, controls, page, chart]) {
      expect(src).not.toContain("data-dashboard-period-grains");
      expect(src).not.toContain("data-reports-download");
      expect(src).not.toContain("Export CSV");
      expect(src).not.toContain("recharts");
      expect(src).not.toContain("royalogic");
      expect(src).not.toMatch(/#[Ff][Ff]|orange|emerald|rose/);
    }
  });
});
