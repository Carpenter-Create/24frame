import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { loadRecipientPeriod } from "@/lib/finance-recipient-load";
import { signedFinanceUrl } from "@/lib/s3-finance";
import { createClient } from "@/lib/supabase/server";
import { GET } from "./route";

vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/finance-recipient-load", () => ({
  loadRecipientPeriod: vi.fn(),
  loadRecipientStatement: vi.fn(),
}));
vi.mock("@/lib/s3-finance", () => ({ signedFinanceUrl: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

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

function mockSupabase(exported: { s3_key: string } | null) {
  const rpc = vi.fn().mockResolvedValue({ error: null });
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: exported }),
  };
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => query), rpc } as never);
  return { rpc, query };
}

describe("recipient statement export", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to the signed finance object when the worker has written it", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);
    vi.mocked(loadRecipientPeriod).mockResolvedValue(closedPeriod);
    mockSupabase({ s3_key: "orgs/org-a/statements/p-closed/24frame-statement.csv" });
    vi.mocked(signedFinanceUrl).mockResolvedValue("https://finance.example/signed.csv");

    const res = await GET(new Request("http://localhost/finance/p-closed/export?format=csv"), {
      params: Promise.resolve({ periodId: "p-closed" }),
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://finance.example/signed.csv");
    expect(signedFinanceUrl).toHaveBeenCalledWith(
      "orgs/org-a/statements/p-closed/24frame-statement.csv",
      "org-a",
    );
  });

  it("queues a worker export when the object is not ready", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);
    vi.mocked(loadRecipientPeriod).mockResolvedValue(closedPeriod);
    const { rpc } = mockSupabase(null);

    const res = await GET(new Request("http://localhost/finance/p-closed/export?format=pdf"), {
      params: Promise.resolve({ periodId: "p-closed" }),
    });
    expect(res.status).toBe(202);
    expect(rpc).toHaveBeenCalledWith("request_finance_export", { p_period_id: "p-closed" });
    expect(signedFinanceUrl).not.toHaveBeenCalled();
  });

  it("refuses export when the period belongs to Client B", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner", "org-a") as never);
    vi.mocked(loadRecipientPeriod).mockResolvedValue({ ...closedPeriod, org_id: "org-b" });

    const res = await GET(new Request("http://localhost/finance/p-closed/export?format=csv"), {
      params: Promise.resolve({ periodId: "p-closed" }),
    });
    expect(res.status).toBe(404);
    expect(createClient).not.toHaveBeenCalled();
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
