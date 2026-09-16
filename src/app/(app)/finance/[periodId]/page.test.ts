import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { FINANCE_CLIENT, FINANCE_PAGE } from "@/lib/finance";
import { PARENT_ENTITY } from "@/lib/product";
import { loadRecipientPeriod, loadRecipientStatement } from "@/lib/finance-recipient-load";
import { buildPeriodStatement } from "@/lib/finance-statement";
import ClientFinancePeriodPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));
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
    canOperate: role === "account_owner",
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

describe("client Finance period", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows quiet empty for an open period and no write controls", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("accountant") as never);
    vi.mocked(loadRecipientPeriod).mockResolvedValue({
      id: "p-open",
      org_id: "org-a",
      period_year: 2026,
      period_month: 9,
      status: "open",
      opening_balance_cents: 400,
      closing_balance_cents: null,
      threshold_cents: 1000,
    });

    const html = renderToStaticMarkup(
      await ClientFinancePeriodPage({ params: Promise.resolve({ periodId: "p-open" }) }),
    );
    expect(html).toContain(FINANCE_CLIENT.notYet);
    expect(html).not.toContain(FINANCE_CLIENT.pdf);
    expect(html).not.toContain("Import sales");
    expect(html).not.toContain("Close period");
    expect(html).not.toContain(FINANCE_PAGE.suspense);
    expect(loadRecipientStatement).not.toHaveBeenCalled();
  });

  it("renders the closed statement with PDF and CSV doors", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("legal") as never);
    vi.mocked(loadRecipientPeriod).mockResolvedValue({
      id: "p-closed",
      org_id: "org-a",
      period_year: 2026,
      period_month: 8,
      status: "closed",
      opening_balance_cents: 0,
      closing_balance_cents: 0,
      threshold_cents: 1000,
    });
    vi.mocked(loadRecipientStatement).mockResolvedValue(
      buildPeriodStatement({
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
            raw: {},
          },
        ],
        recoupItems: [
          {
            id: "r1",
            kind: "recoup",
            amountCents: -150,
            titleId: "title-a",
            titleName: "Title A",
            note: "Advance",
          },
        ],
        adjustmentItems: [],
        staffSaleItems: [],
      }),
    );

    const html = renderToStaticMarkup(
      await ClientFinancePeriodPage({ params: Promise.resolve({ periodId: "p-closed" }) }),
    );
    expect(html).toContain(FINANCE_CLIENT.pdf);
    expect(html).toContain(FINANCE_CLIENT.csv);
    expect(html).toContain(FINANCE_CLIENT.pack);
    expect(html).toContain(FINANCE_CLIENT.download);
    expect(html).toContain("data-finance-download");
    expect(html).toContain("data-finance-statement-doc");
    expect(html).toContain("Acme");
    expect(html).not.toContain("bg-band");
    expect(html).toContain("/finance/p-closed/export?format=pdf");
    expect(html).toContain("/finance/p-closed/export?format=csv");
    expect(html).toContain("data-finance-dashboard");
    expect(html).toContain("avod");
    expect(html).toContain("ext-99");
    expect(html).toContain(FINANCE_PAGE.aggregatorKeep);
    expect(html).toContain(FINANCE_PAGE.orgRollup);
    expect(html).toContain(FINANCE_CLIENT.recoupVisible);
    expect(html).toContain("Advance");
    expect(html).toContain(FINANCE_CLIENT.contribution);
    expect(html).toContain(FINANCE_CLIENT.amountDue);
    expect(html).not.toContain("Import sales");
    expect(html).not.toContain("Close period");
    expect(html).not.toContain("Post ledger");
    expect(html).not.toContain(FINANCE_PAGE.suspense);
    expect(html).not.toContain(FINANCE_PAGE.toSuspense);
    expect(html).not.toContain(PARENT_ENTITY);
  });
});
