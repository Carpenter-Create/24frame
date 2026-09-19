import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DASHBOARD_ATTENTION } from "@/lib/dashboard-attention";
import { dashboardJustInDate, dashboardJustInTime } from "@/lib/dashboard-home";
import { DashboardAttention } from "./dashboard-attention";

describe("DashboardAttention", () => {
  it("renders dated finding rows with house body clocks", () => {
    const at = "2026-09-12T15:04:00.000Z";
    const html = renderToStaticMarkup(
      createElement(DashboardAttention, {
        snapshot: {
          rows: [
            {
              id: "f1",
              what: "Synopsis is required.",
              at,
              href: "/titles/24F-0001234",
              kind: "catalog",
            },
          ],
        },
      }),
    );
    expect(html).toContain('data-dashboard-module="attention"');
    expect(html).toContain(DASHBOARD_ATTENTION.title);
    expect(html).toContain('href="/aggregation/attention"');
    expect(html).toContain("Synopsis is required.");
    expect(html).toContain("data-dashboard-attention-what");
    expect(html).toContain("data-dashboard-attention-time");
    expect(html).toContain("data-dashboard-attention-clock");
    expect(html).toContain(dashboardJustInDate(at));
    expect(html).toContain(dashboardJustInTime(at));
    expect(html).toContain("t-body-sm text-ink-3");
    expect(html).not.toContain("t-label");
    expect(html).not.toContain("t-display");
    expect(html).not.toContain("Ready");
    expect(html).not.toContain("Needs attention");
  });

  it("keeps empty clean", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardAttention, { snapshot: { rows: [] } }),
    );
    expect(html).toContain(DASHBOARD_ATTENTION.empty);
    expect(html).toContain("data-dashboard-attention-empty");
    expect(html).not.toContain("data-dashboard-attention-row");
  });
});
