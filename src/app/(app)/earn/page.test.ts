import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { FINANCE_CLIENT, FINANCE_CLIENT_HREF, FINANCE_PAGE, FINANCE_WRITE_RPCS } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { buildPeriodStatement } from "@/lib/finance-statement";
import { PARENT_ENTITY } from "@/lib/product";
import ClientFinancePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/finance-recipient-load", () => ({ loadRecipientDashboard: vi.fn() }));

function ctx(role: string | null, orgId = "org-a") {
  const org = orgId ? { id: orgId, name: "Acme", status: "active" as const } : null;
  return {
    user: { id: "u1", email: "owner@example.com" },
    rows: org && role ? [{ role, organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: role,
    canOperate: role === "account_owner",
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

const latestStatement = buildPeriodStatement({
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
});

function stubDashboard(orgId = "org-a") {
  const loaded = {
    periods: [
      {
        id: "p-closed",
        org_id: orgId,
        period_year: 2026,
        period_month: 8,
        status: "closed" as const,
        opening_balance_cents: 0,
        closing_balance_cents: 0,
        threshold_cents: 1000,
      },
      {
        id: "p-open",
        org_id: orgId,
        period_year: 2026,
        period_month: 9,
        status: "open" as const,
        opening_balance_cents: 0,
        closing_balance_cents: null,
        threshold_cents: 1000,
      },
    ],
    latestClosed: {
      id: "p-closed",
      org_id: orgId,
      period_year: 2026,
      period_month: 8,
      status: "closed" as const,
      opening_balance_cents: 0,
      closing_balance_cents: 0,
      threshold_cents: 1000,
    },
    latestStatement,
    ledger: [
      { period_id: "p-closed", kind: "sale", amount_cents: 2125 },
      { period_id: "p-closed", kind: "recoup", amount_cents: -150 },
      { period_id: "p-closed", kind: "payable", amount_cents: -1975 },
    ],
    clientRateBp: 8500,
  };
  vi.mocked(loadRecipientDashboard).mockResolvedValue(loaded);
  return loaded;
}

describe("client Finance list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders glance metrics and history, never writes", async () => {
    stubDashboard();
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);

    const html = renderToStaticMarkup(await ClientFinancePage());
    expect(html).toContain("data-finance-dashboard");
    expect(html).toContain("data-finance-hero");
    expect(html).toContain("data-finance-contract-strip");
    expect(html).toContain("data-finance-history-chart");
    expect(html).not.toContain("bg-band");
    expect(html).toContain("2026-08");
    expect(html).toContain("2026-09");
    expect(html).toContain(`${FINANCE_CLIENT_HREF}/p-closed`);
    expect(html).toContain(FINANCE_PAGE.statusClosed);
    expect(html).toContain(FINANCE_PAGE.statusOpen);
    expect(html).toContain(FINANCE_CLIENT.overview);
    expect(html).toContain(FINANCE_CLIENT.history);
    expect(html).toContain(FINANCE_CLIENT.contribution);
    expect(html).toContain(FINANCE_CLIENT.recoupVisible);
    expect(html).toContain(FINANCE_PAGE.aggregatorKeep);
    expect(html).not.toContain("Import sales");
    expect(html).not.toContain("Close period");
    expect(html).not.toContain("Post ledger");
    expect(html).not.toContain(FINANCE_PAGE.suspense);
    expect(html).not.toContain(FINANCE_PAGE.toSuspense);
    expect(html).not.toContain(PARENT_ENTITY);
  });

  it("drops a leaked Client B period from the list", async () => {
    vi.mocked(loadRecipientDashboard).mockResolvedValue({
      periods: [
        {
          id: "p-b",
          org_id: "org-b",
          period_year: 2026,
          period_month: 8,
          status: "closed",
          opening_balance_cents: 9999,
          closing_balance_cents: 9999,
          threshold_cents: 1000,
        },
      ],
      latestClosed: null,
      latestStatement: null,
      ledger: [{ period_id: "p-b", kind: "sale", amount_cents: 9999 }],
      clientRateBp: 8500,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner", "org-a") as never);
    const html = renderToStaticMarkup(await ClientFinancePage());
    const dashboard = buildClientFinanceDashboard({
      orgId: "org-a",
      clientRateBp: 8500,
      periods: [
        {
          id: "p-b",
          org_id: "org-b",
          period_year: 2026,
          period_month: 8,
          status: "closed",
          opening_balance_cents: 9999,
          closing_balance_cents: 9999,
          threshold_cents: 1000,
        },
      ],
      ledger: [{ period_id: "p-b", kind: "sale", amount_cents: 9999 }],
      latestStatement: null,
    });
    expect(dashboard.history).toEqual([]);
    expect(html).toContain(FINANCE_CLIENT.empty);
    expect(html).not.toContain("p-b");
    expect(html).not.toContain("$99.99");
  });

  it("stays quiet for viewer seats without view_financial", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx("viewer") as never);
    const html = renderToStaticMarkup(await ClientFinancePage());
    expect(html).toContain(FINANCE_CLIENT.noAccess);
    expect(loadRecipientDashboard).not.toHaveBeenCalled();
  });
});

describe("recipient write surface", () => {
  it("does not import staff write actions or finance write RPCs", () => {
    const list = readFileSync("src/app/(app)/earn/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/earn/[periodId]/page.tsx", "utf8");
    const exp = readFileSync("src/app/(app)/earn/[periodId]/export/route.ts", "utf8");
    for (const src of [list, detail, exp]) {
      expect(src).not.toContain("gc/finance/actions");
      expect(src).not.toContain("finance-forms");
      for (const rpc of FINANCE_WRITE_RPCS) {
        expect(src).not.toContain(rpc);
      }
    }
  });
});
