import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { FINANCE_CLIENT, FINANCE_CLIENT_HREF, FINANCE_PAGE, FINANCE_WRITE_RPCS } from "@/lib/finance";
import ClientFinancePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

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

function stubPeriods(
  rows: Array<{
    id: string;
    org_id: string;
    period_year: number;
    period_month: number;
    status: string;
    opening_balance_cents: number;
    closing_balance_cents: number | null;
  }> = [],
) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(async () => ({ data: rows, error: null })),
  };
  const from = vi.fn((table: string) => {
    if (table === "finance_periods") return chain;
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from, chain };
}

describe("client Finance list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists this org's periods and never writes", async () => {
    stubPeriods([
      {
        id: "p-closed",
        org_id: "org-a",
        period_year: 2026,
        period_month: 8,
        status: "closed",
        opening_balance_cents: 0,
        closing_balance_cents: 400,
      },
      {
        id: "p-open",
        org_id: "org-a",
        period_year: 2026,
        period_month: 9,
        status: "open",
        opening_balance_cents: 400,
        closing_balance_cents: null,
      },
    ]);
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);

    const html = renderToStaticMarkup(await ClientFinancePage());
    expect(html).toContain("2026-08");
    expect(html).toContain("2026-09");
    expect(html).toContain(`${FINANCE_CLIENT_HREF}/p-closed`);
    expect(html).toContain(FINANCE_PAGE.statusClosed);
    expect(html).toContain(FINANCE_PAGE.statusOpen);
    expect(html).not.toContain("Import sales");
    expect(html).not.toContain("Close period");
    expect(html).not.toContain("Post ledger");
    expect(html).not.toContain(FINANCE_PAGE.suspense);
    expect(html).not.toContain(FINANCE_PAGE.toSuspense);
  });

  it("drops a leaked Client B period from the list", async () => {
    stubPeriods([
      {
        id: "p-b",
        org_id: "org-b",
        period_year: 2026,
        period_month: 8,
        status: "closed",
        opening_balance_cents: 9999,
        closing_balance_cents: 9999,
      },
    ]);
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner", "org-a") as never);
    const html = renderToStaticMarkup(await ClientFinancePage());
    expect(html).toContain(FINANCE_CLIENT.empty);
    expect(html).not.toContain("p-b");
    expect(html).not.toContain("$99.99");
  });

  it("stays quiet for viewer seats without view_financial", async () => {
    const { from } = stubPeriods();
    vi.mocked(getOrgContext).mockResolvedValue(ctx("viewer") as never);
    const html = renderToStaticMarkup(await ClientFinancePage());
    expect(html).toContain(FINANCE_CLIENT.noAccess);
    expect(from).not.toHaveBeenCalled();
  });
});

describe("recipient write surface", () => {
  it("does not import staff write actions or finance write RPCs", () => {
    const list = readFileSync("src/app/(app)/finance/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/finance/[periodId]/page.tsx", "utf8");
    const exp = readFileSync("src/app/(app)/finance/[periodId]/export/route.ts", "utf8");
    for (const src of [list, detail, exp]) {
      expect(src).not.toContain("gc/finance/actions");
      expect(src).not.toContain("finance-forms");
      for (const rpc of FINANCE_WRITE_RPCS) {
        expect(src).not.toContain(rpc);
      }
    }
  });
});
