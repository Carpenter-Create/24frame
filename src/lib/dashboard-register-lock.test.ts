import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "@/app/(app)/dashboard/page";
import { DASHBOARD_ADMIN } from "@/lib/dashboard-admin";
import {
  DASHBOARD_ADMIN_STACK_CLASS,
  DASHBOARD_CARD_PAD_HERO,
  DASHBOARD_HERO_VALUE_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
  DASHBOARD_VIEW_ALL_CLASS,
  DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS,
  DASHBOARD_VIEW_ALT_CLUSTER_CLASS,
} from "@/lib/dashboard-craft";
import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/finance-recipient-load", () => ({ loadRecipientDashboard: vi.fn() }));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
}));

function ctx() {
  const org = { id: "org-1", name: "Acme", status: "active" as const };
  return {
    user: { id: "u1", email: "someone@example.com" },
    rows: [{ role: "account_owner", organizations: org }],
    orgs: [{ id: org.id, name: org.name }],
    activeOrg: org,
    activeRole: "account_owner",
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

function stubClient() {
  const titlesChain = {
    select: vi.fn(() => titlesChain),
    eq: vi.fn(() => titlesChain),
    order: vi.fn(() => titlesChain),
    range: vi.fn(async () => ({ data: [], error: null })),
  };
  const financeChain = {
    select: vi.fn(() => financeChain),
    eq: vi.fn(() => financeChain),
    is: vi.fn(() => financeChain),
    order: vi.fn(() => financeChain),
    limit: vi.fn(() => financeChain),
    range: vi.fn(async () => ({ data: [], error: null })),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
  };
  const from = vi.fn((table: string) => {
    if (table === "titles") return titlesChain;
    if (table === "finance_periods" || table === "contract_terms") return financeChain;
    throw new Error(`unexpected from(${table})`);
  });
  const rpc = vi.fn(async (name: string) => {
    if (name === "my_findings" || name === "my_deliveries") return { data: [], error: null };
    throw new Error(`unexpected rpc(${name})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);
}

describe("Aggregation Dashboard Coinbase register lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadRecipientDashboard).mockResolvedValue({
      periods: [],
      latestClosed: null,
      latestStatement: null,
      ledger: [],
      clientRateBp: null,
    });
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("locks G1–G5 and Must 1–8 on the remaining spine only", async () => {
    const html = renderToStaticMarkup(await DashboardPage({ searchParams: Promise.resolve({}) }));
    const page = readFileSync("src/app/(app)/dashboard/page.tsx", "utf8");
    const hero = readFileSync("src/components/dashboard/dashboard-admin-hero.tsx", "utf8");
    const craft = readFileSync("src/lib/dashboard-craft.ts", "utf8");

    expect(html).toMatch(/data-dashboard-stat="revenue"[^>]*t-display t-data/);
    expect(html).toContain("$0.00");
    expect(DASHBOARD_HERO_VALUE_CLASS).toContain("t-display");
    expect(html).toContain("data-dashboard-revenue-asof");
    expect(html.indexOf('data-dashboard-stat="revenue"')).toBeLessThan(
      html.indexOf("data-dashboard-revenue-asof"),
    );
    expect(html).toContain("data-dashboard-period-one");
    expect(html).not.toContain("data-dashboard-period-kicker");
    expect(html).toContain('data-dashboard-module="recent-activity"');
    expect(html).toContain(DASHBOARD_ADMIN.activity);
    expect(html).toContain('data-dashboard-module="top-titles"');
    expect(html).toContain(DASHBOARD_HOME.topTitles);
    expect(html).toContain("data-dashboard-view-alts");
    expect(html).toContain("data-dashboard-view-all-arrow");
    expect(html).toContain(DASHBOARD_VIEW_ALL_CLASS);
    expect(html).toContain(DASHBOARD_VIEW_ALT_CLUSTER_CLASS);
    expect(DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS).toBe("text-accent");
    expect(DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS).not.toContain("bg-");
    expect(DASHBOARD_VIEW_ALT_CLUSTER_CLASS).toContain("border-hairline");
    expect(DASHBOARD_VIEW_ALL_CLASS).toContain("text-accent");
    expect(craft).not.toContain("amber");
    expect(craft).not.toContain("gold");
    expect(html).not.toContain('data-dashboard-ranked="platforms"');
    expect(html).not.toContain("data-dashboard-territory");
    expect(html).toContain("data-dashboard-reports-cta");
    expect(html).toContain(DASHBOARD_HOME.reportsCta);
    expect(html).not.toContain("data-dashboard-just-in");
    expect(html).not.toContain("data-dashboard-do-next");
    expect(html).not.toContain('data-dashboard-module="deliveries-action"');
    expect(html).not.toContain('data-dashboard-module="findings-glance"');
    expect(html).not.toContain('data-dashboard-module="what-changed"');
    expect(html).not.toContain('data-dashboard-module="pending"');
    expect(html).not.toContain("Added this month");
    expect(html).not.toContain("In pipeline");
    expect(html).not.toContain("Top works");
    expect(html).not.toContain("HeadlineStats");
    expect(html).not.toContain("contributors");
    expect(html).not.toContain("Exports");
    expect(html).not.toContain("text-emerald");
    expect(html).not.toContain("text-green");
    expect(html).not.toContain("shadow-lg");
    expect(html).not.toContain("shadow-md");
    expect(html).toContain("shadow-none");
    expect(html).not.toContain("lg:grid-cols-5");
    expect(DASHBOARD_RELATED_GAP_CLASS).toBe("gap-[var(--space-2)]");
    expect(DASHBOARD_CARD_PAD_HERO).toBe("px-[var(--space-4)] py-[var(--space-4)]");
    expect(DASHBOARD_SECTION_AIR_CLASS).toBe("gap-[var(--space-6)]");
    expect(DASHBOARD_ADMIN_STACK_CLASS).toBe("flex flex-col gap-[var(--space-6)]");
    expect(page).toContain("DashboardTopTitles");
    expect(hero).toContain("DASHBOARD_ROW_LIST_CLASS");
    expect(craft).toContain("shadow-none");
  });
});
