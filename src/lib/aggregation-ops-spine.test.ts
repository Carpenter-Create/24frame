import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { NAV } from "@/lib/nav";
import { TITLE_STATUS_LABELS } from "@/lib/titles";
import { DELIVERIES_NO_DATA } from "@/lib/deliveries-browse";
import { CATALOG_HEALTH_TITLE, FINDING_SEVERITY_LABEL } from "@/lib/findings";

const ROOT = process.cwd();

function src(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("aggregation ops spine rematch", () => {
  it("keeps Titles · Recent activity as distinct rail jobs", () => {
    expect(NAV.map((item) => item.label)).toEqual([
      "Dashboard",
      "Titles",
      "Recent activity",
      "Reports",
    ]);
    expect(NAV.map((item) => item.label)).not.toContain("Activity");
    expect(NAV.map((item) => item.label)).not.toContain("Ask 24Frame AI");
    expect(NAV.map((item) => item.href)).toEqual([
      "/aggregation/dashboard",
      "/aggregation/titles",
      "/aggregation/attention",
      "/aggregation/reports",
    ]);
    expect(NAV.map((item) => item.href)).not.toContain("/activity");
    expect(NAV.map((item) => item.href)).not.toContain("/aggregation/activity");
    expect(NAV.map((item) => item.href)).not.toContain("?ai=1");
    expect(NAV.map((item) => item.href)).not.toContain("/deliveries");
    expect(NAV.map((item) => item.href)).not.toContain("/catalog-health");
  });

  it("keeps product-true title statuses and Required / Recommended findings", () => {
    expect(Object.values(TITLE_STATUS_LABELS)).toEqual([
      "Draft",
      "Submitted",
      "In review",
      "Submitted",
      "Approved",
      "Takedown requested",
      "Taken down",
      "Archived",
    ]);
    expect(FINDING_SEVERITY_LABEL).toEqual({ high: "Required", low: "Recommended" });
    expect(CATALOG_HEALTH_TITLE).toBe("Attention");
    expect(DELIVERIES_NO_DATA.actionHref).toBe("/aggregation/titles");
  });

  it("does not invent analytics, period, or create-delivery chrome on the three ops routes", () => {
    const titles = src("src/app/(app)/aggregation/titles/page.tsx");
    const health = src("src/app/(app)/aggregation/attention/page.tsx");

    for (const page of [titles, health]) {
      expect(page).not.toMatch(/\bDownload\b/);
      expect(page).not.toMatch(/\bEarn\b/);
      expect(page).not.toMatch(/period/i);
      expect(page).not.toMatch(/chart/i);
      expect(page).not.toMatch(/revenue/i);
      expect(page).not.toContain("createDelivery");
      expect(page).not.toContain("Create delivery");
    }
    expect(titles).toContain("AddTitleButton");
    expect(health).toContain("catalogHealthTitleHref");
    expect(health).toContain("FindingRows");
    expect(health).toContain("ATTENTION_TITLE");
  });
});
