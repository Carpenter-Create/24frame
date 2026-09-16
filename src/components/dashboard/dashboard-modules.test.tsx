import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { REPORTS_HREF } from "@/lib/reports";

import { DashboardAnalyticsOverview, DashboardReportsCta } from "./dashboard-modules";

describe("dashboard visual home modules", () => {
  it("links the quiet overview strip to Reports without a period picker", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardAnalyticsOverview, { addedThisMonth: 2, inPipeline: 1 }),
    );
    expect(html).toContain("data-dashboard-overview");
    expect(html).toContain(DASHBOARD_HOME.addedThisMonth);
    expect(html).toContain(DASHBOARD_HOME.inPipeline);
    expect(html).toContain(`href="${REPORTS_HREF}?period=this-month"`);
    expect(html).not.toContain("data-reports-period");
    expect(html).not.toContain("Download");
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
});
