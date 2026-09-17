import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DASHBOARD_LICENSING } from "@/lib/dashboard-licensing";
import { DashboardLicensingStatus } from "./dashboard-licensing-status";

describe("DashboardLicensingStatus", () => {
  it("renders a house-light summary bar and landscape rows", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardLicensingStatus, {
        snapshot: {
          ready: 1,
          needsAttention: 2,
          inReview: 3,
          rows: [
            {
              id: "t1",
              title: "Winter Light",
              href: "/titles/24F-0001234",
              status: "live",
              statusLabel: "Live",
              stillUrl: null,
              meta: "Keywords recommended.",
              buckets: ["ready"],
            },
          ],
        },
      }),
    );
    expect(html).toContain('data-dashboard-module="licensing-status"');
    expect(html).toContain(DASHBOARD_LICENSING.title);
    expect(html).toContain('href="/catalog-health"');
    expect(html).toContain("data-dashboard-licensing-summary");
    expect(html).toContain('data-dashboard-licensing-count="ready">1<');
    expect(html).toContain('data-dashboard-licensing-count="needsAttention">2<');
    expect(html).toContain('data-dashboard-licensing-count="inReview">3<');
    expect(html).toContain("Winter Light");
    expect(html).toContain('href="/titles/24F-0001234"');
    expect(html).toContain("data-dashboard-licensing-thumb");
    expect(html).toContain("data-dashboard-licensing-empty-art");
    expect(html).toContain("Keywords recommended.");
    expect(html).toContain("data-dashboard-licensing-pill");
    expect(html).toContain("bg-ink text-surface");
    expect(html).not.toContain("Licensed");
    expect(html).not.toContain("bg-black");
  });

  it("keeps an empty grade quiet", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardLicensingStatus, {
        snapshot: { ready: 0, needsAttention: 0, inReview: 0, rows: [] },
      }),
    );
    expect(html).toContain(DASHBOARD_LICENSING.empty);
    expect(html).toContain("data-dashboard-licensing-empty");
    expect(html).toMatch(/data-dashboard-licensing-count="ready">0</);
    expect(html).not.toContain("Sample");
  });
});
