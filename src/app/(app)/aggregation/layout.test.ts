import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/components/aggregation/view-as-banner", () => ({
  AggregationViewAsBanner: ({ orgName }: { orgName: string }) => `BANNER:${orgName}`,
}));

import { getOrgContext } from "@/lib/supabase/context";

import AggregationLayout, { AggregationViewAsSlot } from "./layout";

describe("Aggregation layout view-as banner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the banner only while view-as is active", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      aggregationViewAs: { orgId: "org-1", orgName: "Acme Films" },
    } as never);
    const html = renderToStaticMarkup(await AggregationViewAsSlot());
    expect(html).toContain("BANNER:Acme Films");
  });

  it("does not paint a banner for a client session", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      isGcStaff: false,
      aggregationViewAs: null,
    } as never);
    const html = renderToStaticMarkup(await AggregationViewAsSlot());
    expect(html).not.toContain("BANNER:");
  });

  it("stays sync so child loading.tsx can paint", () => {
    const aggregation = readFileSync("src/app/(app)/aggregation/layout.tsx", "utf8");
    expect(aggregation).toContain("export default function AggregationLayout");
    expect(aggregation).not.toContain("export default async function AggregationLayout");
    expect(aggregation).toContain("<Suspense");
    expect(aggregation).toContain("{children}");
    const html = renderToStaticMarkup(AggregationLayout({ children: "titles" }));
    expect(html).toContain("titles");
  });

  it("stays off the Social layout", () => {
    const social = readFileSync("src/app/(app)/social/layout.tsx", "utf8");
    const aggregation = readFileSync("src/app/(app)/aggregation/layout.tsx", "utf8");
    expect(aggregation).toContain("AggregationViewAsBanner");
    expect(aggregation).toContain("aggregationViewAs");
    expect(social).not.toContain("AggregationViewAsBanner");
    expect(social).not.toContain("aggregationViewAs");
    expect(social).not.toContain("view-as");
  });
});
