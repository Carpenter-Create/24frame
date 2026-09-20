import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { clientShareCents } from "./finance-compute";
import {
  FINANCE_WRITE_RPCS,
  assertSuspenseOrgIsolation,
  decideSuspenseAssign,
  decideSuspenseMove,
  isSuspenseLine,
  openPeriodsForOrg,
  periodLinesForMath,
  recipientCanWriteFinance,
  recipientVisibleSalesLines,
  unmappedLinesBlockClose,
} from "./finance";

const slice2 = readFileSync(
  "supabase/migrations/20260913220000_finance_ops_slice_2_suspense.sql",
  "utf8",
);
const compute = readFileSync("src/lib/finance-compute.ts", "utf8");

const parked = { id: "l-park", period_id: null, title_id: null, org_id: "org-a", bank_receipt_cents: 4000 };
const attachedUnmapped = {
  id: "l-open",
  period_id: "p-a",
  title_id: null,
  org_id: "org-a",
  bank_receipt_cents: 1800,
};
const attachedMapped = {
  id: "l-map",
  period_id: "p-a",
  title_id: "t-a",
  org_id: "org-a",
  bank_receipt_cents: 2500,
};

describe("move unmapped lines to suspense", () => {
  it("allows an unmapped line on an open period and refuses mapped or parked or closed", () => {
    expect(
      decideSuspenseMove({ titleId: null, periodId: "p-a", periodStatus: "open" }),
    ).toEqual({ ok: true });
    expect(
      decideSuspenseMove({ titleId: "t-a", periodId: "p-a", periodStatus: "open" }),
    ).toEqual({ ok: false, reason: "mapped" });
    expect(
      decideSuspenseMove({ titleId: null, periodId: null, periodStatus: "open" }),
    ).toEqual({ ok: false, reason: "already_suspense" });
    expect(
      decideSuspenseMove({ titleId: null, periodId: "p-a", periodStatus: "closed" }),
    ).toEqual({ ok: false, reason: "closed_period" });
    expect(isSuspenseLine(null)).toBe(true);
    expect(isSuspenseLine("p-a")).toBe(false);
  });
});

describe("assign suspense lines to an open period", () => {
  it("attaches a parked line to a staff-chosen open period on the same org", () => {
    expect(
      decideSuspenseAssign({
        linePeriodId: null,
        lineOrgId: "org-a",
        targetOrgId: "org-a",
        targetStatus: "open",
      }),
    ).toEqual({ ok: true });
    expect(
      openPeriodsForOrg("org-a", [
        { id: "p-a-open", org_id: "org-a", status: "open" },
        { id: "p-a-closed", org_id: "org-a", status: "closed" },
        { id: "p-b-open", org_id: "org-b", status: "open" },
      ]).map((period) => period.id),
    ).toEqual(["p-a-open"]);
  });
});

describe("cannot assign to a closed period", () => {
  it("refuses a closed target even when the line is parked on the same org", () => {
    expect(
      decideSuspenseAssign({
        linePeriodId: null,
        lineOrgId: "org-a",
        targetOrgId: "org-a",
        targetStatus: "closed",
      }),
    ).toEqual({ ok: false, reason: "closed_period" });
    expect(slice2).toContain("Cannot assign suspense to a closed period");
    expect(slice2).toContain("Do not invent a period from transaction_date");
  });
});

describe("cannot cross org", () => {
  it("keeps Client A parked lines out of Client B periods", () => {
    expect(
      decideSuspenseAssign({
        linePeriodId: null,
        lineOrgId: "org-a",
        targetOrgId: "org-b",
        targetStatus: "open",
      }),
    ).toEqual({ ok: false, reason: "cross_org" });
    expect(() => assertSuspenseOrgIsolation("org-a", "org-b")).toThrow(
      "Client A lines never enter Client B suspense",
    );
    expect(assertSuspenseOrgIsolation("org-a", "org-a")).toBeUndefined();
    expect(slice2).toContain("Client A lines never enter Client B suspense");
    expect(slice2).toContain("org_id = v_org");
  });
});

describe("close ignores suspense lines in period math", () => {
  it("drops parked lines from the period set and does not block close", () => {
    const lines = [parked, attachedUnmapped, attachedMapped];
    expect(periodLinesForMath("p-a", lines).map((line) => line.id)).toEqual(["l-open", "l-map"]);
    expect(unmappedLinesBlockClose("p-a", lines)).toBe(true);
    expect(unmappedLinesBlockClose("p-a", [parked, attachedMapped])).toBe(false);
    expect(clientShareCents(attachedMapped.bank_receipt_cents, 8500)).toBe(2125);
    expect(clientShareCents(parked.bank_receipt_cents, 8500)).toBe(3400);
    expect(slice2).toContain("Map unmapped lines or move them to suspense before close");
    expect(slice2).toContain("where sl.period_id = p_period_id");
    expect(slice2).toContain("and sl.title_id is not null");
  });

  it("does not change compute", () => {
    expect(compute).toContain("clientShareCents");
    expect(compute).toContain("aggregatorKeepCents");
    expect(compute).not.toContain("suspense");
    expect(slice2).toContain("No compute change");
  });
});

describe("recipients cannot see or write suspense", () => {
  it("hides parked lines from recipient reads and keeps write RPCs staff-only", () => {
    expect(recipientVisibleSalesLines([parked, attachedMapped]).map((line) => line.id)).toEqual([
      "l-map",
    ]);
    expect(recipientCanWriteFinance()).toBe(false);
    expect(FINANCE_WRITE_RPCS).toContain("move_sales_lines_to_suspense");
    expect(FINANCE_WRITE_RPCS).toContain("assign_suspense_lines_to_period");
    expect(slice2).toContain("or period_id is not null");
    expect(slice2).toContain("public.is_gc_staff(auth.uid())");
    expect(slice2).toContain("gc_can(auth.uid(), 'manage_tax_banking')");
    expect(slice2).not.toMatch(/create table .*suspense/i);
  });

  it("keeps recipient UI and export off the suspense pool", () => {
    const list = readFileSync("src/app/(app)/aggregation/reports/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/aggregation/reports/[periodId]/page.tsx", "utf8");
    const exp = readFileSync("src/app/(app)/aggregation/reports/[periodId]/export/route.ts", "utf8");
    const load = readFileSync("src/lib/finance-recipient-load.ts", "utf8");
    const staffList = readFileSync("src/app/(app)/(operator)/staff/gc/finance/page.tsx", "utf8");
    for (const src of [list, detail, exp]) {
      expect(src).not.toMatch(/suspense/i);
      expect(src).not.toContain("move_sales_lines_to_suspense");
      expect(src).not.toContain("assign_suspense_lines_to_period");
    }
    expect(load).toContain('.not("period_id", "is", null)');
    expect(load).toContain("recipientVisibleSalesLines");
    expect(staffList).toContain("data-finance-suspense");
    expect(staffList).toContain("is(\"period_id\", null)");
  });
});
