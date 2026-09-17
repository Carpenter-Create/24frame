import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DashboardRankedBars, DashboardTopTitles } from "@/components/dashboard/dashboard-ranked";
import { DashboardViewAll, DashboardViewAlts } from "@/components/dashboard/dashboard-view-alts";
import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import {
  dashboardChoroplethFill,
  dashboardModuleMetaLine,
  dashboardShareLabel,
  dashboardTerritoryCountLabel,
  rankedRowsFromCounts,
  resolveTerritoryRef,
} from "@/lib/dashboard-register";
import { isoAlpha2FromNumeric, isoNumericForAlpha2 } from "@/lib/iso3166-numeric";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe("dashboard register helpers", () => {
  it("resolves territory codes and names without inventing unofficial codes", () => {
    expect(resolveTerritoryRef("US")).toEqual({ code: "US", name: "United States" });
    expect(resolveTerritoryRef("United States")).toEqual({ code: "US", name: "United States" });
    expect(isoNumericForAlpha2("US")).toBe(840);
    expect(isoAlpha2FromNumeric(840)).toBe("US");
    expect(isoAlpha2FromNumeric("826")).toBe("GB");
    const rows = rankedRowsFromCounts(
      [
        { name: "US", count: 14 },
        { name: "United Kingdom", count: 6 },
      ],
      true,
    );
    expect(rows[0]).toMatchObject({ code: "US", label: "United States", numeric: 840 });
    expect(dashboardShareLabel(14, 20)).toBe("70%");
    expect(dashboardTerritoryCountLabel(1)).toBe("1 territory");
    expect(dashboardTerritoryCountLabel(5)).toBe("5 territories");
    expect(dashboardModuleMetaLine({ period: "All time", updated: "2026-07" })).toBe(
      "All time · Updated 2026-07",
    );
  });

  it("fills the choropleth from Sporty Blue wash — never amber or green", () => {
    expect(dashboardChoroplethFill(0)).toBe("var(--surface-muted)");
    expect(dashboardChoroplethFill(1)).toContain("var(--accent)");
    expect(dashboardChoroplethFill(0.5)).not.toMatch(/amber|orange|#[Ff][Ff]|emerald|green|#1769FF/);
  });
});

describe("dashboard register chrome", () => {
  it("renders the view-alt cluster and View all arrow in Sporty Blue", () => {
    const alts = renderToStaticMarkup(
      createElement(DashboardViewAlts, {
        modes: ["map", "list", "bars"],
        mode: "map",
        onChange: () => undefined,
      }),
    );
    const viewAll = renderToStaticMarkup(createElement(DashboardViewAll, { href: "/titles" }));
    expect(alts).toContain("data-dashboard-view-alts");
    expect(alts).toContain('data-dashboard-view-alt="map"');
    expect(alts).toContain('data-dashboard-view-alt="list"');
    expect(alts).toContain('data-dashboard-view-alt="bars"');
    expect(alts).toContain("border-hairline");
    expect(alts).toContain("bg-surface-muted");
    expect(alts).toContain("text-accent");
    expect(viewAll).toContain("data-dashboard-view-all");
    expect(viewAll).toContain("data-dashboard-view-all-arrow");
    expect(viewAll).toContain(DASHBOARD_HOME.viewAll);
    expect(viewAll).toContain("text-accent");
    expect(viewAll).not.toContain("text-amber");
    expect(alts).not.toContain("Top works");
  });

  it("gives Top titles list/bars and Territories map/list/bars — 24Frame nouns only", () => {
    const titles = renderToStaticMarkup(
      createElement(DashboardTopTitles, {
        items: [
          {
            id: "t1",
            title: "Winter Light",
            status: "live",
            created_at: "2026-09-02T00:00:00.000Z",
            count: 3,
          },
        ],
        periodLabel: "All time",
      }),
    );
    const territories = renderToStaticMarkup(
      createElement(DashboardRankedBars, {
        label: DASHBOARD_HOME.territories,
        empty: DASHBOARD_HOME.territoriesEmpty,
        rows: [{ name: "US", count: 4 }],
        testId: "territories",
        viewAllHref: "/deliveries",
        territory: true,
        periodLabel: "All time",
      }),
    );
    const platforms = renderToStaticMarkup(
      createElement(DashboardRankedBars, {
        label: DASHBOARD_HOME.platforms,
        empty: DASHBOARD_HOME.platformsEmpty,
        rows: [{ name: "Window A", count: 4 }],
        testId: "platforms",
        viewAllHref: "/deliveries",
      }),
    );
    expect(titles).toContain(DASHBOARD_HOME.topTitles);
    expect(titles).toContain('data-dashboard-view-alt="list"');
    expect(titles).toContain('data-dashboard-view-alt="bars"');
    expect(titles).not.toContain('data-dashboard-view-alt="map"');
    expect(titles).toContain("data-dashboard-view-all-arrow");
    expect(titles).not.toContain("Top works");
    expect(territories).toContain(DASHBOARD_HOME.territories);
    expect(territories).toContain('data-dashboard-view-alt="map"');
    expect(territories).toContain("data-dashboard-territory-map");
    expect(territories).toContain(DASHBOARD_HOME.legendLow);
    expect(territories).toContain(DASHBOARD_HOME.legendHigh);
    expect(platforms).toContain(DASHBOARD_HOME.platforms);
    expect(platforms).toContain('data-dashboard-view-alt="list"');
    expect(platforms).toContain('data-dashboard-view-alt="bars"');
    expect(platforms).not.toContain('data-dashboard-view-alt="map"');
    expect(platforms).not.toContain("contributors");
    expect(`${titles}${territories}${platforms}`).not.toContain("Exports");
  });
});
