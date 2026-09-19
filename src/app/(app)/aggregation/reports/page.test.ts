import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { FINANCE_CLIENT, FINANCE_WRITE_RPCS } from "@/lib/finance";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { loadMyDeliveries } from "@/lib/my-lists";
import { REPORTS_PAGE } from "@/lib/reports";
import {
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
} from "@/lib/house-shell";
import {
  REPORTS_CHART_EMPTY_CLASS,
  REPORTS_DOWNLOAD_CLASS,
  REPORTS_TITLE_DESKTOP_CLASS,
} from "@/lib/reports-craft";
import { REPORTS_CRAFT_FIXTURE_ENV, REPORTS_FIXTURE } from "@/lib/reports-fixture";
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
  afterEach(() => vi.unstubAllEnvs());

  it("renders the company-admin deep dive with a calm $0.00 hero", async () => {
    stubReads();
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);
    const html = renderToStaticMarkup(await ReportsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain(REPORTS_PAGE.title);
    expect(html).toContain(REPORTS_PAGE.subtitle);
    expect(html).toContain("data-reports-body");
    expect(html).toContain("data-reports-chrome");
    expect(html).toContain("data-reports-hero");
    expect(html).toContain("data-reports-composition");
    expect(html).toContain("data-reports-series");
    expect(html).toContain("data-reports-top-performing");
    expect(html).toContain('data-reports-top-pill="titles"');
    expect(html).toContain('data-reports-top-pill="platforms"');
    expect(html).toContain('data-reports-top-pill="users"');
    expect(html).toContain("data-reports-territories");
    expect(html).toContain("data-reports-detail");
    expect(html).toContain("data-reports-controls");
    expect(html).toContain("data-reports-period-cluster");
    expect(html).toContain('data-reports-period-chip="all"');
    expect(html).toContain('data-reports-period-chip="ytd"');
    expect(html).toContain('data-reports-period-chip="year"');
    expect(html).toContain('data-reports-period-chip="quarter"');
    expect(html).toContain('data-reports-period-chip="month"');
    expect(html).toContain("data-reports-period-custom");
    expect(html).toContain("data-reports-period-stub");
    expect(html).toContain("data-reports-user");
    expect(html).toContain(REPORTS_PAGE.allActivity);
    expect(html).toContain(REPORTS_PAGE.download);
    expect(html).toContain("data-reports-download-off");
    expect(html).toContain("$0.00");
    expect(html).toContain(REPORTS_PAGE.revenue);
    expect(html).toContain(REPORTS_PAGE.compositionEmpty);
    expect(html).toContain(REPORTS_PAGE.topTitlesEmpty);
    expect(html).toContain(REPORTS_PAGE.detailEmpty);
    expect(html).toContain(REPORTS_TITLE_DESKTOP_CLASS);
    expect(html).toContain(HOUSE_SEGMENTED_ITEM_BASE_CLASS);
    expect(html).toContain(HOUSE_SEGMENTED_ITEM_ON_CLASS);
    expect(html).toContain(REPORTS_CHART_EMPTY_CLASS);
    expect(html).not.toContain("data-reports-empty");
    expect(html).not.toContain("Top works");
    expect(html).not.toContain("data-dashboard-do-next");
    expect(html).not.toContain('data-dashboard-module="what-changed"');
    expect(html).not.toContain('data-dashboard-module="deliveries-action"');
    expect(html).not.toContain('data-dashboard-module="findings-glance"');
    expect(html).not.toContain("Royalogic");
    expect(html).not.toContain("data-reports-fixture-banner");
  });

  it("makes Download primary when a closed concrete period can export", async () => {
    stubReads();
    vi.mocked(loadRecipientDashboard).mockResolvedValue({
      periods: [{ id: "p-closed", org_id: "org-a", period_year: 2026, period_month: 8, status: "closed", opening_balance_cents: 0, closing_balance_cents: 0, threshold_cents: null }],
      latestClosed: null,
      latestStatement: null,
      ledger: [],
      clientRateBp: null,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);
    const html = renderToStaticMarkup(
      await ReportsPage({ searchParams: Promise.resolve({ period: "2026-08" }) }),
    );
    expect(html).toContain("data-reports-download");
    expect(html).toContain(REPORTS_DOWNLOAD_CLASS);
    expect(html).not.toContain("data-reports-download-off");
  });

  it("labels sample revenue when the craft fixture gate is on", async () => {
    vi.stubEnv(REPORTS_CRAFT_FIXTURE_ENV, "1");
    stubReads();
    vi.mocked(getOrgContext).mockResolvedValue(ctx("account_owner") as never);
    const html = renderToStaticMarkup(await ReportsPage({ searchParams: Promise.resolve({}) }));
    expect(html).toContain("data-reports-fixture-banner");
    expect(html).toContain(REPORTS_FIXTURE.banner);
    expect(html).toContain(REPORTS_FIXTURE.sampleMark);
    expect(html).toContain("$2,104,000.00");
    expect(html).toContain("Sample title 01");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(ReportsPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/login");
  });

  it("does not load statement money or user scope for a viewer seat", async () => {
    stubReads();
    vi.mocked(getOrgContext).mockResolvedValue(ctx("viewer") as never);
    const html = renderToStaticMarkup(await ReportsPage({ searchParams: Promise.resolve({}) }));
    expect(loadRecipientDashboard).not.toHaveBeenCalled();
    expect(html).not.toContain("data-reports-user");
    expect(html).not.toContain('data-reports-top-pill="users"');
    expect(FINANCE_CLIENT.noAccess).toContain("not available");
  });

  it("does not import staff write actions or finance write RPCs", () => {
    const list = readFileSync("src/app/(app)/aggregation/reports/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/aggregation/reports/[periodId]/page.tsx", "utf8");
    const exp = readFileSync("src/app/(app)/aggregation/reports/[periodId]/export/route.ts", "utf8");
    for (const src of [list, detail, exp]) {
      expect(src).not.toContain("gc/finance/actions");
      expect(src).not.toContain("finance-forms");
      for (const rpc of FINANCE_WRITE_RPCS) {
        expect(src).not.toContain(rpc);
      }
    }
  });
});
