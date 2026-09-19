import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { WORKSPACE_AGGREGATION_LABEL } from "@/lib/product";

import { AGGREGATION_LEAD_TITLE } from "./aggregation-lead-title";

describe("Aggregation lead title", () => {
  it("locks the dashboard H1 to Aggregation, not the org legal name", () => {
    expect(AGGREGATION_LEAD_TITLE).toBe("Aggregation");
    expect(AGGREGATION_LEAD_TITLE).toBe(WORKSPACE_AGGREGATION_LABEL);

    const hero = readFileSync("src/components/dashboard/dashboard-admin-hero.tsx", "utf8");
    const identity = readFileSync("src/components/dashboard/dashboard-home.tsx", "utf8");
    const page = readFileSync("src/app/(app)/aggregation/dashboard/page.tsx", "utf8");

    expect(hero).toContain("AGGREGATION_LEAD_TITLE");
    expect(hero).not.toMatch(/data-dashboard-title-mobile=""[\s\S]*\{orgName\}/);
    expect(hero).not.toMatch(/data-dashboard-title-desktop=""[\s\S]*\{orgName\}/);
    expect(identity).toContain("AGGREGATION_LEAD_TITLE");
    expect(identity).not.toMatch(/<h1 className="t-title text-ink">\{name\}<\/h1>/);
    expect(page).not.toContain("orgName={org.name}");
    expect(page).not.toContain("<DashboardOrgIdentity name=");
  });
});
