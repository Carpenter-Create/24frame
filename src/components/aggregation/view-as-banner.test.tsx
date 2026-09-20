import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(app)/aggregation/view-as-actions", () => ({
  stopAggregationViewAs: vi.fn(),
}));

import { AGGREGATION_VIEW_AS } from "@/lib/aggregation-impersonation";

import { AggregationViewAsBanner } from "./view-as-banner";

describe("AggregationViewAsBanner", () => {
  it("names the rights holder and offers Exit", () => {
    const html = renderToStaticMarkup(<AggregationViewAsBanner orgName="Acme Films" />);
    expect(html).toContain("data-aggregation-view-as");
    expect(html).toContain('role="status"');
    expect(html).toContain(AGGREGATION_VIEW_AS.banner("Acme Films"));
    expect(html).toContain(AGGREGATION_VIEW_AS.exit);
    expect(html).toContain("<form");
    expect(html).not.toContain("Staff");
    expect(html).not.toContain("Queue");
    expect(html).not.toContain("/social");
  });

  it("exits through the staff-gated stop action", () => {
    const src = readFileSync("src/components/aggregation/view-as-banner.tsx", "utf8");
    expect(src).toContain("stopAggregationViewAs");
    expect(src).toContain('type="submit"');
    expect(src).not.toContain("startAggregationViewAs");
  });
});
