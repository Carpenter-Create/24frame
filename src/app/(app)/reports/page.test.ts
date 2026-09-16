import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { FINANCE_CLIENT, FINANCE_WRITE_RPCS } from "@/lib/finance";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { loadMyDeliveries, loadMyFindings } from "@/lib/my-lists";
import { REPORTS_PAGE } from "@/lib/reports";
import ReportsPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/finance-recipient-load", () => ({ loadRecipientDashboard: vi.fn() }));
vi.mock("@/lib/my-lists", () => ({
  loadMyFindings: vi.fn(),
  loadMyDeliveries: vi.fn(),
}));

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

function stubReads() {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    in: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(async () => ({ data: [], error: null })),
  };
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never);
  vi.mocked(loadMyFindings).mockResolvedValue({ rows: [], truncated: false });
  vi.mocked(loadMyDeliveries).mockResolvedValue({ rows: [], truncated: false });
  vi.mocked(loadRecipientDashboard).mockResolvedValue({
    periods: [],
    latestClosed: null,
    latestStatement: null,
    ledger: [],
    clientRateBp: null,
  });
}

describe("ReportsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the admin shell without inventing money", async () => {
    stubReads();
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);
    const html = renderToStaticMarkup(await ReportsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain(REPORTS_PAGE.title);
    expect(html).toContain(REPORTS_PAGE.subtitle);
    expect(html).toContain(REPORTS_PAGE.empty);
    expect(html).toContain("data-reports-empty");
    expect(html).toContain("data-reports-controls");
    expect(html).toContain(REPORTS_PAGE.allTime);
    expect(html).toContain(REPORTS_PAGE.thisMonth);
    expect(html).toContain(REPORTS_PAGE.download);
    expect(html).toContain("data-reports-download-off");
    expect(html).not.toContain("Revenue");
    expect(html).not.toContain("$");
    expect(html).not.toContain("Royalogic");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(ReportsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/login");
  });

  it("does not load statement money for a viewer seat", async () => {
    stubReads();
    vi.mocked(getOrgContext).mockResolvedValue(ctx("viewer") as never);
    await ReportsPage({ searchParams: Promise.resolve({}) });
    expect(loadRecipientDashboard).not.toHaveBeenCalled();
    expect(FINANCE_CLIENT.noAccess).toContain("not available");
  });

  it("does not import staff write actions or finance write RPCs", () => {
    const list = readFileSync("src/app/(app)/reports/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/reports/[periodId]/page.tsx", "utf8");
    const exp = readFileSync("src/app/(app)/reports/[periodId]/export/route.ts", "utf8");
    for (const src of [list, detail, exp]) {
      expect(src).not.toContain("gc/finance/actions");
      expect(src).not.toContain("finance-forms");
      for (const rpc of FINANCE_WRITE_RPCS) {
        expect(src).not.toContain(rpc);
      }
    }
  });
});
