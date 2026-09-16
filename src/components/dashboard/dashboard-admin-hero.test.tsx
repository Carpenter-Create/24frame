import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DASHBOARD_ADMIN, parseDashboardPeriod } from "@/lib/dashboard-admin";
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
        ],
        userId: null,
        users: [{ id: "maya", label: "Maya Chen" }],
        hero: {
          totalCents: null,
          asOf: "All time",
          updated: null,
          compare: null,
          points: [],
        },
        activity: [],
      }),
    );
    expect(html).toContain("data-dashboard-admin-hero");
    expect(html).toContain("lg:grid-cols-5");
    expect(html).toContain(DASHBOARD_ADMIN.revenue);
    expect(html).toContain(DASHBOARD_ADMIN.activity);
    expect(html).toContain("Acme");
    expect(html).toContain("All time");
    expect(html).not.toContain("Export");
    expect(html).not.toContain("Royalogic");
    expect(html).not.toContain("$");
  });

  it("renders recent activity as numbered rows with thin bars when counts exist", () => {
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
    expect(html).toContain("bg-accent");
    expect(html).toContain("h-1");
    expect(html).not.toContain("$");
  });

  it("does not mount Recharts or RevenueTimeline on the admin hero", () => {
    const hero = readFileSync("src/components/dashboard/dashboard-admin-hero.tsx", "utf8");
    const chart = readFileSync("src/components/dashboard/dashboard-revenue-chart.tsx", "utf8");
    const controls = readFileSync("src/components/dashboard/dashboard-admin-controls.tsx", "utf8");
    const page = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");
    for (const src of [hero, chart, controls, page]) {
      expect(src).not.toContain("recharts");
      expect(src).not.toContain("RevenueTimeline");
      expect(src).not.toContain("royalogic");
      expect(src).not.toMatch(/#[Ff][Ff]|orange|emerald|rose/);
    }
    expect(controls).toContain("router.replace");
    expect(chart).toContain("strokeDasharray");
    expect(hero).toContain("lg:grid-cols-5");
    expect(page).toContain("DashboardAdminHero");
  });
});
