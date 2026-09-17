import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { REPORTS_HREF } from "@/lib/reports";

import { DashboardReportsCta, DashboardTopTitles } from "./dashboard-modules";

describe("dashboard visual home modules", () => {
  it("does not keep an Added-this-month / In-pipeline overview strip", () => {
    const src = readFileSync("src/components/dashboard/dashboard-modules.tsx", "utf8");
    expect(src).not.toContain("DashboardAnalyticsOverview");
    expect(src).not.toContain("addedThisMonth");
    expect(src).not.toContain("inPipeline");
    expect(src).not.toContain("data-dashboard-overview");
    expect(src).not.toContain("Added this month");
    expect(src).not.toContain("In pipeline");
  });

  it("renders a Sporty Blue Reports text CTA", () => {
    const html = renderToStaticMarkup(createElement(DashboardReportsCta));
    expect(html).toContain("data-dashboard-reports-cta");
    expect(html).toContain(DASHBOARD_HOME.reportsCta);
    expect(html).toContain(DASHBOARD_HOME.reportsPointer);
    expect(html).toContain(`href="${REPORTS_HREF}"`);
    expect(html).toContain("text-accent");
    expect(html).not.toContain("$");
  });

  it("renders Top titles as a ranked list card with View all, not a second line chart", () => {
    const html = renderToStaticMarkup(
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
      }),
    );
    expect(html).toContain('data-dashboard-module="top-titles"');
    expect(html).toContain("Winter Light");
    expect(html).toContain(DASHBOARD_HOME.viewAll);
    expect(html).toContain("bg-accent");
    expect(html).not.toContain("data-dashboard-hero");
    expect(html).not.toContain("$");
    expect(html).not.toContain("Royalogic");
  });
});
