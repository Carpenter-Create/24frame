import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  FINANCE_CLIENT_HREF,
  FINANCE_WRITE_RPCS,
  assertOrgTitleIsolation,
  assertRecipientOrgIsolation,
  orgRoleCanViewFinancial,
  recipientCanWriteFinance,
  recipientMayExportPeriod,
  resolveMappedTitleId,
  staffCanWriteFinance,
} from "./finance";
import { GC_NAV, NAV, SOCIAL_NAV } from "./nav";

const migration = readFileSync(
  "supabase/migrations/20260913130000_finance_ops_slice_1.sql",
  "utf8",
);
const suspenseMigration = readFileSync(
  "supabase/migrations/20260913220000_finance_ops_slice_2_suspense.sql",
  "utf8",
);
const awsMigration = readFileSync(
  "supabase/migrations/20260913230000_finance_ops_slice_2_aws_spine.sql",
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
  it("puts recipient Reports on client Aggregation NAV and keeps ops on GC_NAV", () => {
    expect(NAV.map((item) => item.href)).toContain("/aggregation/reports");
    expect(NAV.map((item) => item.href)).not.toContain("/earn");
    expect(NAV.map((item) => item.href)).not.toContain("/finance");
    expect(NAV.map((item) => item.href)).not.toContain("/gc/finance");
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain("/reports");
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain("/earn");
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain("/finance");
    expect(SOCIAL_NAV.map((item) => item.href)).not.toContain("/gc/finance");
    expect(GC_NAV.map((item) => item.href)).toContain("/aggregation/gc/finance");
    expect(GC_NAV.map((item) => item.href)).not.toContain("/reports");
    expect(GC_NAV.map((item) => item.href)).not.toContain("/earn");
    expect(GC_NAV.map((item) => item.href)).not.toContain("/finance");
    expect(GC_NAV.map((item) => item.label)).not.toContain("Earn");
    expect(NAV.map((item) => item.label)).not.toContain("Earn");
    expect(NAV.map((item) => item.label)).not.toContain("Analytics");
  });

  it("keeps finance tables on org_id and off profiles", () => {
    expect(migration).toContain("org_id");
    expect(migration).not.toMatch(/\bprofile_id\s+uuid\b/);
    expect(migration).toContain("mapping C");
    expect(migration).toContain("must not have profile_id");
  });

  it("replaces the client Earn glance with a Reports pointer and keeps the staff stub off that purse", () => {
    const home = readFileSync("src/app/(app)/aggregation/dashboard/page.tsx", "utf8");
    expect(home).toContain("DashboardFinanceGlance");
    expect(home).toContain("DashboardReportsCta");
    expect(home).not.toContain("DashboardClientFinanceGlance");
    expect(home).not.toContain("canSeeClientFinanceGlance");
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

  it("builds ops and recipient math from one statement assembler", () => {
    const statement = readFileSync("src/lib/finance-statement.ts", "utf8");
    const page = readFileSync("src/app/(app)/(operator)/aggregation/gc/finance/[periodId]/page.tsx", "utf8");
    expect(statement).toContain("assemblePeriodStatement");
    expect(statement).toContain("STATEMENT_TRANSPARENCY_LINES");
    expect(statement).toContain("postedOnly");
    expect(page).toContain("assemblePeriodStatement");
    expect(page).toContain("postedOnly: true");
    expect(page).not.toContain("Statements");
    expect(NAV.map((item) => item.label)).not.toContain("Statements");
  });

  it("keeps endpoint-sourced input on sales_imports and sales_lines", () => {
    expect(migration).toContain("filename");
    expect(migration).toContain("content_hash");
    expect(migration).toContain("endpoint");
    expect(migration).toContain("external_id");
    expect(migration).toContain("Do not collapse imports into ledger-only rows");
    expect(migration).toContain("Input preserved; output is ours");
  });

  it("defines a 24Frame statement output that keeps source input for later export", () => {
    const statement = readFileSync("src/lib/finance-statement.ts", "utf8");
    const page = readFileSync("src/app/(app)/(operator)/aggregation/gc/finance/[periodId]/page.tsx", "utf8");
    expect(statement).toContain("toStatementOutput");
    expect(statement).toContain("STATEMENT_OUTPUT_FORMAT");
    expect(statement).toContain("24frame-statement-v1");
    expect(page).toContain("reported_cents, transaction_date, raw");
    expect(page).toContain("content_hash");
    expect(page).not.toContain("application/pdf");
    expect(page).not.toContain("text/csv");
  });

  it("refuses recipient writes and Client B reads", () => {
    expect(recipientCanWriteFinance()).toBe(false);
    expect(orgRoleCanViewFinancial("account_owner")).toBe(true);
    expect(orgRoleCanViewFinancial("accountant")).toBe(true);
    expect(orgRoleCanViewFinancial("legal")).toBe(true);
    expect(orgRoleCanViewFinancial("viewer")).toBe(false);
    expect(orgRoleCanViewFinancial("delivery_ops")).toBe(false);
    expect(() => assertRecipientOrgIsolation("org-a", "org-b")).toThrow(
      "Client A never reads Client B money",
    );
    expect(assertRecipientOrgIsolation("org-a", "org-a")).toBeUndefined();
    expect(
      recipientMayExportPeriod({ periodOrgId: "org-a", activeOrgId: "org-b", status: "closed" }),
    ).toBe(false);
    expect(
      recipientMayExportPeriod({ periodOrgId: "org-a", activeOrgId: "org-a", status: "open" }),
    ).toBe(false);
    expect(
      recipientMayExportPeriod({ periodOrgId: "org-a", activeOrgId: "org-a", status: "closed" }),
    ).toBe(true);
    expect(FINANCE_WRITE_RPCS).toContain("import_sales");
    expect(FINANCE_WRITE_RPCS).toContain("request_sales_import");
    expect(FINANCE_WRITE_RPCS).toContain("apply_finance_close");
    expect(FINANCE_WRITE_RPCS).toContain("close_finance_period");
    expect(FINANCE_WRITE_RPCS).toContain("post_ledger_entry");
    expect(FINANCE_WRITE_RPCS).toContain("set_finance_period_threshold");
    expect(FINANCE_WRITE_RPCS).toContain("move_sales_lines_to_suspense");
    expect(FINANCE_WRITE_RPCS).toContain("assign_suspense_lines_to_period");
    expect(FINANCE_CLIENT_HREF).toBe("/aggregation/reports");
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).not.toContain("WORKSPACE_REDIRECTS");
    expect(nextConfig).not.toContain('source: "/gc/finance"');
    expect(suspenseMigration).toContain("sales_lines SELECT must hide suspense from recipients");
    expect(suspenseMigration).toContain("do not invent a parallel suspense money table");
    expect(awsMigration).toContain("apply_finance_close");
    expect(awsMigration).toContain("finance_worker_only");
    expect(awsMigration).toContain("Import parse runs on the finance worker");
    expect(awsMigration).toContain("close_finance_period is thin");
    expect(awsMigration).not.toContain("references auth.users");
  });
});
