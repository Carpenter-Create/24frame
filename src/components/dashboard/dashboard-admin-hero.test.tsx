import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DASHBOARD_ADMIN, parseDashboardPeriod } from "@/lib/dashboard-admin";
import { DASHBOARD_ROW_CLASS } from "@/lib/dashboard-craft";
import { DASHBOARD_FIXTURE } from "@/lib/dashboard-fixture";
import { DashboardAdminHero, DashboardRecentActivity } from "./dashboard-admin-hero";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const now = new Date("2026-09-16T12:00:00.000Z");

describe("DashboardAdminHero", () => {
  it("uses MetricCard stack and Top-works density without RL brand or export", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardAdminHero, {
        orgName: "Acme",
        period: parseDashboardPeriod("all", now),
        options: [
          { key: "all", label: "All time", group: "all" },
          { key: "ytd", label: "YTD 2026", group: "ytd" },
          { key: "2026", label: "2026", group: "year" },
          { key: "Q32026", label: "Q3 2026", group: "quarter" },
          { key: "2026-09", label: "2026-09", group: "month" },
        ],
        hero: {
          totalCents: null,
          asOf: "All time",
          updated: null,
          compare: null,
          points: [],
        },
        activity: [],
        periodMenuOpen: true,
      }),
    );
    expect(html).toContain("data-dashboard-admin-hero");
    expect(html).not.toContain("lg:grid-cols-5");
    expect(html).toContain("max-md:flex");
    expect(html).toContain("max-md:flex-col");
    expect(html).toContain("data-dashboard-mobile-stack");
    expect(html).toContain("data-dashboard-title-mobile");
    expect(html).toContain("data-dashboard-title-desktop");
    expect(html).toMatch(/data-dashboard-title-desktop=""[^>]*>Acme</);
    expect(html).not.toMatch(/data-dashboard-title-desktop=""[^>]*>All time</);
    expect(html).not.toContain("data-dashboard-period-kicker");
    expect(html).toContain(DASHBOARD_ADMIN.revenue);
    expect(html).toContain(DASHBOARD_ADMIN.activity);
    expect(html).toContain("Acme");
    expect(html).toContain("All time");
    expect(html).toContain("data-dashboard-period");
    expect(html).toContain("data-dashboard-period-menu");
    expect(html).toContain('data-dashboard-period-option="all"');
    expect(html).toContain('data-dashboard-period-option="ytd"');
    expect(html).not.toContain("data-dashboard-period-grains");
    expect(html).not.toContain("<select");
    expect(html).toContain("card-surface");
    expect(html).toContain("shadow-none");
    expect(html).toMatch(/data-dashboard-stat="revenue"[^>]*t-display t-data/);
    expect(html).toContain("$0.00");
    expect(html).not.toContain(DASHBOARD_ADMIN.revenueEmpty);
    expect(html).not.toContain("data-dashboard-fixture-banner");
    expect(html).not.toContain("Export");
    expect(html).not.toContain("Royalogic");
  });

  it("labels fixture money when craft sample is on", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardAdminHero, {
        orgName: "Acme",
        period: parseDashboardPeriod("all", now),
        options: [{ key: "all", label: "All time", group: "all" }],
        hero: {
          totalCents: 120_000_00,
          asOf: "All time",
          updated: "2026-07",
          compare: { text: "+10.0%", priorLabel: "2025-10" },
          points: [
            { key: "2026-07", label: "2026-07", year: 2026, month: 7, netCents: 120_000_00 },
          ],
        },
        activity: [],
        fixture: true,
        periodMenuOpen: true,
      }),
    );
    expect(html).toContain("data-dashboard-fixture-banner");
    expect(html).toContain(DASHBOARD_FIXTURE.banner);
    expect(html).toContain(DASHBOARD_FIXTURE.sampleMark);
    expect(html).toContain("$120,000.00");
    expect(html).toMatch(/data-dashboard-stat="revenue"[^>]*t-display t-data/);
    expect(html).toContain("text-ink-3");
    expect(html).not.toContain("text-emerald");
    expect(html).not.toContain("text-rose");
  });

  it("renders Recent account activity as dense hairline rows", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardRecentActivity, {
        items: [
          {
            id: "title:a",
            title: "Winter Light",
            href: "/titles/a",
            at: "2026-09-02T00:00:00.000Z",
            count: 3,
            detail: DASHBOARD_ADMIN.titleAdded,
          },
        ],
      }),
    );
    expect(html).toContain('data-dashboard-module="recent-activity"');
    expect(html).toContain("Winter Light");
    expect(html).toContain("data-dashboard-view-all");
    expect(html).toContain(DASHBOARD_ROW_CLASS);
    expect(html).not.toContain("$");
  });

  it("does not mount Recharts or RevenueTimeline on the admin hero", () => {
    const hero = readFileSync("src/components/dashboard/dashboard-admin-hero.tsx", "utf8");
    const chart = readFileSync("src/components/dashboard/dashboard-revenue-chart.tsx", "utf8");
    const controls = readFileSync("src/components/dashboard/dashboard-admin-controls.tsx", "utf8");
    const page = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");
    const craft = readFileSync("src/lib/dashboard-craft.ts", "utf8");
    for (const src of [hero, chart, controls, page]) {
      expect(src).not.toContain("recharts");
      expect(src).not.toContain("RevenueTimeline");
      expect(src).not.toContain("royalogic");
      expect(src).not.toMatch(/#[Ff][Ff]|orange|emerald|rose/);
    }
    expect(controls).toContain("router.replace");
    expect(chart).toContain("strokeDasharray");
    expect(hero).toContain("DASHBOARD_ADMIN_OVERVIEW_CLASS");
    expect(craft).toContain("lg:grid-cols-2");
    expect(craft).not.toContain("lg:grid-cols-5");
    expect(craft).toContain("md:flex-row");
    expect(craft).not.toContain("sm:flex-row");
    expect(page).toContain("DashboardAdminHero");
  });
});
