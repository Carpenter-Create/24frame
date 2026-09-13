import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { loadRecipientPeriod, loadRecipientStatement } from "@/lib/finance-recipient-load";
import { buildPeriodStatement } from "@/lib/finance-statement";
import { exportContainsRequiredMath, exportContainsRequiredSourceFields } from "@/lib/finance-export";
import { GET } from "./route";

vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/finance-recipient-load", () => ({
  loadRecipientPeriod: vi.fn(),
  loadRecipientStatement: vi.fn(),
}));

function ctx(role: string, orgId = "org-a") {
  return {
    user: { id: "u1", email: "owner@example.com" },
    rows: [{ role, organizations: { id: orgId, name: "Acme", status: "active" } }],
    orgs: [{ id: orgId, name: "Acme" }],
    activeOrg: { id: orgId, name: "Acme", status: "active" },
    activeRole: role,
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

const closedPeriod = {
  id: "p-closed",
  org_id: "org-a",
  period_year: 2026,
  period_month: 8,
  status: "closed" as const,
  opening_balance_cents: 0,
  closing_balance_cents: 0,
  threshold_cents: 1000,
};

const statement = buildPeriodStatement({
  clientRateBp: 8500,
  openingCents: 0,
  thresholdCents: 1000,
  sourceLines: [
    {
      id: "l1",
      importId: "imp-1",
      importFilename: "aug.csv",
      importContentHash: "abc",
      lineNo: 1,
      endpoint: "avod",
      externalId: "ext-99",
      titleId: "title-a",
      titleName: "Title A",
      bankReceiptCents: 2500,
      reportedCents: 3000,
      transactionDate: null,
      raw: { endpoint: "avod" },
    },
  ],
  recoupItems: [],
  adjustmentItems: [],
  staffSaleItems: [],
});

describe("recipient statement export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns CSV with required math and source fields for the active org", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);
    vi.mocked(loadRecipientPeriod).mockResolvedValue(closedPeriod);
    vi.mocked(loadRecipientStatement).mockResolvedValue(statement);

    const res = await GET(new Request("http://localhost/finance/p-closed/export?format=csv"), {
      params: Promise.resolve({ periodId: "p-closed" }),
    });
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(exportContainsRequiredMath(text)).toBe(true);
    expect(exportContainsRequiredSourceFields(text)).toBe(true);
    expect(text).toContain("avod");
    expect(text).toContain("ext-99");
  });

  it("refuses export when the period belongs to Client B", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner", "org-a") as never);
    vi.mocked(loadRecipientPeriod).mockResolvedValue({ ...closedPeriod, org_id: "org-b" });
    vi.mocked(loadRecipientStatement).mockResolvedValue(statement);

    const res = await GET(new Request("http://localhost/finance/p-closed/export?format=csv"), {
      params: Promise.resolve({ periodId: "p-closed" }),
    });
    expect(res.status).toBe(404);
    expect(loadRecipientStatement).not.toHaveBeenCalled();
  });

  it("refuses viewer writes and reads", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("viewer") as never);
    const res = await GET(new Request("http://localhost/finance/p-closed/export?format=csv"), {
      params: Promise.resolve({ periodId: "p-closed" }),
    });
    expect(res.status).toBe(403);
    expect(loadRecipientPeriod).not.toHaveBeenCalled();
  });
});
