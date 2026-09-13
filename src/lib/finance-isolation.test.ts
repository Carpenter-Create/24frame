import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  assertOrgTitleIsolation,
  resolveMappedTitleId,
  staffCanWriteFinance,
} from "./finance";
import { GC_NAV, NAV, SOCIAL_NAV } from "./nav";

const migration = readFileSync(
  "supabase/migrations/20260913130000_finance_ops_slice_1.sql",
  "utf8",
);
const compute = readFileSync("src/lib/finance-compute.ts", "utf8");

describe("title isolation", () => {
  it("refuses to attach a Client B title to a Client A import", () => {
    expect(() => assertOrgTitleIsolation("org-a", "org-b")).toThrow(
      "Client A title never receives Client B import",
    );
    expect(assertOrgTitleIsolation("org-a", "org-a")).toBeUndefined();
  });

  it("resolves a mapping only when line, mapping, and title share an org", () => {
    expect(
      resolveMappedTitleId({
        lineOrgId: "org-a",
        mappingOrgId: "org-b",
        titleOrgId: "org-b",
        titleId: "title-b",
      }),
    ).toBeNull();
    expect(
      resolveMappedTitleId({
        lineOrgId: "org-a",
        mappingOrgId: "org-a",
        titleOrgId: "org-b",
        titleId: "title-b",
      }),
    ).toBeNull();
    expect(
      resolveMappedTitleId({
        lineOrgId: "org-a",
        mappingOrgId: "org-a",
        titleOrgId: "org-a",
        titleId: "title-a",
      }),
    ).toBe("title-a");
  });
});

describe("mapping C — finance stays Aggregation", () => {
  it("does not put Finance on client NAV or Social", () => {
    expect(NAV.map((item) => item.href)).not.toContain("/gc/finance");
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain("/gc/finance");
    expect(GC_NAV.map((item) => item.href)).toContain("/gc/finance");
  });

  it("keeps finance tables on org_id and off profiles", () => {
    expect(migration).toContain("org_id");
    expect(migration).not.toMatch(/\bprofile_id\s+uuid\b/);
    expect(migration).toContain("mapping C");
    expect(migration).toContain("must not have profile_id");
  });

  it("stubs home glance for staff only and keeps Finance off client NAV", () => {
    const home = readFileSync("src/app/(app)/page.tsx", "utf8");
    expect(home).toContain("DashboardFinanceGlance");
    expect(home).toContain("ctx.isGcStaff ? <DashboardFinanceGlance");
    expect(home).not.toContain("Statements");
  });

  it("uses the complementary client-tier split and does not invent a second fee field", () => {
    expect(compute).toContain("clientShareCents");
    expect(compute).toContain("aggregatorKeepCents");
    expect(compute).toContain("supersedes A/B/C/D");
    expect(compute).not.toContain("aggregator_rate");
    expect(compute).not.toContain("tier_revenue_share");
    expect(compute).not.toContain("client_tier_percent");
    expect(migration).toContain("revenue_share_rate_bp");
    expect(migration).toContain("must not invent a second fee field");
    expect(migration).toContain("supersedes A/B/C/D");
    expect(migration).toContain("bank_receipt_cents");
    expect(migration).toContain("reported_cents");
    expect(migration).toMatch(/raw\s+jsonb/);
    expect(migration).not.toMatch(/\baggregator_rate\s+\w+/);
    expect(staffCanWriteFinance("gc_delivery_ops")).toBe(false);
    expect(staffCanWriteFinance("gc_legal")).toBe(false);
    expect(staffCanWriteFinance("gc_accountant")).toBe(true);
  });

  it("keeps endpoint-sourced input on sales_imports and sales_lines", () => {
    expect(migration).toContain("filename");
    expect(migration).toContain("content_hash");
    expect(migration).toContain("endpoint");
    expect(migration).toContain("external_id");
    expect(migration).toContain("do not collapse imports into ledger-only rows");
  });
});
