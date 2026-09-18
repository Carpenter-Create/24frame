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
  DASHBOARD_SECTION_TITLE_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_ON_CLASS,
  DASHBOARD_TOP_PILL_CLUSTER_CLASS,
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
    in: vi.fn(() => financeChain),
    is: vi.fn(() => financeChain),
    order: vi.fn(() => financeChain),
    limit: vi.fn(() => financeChain),
    range: vi.fn(async () => ({ data: [], error: null })),
    maybeSingle: vi.fn(async () => ({ data: null, error: null })),
  };
  const from = vi.fn((table: string) => {
    if (table === "titles") return titlesChain;
    if (table === "finance_periods" || table === "contract_terms") return financeChain;
    if (
      table === "memberships" ||
      table === "profiles" ||
      table === "assets" ||
      table === "deliveries" ||
      table === "audit_log"
    ) {
      return financeChain;
    }
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
    expect(html).not.toContain('data-dashboard-module="attention"');
    expect(html).not.toContain("Recent account activity");
    expect(html).toContain('data-dashboard-module="licensing-status"');
    expect(html).toContain("Licensing status");
    expect(html).toContain('data-dashboard-module="recent-activity"');
    expect(html).toContain(DASHBOARD_ADMIN.activity);
    expect(html).toContain("Recent activity");
    expect(html).toContain("data-dashboard-top-performing");
    expect(html).toContain(DASHBOARD_HOME.topPerforming);
    expect(html).toContain(DASHBOARD_HOME.pillTitles);
    expect(html).toContain(DASHBOARD_HOME.pillPlatforms);
    expect(html).toContain(DASHBOARD_HOME.pillTerritories);
    expect(html).toContain('data-dashboard-top-pill="titles"');
    expect(html).toContain('data-dashboard-module="top-titles"');
    expect(html).toContain("data-dashboard-view-alts");
    expect(html).toContain("data-dashboard-view-all-arrow");
    expect(html).toContain(DASHBOARD_VIEW_ALL_CLASS);
    expect(html).toContain(DASHBOARD_VIEW_ALT_CLUSTER_CLASS);
    expect(html).toContain(DASHBOARD_TOP_PILL_CLUSTER_CLASS);
    expect(DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS).toBe("text-accent");
    expect(DASHBOARD_VIEW_ALT_BUTTON_ON_CLASS).not.toContain("bg-");
    expect(DASHBOARD_TOP_PILL_BUTTON_ON_CLASS).toBe("bg-ink text-surface");
    expect(DASHBOARD_TOP_PILL_BUTTON_ON_CLASS).not.toContain("text-accent");
    expect(DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS).toBe("bg-surface-muted text-ink");
    expect(DASHBOARD_TOP_PILL_BUTTON_CLASS).toContain("rounded-full");
    expect(DASHBOARD_VIEW_ALT_CLUSTER_CLASS).toContain("border-hairline");
    expect(DASHBOARD_TOP_PILL_CLUSTER_CLASS).toContain("gap-[var(--space-2)]");
    expect(DASHBOARD_TOP_PILL_CLUSTER_CLASS).not.toContain("divide-x");
    expect(DASHBOARD_TOP_PILL_CLUSTER_CLASS).not.toContain("border-hairline");
    expect(DASHBOARD_VIEW_ALL_CLASS).toContain("text-accent");
    expect(DASHBOARD_SECTION_TITLE_CLASS).toBe("t-heading text-ink");
    expect(html).toContain(DASHBOARD_TOP_PILL_BUTTON_ON_CLASS);
    expect(html).toContain(DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS);
    expect(html).toContain(`t-heading text-ink">${DASHBOARD_ADMIN.revenue}`);
    expect(html).toContain(`t-heading text-ink">${DASHBOARD_ADMIN.activity}`);
    expect(html).toContain(`t-heading text-ink">Recent activity`);
    expect(html).not.toContain(`t-heading text-ink">Attention`);
    expect(html).not.toContain(`t-heading text-ink">Recent account activity`);
    expect(html).toContain(`t-heading text-ink">Licensing status`);
    expect(html).toContain(`t-heading text-ink">${DASHBOARD_HOME.topPerforming}`);
    expect(html).not.toContain(`t-label text-ink-3">${DASHBOARD_ADMIN.revenue}`);
    expect(html).not.toContain(`t-label text-ink-3">${DASHBOARD_ADMIN.activity}`);
    expect(html).not.toContain(`t-label text-ink-3">Recent activity`);
    expect(html).not.toContain(`t-label text-ink-3">Attention`);
    expect(html).not.toContain(`t-label text-ink-3">Licensing status`);
    expect(html).not.toContain(`t-label text-ink-3">${DASHBOARD_HOME.topPerforming}`);
    expect(craft).not.toContain("amber");
    expect(craft).not.toContain("gold");
    expect(html).not.toContain("bg-foreground");
    expect(html).not.toContain("text-background");
    expect(html).toContain('data-dashboard-ranked="platforms"');
    expect(html).toContain("data-dashboard-territory");
    expect(html).toContain('data-dashboard-ranked="territories"');
    expect(html).not.toContain("data-dashboard-territory-map");
    expect(html).toContain(DASHBOARD_HOME.topTitlesEmpty);
    expect(html).not.toContain("data-dashboard-reports-cta");
    expect(html).not.toContain(DASHBOARD_HOME.reportsCta);
    expect(html).not.toContain(DASHBOARD_HOME.reportsPointer);
    expect(html).not.toContain("data-dashboard-just-in");
    expect(html).not.toContain("data-dashboard-do-next");
    expect(html).not.toContain('data-dashboard-module="deliveries-action"');
    expect(html).not.toContain('data-dashboard-module="findings-glance"');
    expect(html).not.toContain('data-dashboard-module="what-changed"');
    expect(html).not.toContain('data-dashboard-module="pending"');
    expect(html).not.toContain("Added this month");
    expect(html).not.toContain("In pipeline");
    expect(html).not.toContain("Top works");
    expect(html).not.toContain("Top titles");
    expect(html).not.toContain("Top platforms");
    expect(html).not.toContain("Top territories");
    expect(html).toContain("Territories");
    expect(DASHBOARD_HOME.territories).toBe("Territories");
    expect(html).not.toContain("HeadlineStats");
    expect(html).not.toContain("contributors");
    expect(html).not.toContain("Exports");
    expect(html).not.toContain("text-emerald");
    expect(html).not.toContain("text-green");
    expect(html).not.toContain("shadow-lg");
    expect(html).not.toContain("shadow-md");
    expect(html).toContain("shadow-none");
    expect(html).toContain("lg:grid-cols-5");
    expect(html).toContain("items-start");
    expect(html).toContain("lg:items-stretch");
    expect(html).toContain("lg:col-span-3");
    expect(html).toContain("lg:col-span-2");
    expect(html.indexOf("data-dashboard-overview-revenue")).toBeLessThan(
      html.indexOf("data-dashboard-overview-attention"),
    );
    expect(html.indexOf("data-dashboard-overview-attention")).toBeLessThan(
      html.indexOf('data-dashboard-module="licensing-status"'),
    );
    expect(html.indexOf('data-dashboard-module="recent-activity"')).toBeLessThan(
      html.indexOf('data-dashboard-module="licensing-status"'),
    );
    expect(html.indexOf('data-dashboard-module="licensing-status"')).toBeLessThan(
      html.indexOf("data-dashboard-top-performing"),
    );
    expect(html.split('data-dashboard-module="recent-activity"').length - 1).toBe(1);
    expect(DASHBOARD_RELATED_GAP_CLASS).toBe("gap-[var(--space-2)]");
    expect(DASHBOARD_CARD_PAD_HERO).toBe("px-[var(--space-4)] py-[var(--space-4)]");
    expect(DASHBOARD_SECTION_AIR_CLASS).toBe("gap-[var(--space-6)]");
    expect(DASHBOARD_ADMIN_STACK_CLASS).toBe("flex w-full flex-col gap-[var(--space-6)]");
    expect(page).toContain("DashboardTopPerforming");
    expect(page).toContain("recentAccountActivity");
    expect(page).toContain("after, before");
    expect(page).not.toContain("buildAttentionGlance");
    expect(hero).toContain("DashboardRecentActivity");
    expect(hero).not.toContain("DashboardAttention");
    expect(page).not.toMatch(/isAdmin \? \(\s*<div className=\{DASHBOARD_ADMIN_PAIR_CLASS\}/);
    expect(html).not.toContain("lg:grid-cols-2");
    expect(hero).toContain("DASHBOARD_ROW_LIST_CLASS");
    expect(craft).toContain("shadow-none");
  });
});
