import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { CLIENTS_PAGE, ORG_ROLE_LABELS, ORG_STATUS_LABELS } from "@/lib/clients";
import { DASHBOARD_HOME, dashboardJustInDate } from "@/lib/dashboard-home";
import { DASHBOARD_ADMIN } from "@/lib/dashboard-admin";
import { FINANCE_PAGE } from "@/lib/finance";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";
import { REPORTS_HREF } from "@/lib/reports";
import { AGGREGATION_EMPTY } from "@/lib/aggregation-empty";
import { DASHBOARD_ATTENTION_CLEAR, dashboardAttentionSummary } from "@/lib/findings";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import { TITLE_STATUS_LABELS } from "@/lib/titles";
import DashboardPage from "./page";

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

type Status = "registered" | "awaiting_payment" | "active";

function ctx({
  isGcStaff,
  orgStatus,
  role = "delivery_ops",
}: {
  isGcStaff: boolean;
  orgStatus: Status | null;
  role?: string;
}) {
  const org = orgStatus ? { id: "org-1", name: "Acme", status: orgStatus } : null;
  return {
    user: { id: "u1", email: "someone@example.com" },
    rows: org ? [{ role, organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? role : null,
    canOperate: !!org && (role === "account_owner" || role === "delivery_ops"),
    isGcStaff,
    unread: Promise.resolve(0),
  };
}

function stubClient(
  titles: {
    id: string;
    title: string;
    status: string;
    created_at: string;
  }[] = [],
  findings: {
    org_id: string;
    entity_id: string;
    message?: string | null;
    severity?: string | null;
  }[] = [],
) {
  const eq = vi.fn();
  const titlesChain = {
    select: vi.fn(() => titlesChain),
    eq: (...args: unknown[]) => {
      eq(...args);
      return titlesChain;
    },
    order: vi.fn(() => titlesChain),
    range: vi.fn(async () => ({ data: titles, error: null })),
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
  const listChain = {
    select: vi.fn(() => listChain),
    eq: vi.fn(() => listChain),
    in: vi.fn(() => listChain),
    order: vi.fn(() => listChain),
    range: vi.fn(async () => ({ data: [], error: null })),
  };
  const from = vi.fn((table: string) => {
    if (table === "titles") return titlesChain;
    if (table === "finance_periods" || table === "contract_terms") return financeChain;
    if (table === "memberships" || table === "profiles") return listChain;
    throw new Error(`unexpected from(${table})`);
  });
  const rpc = vi.fn(async (name: string) => {
    if (name === "my_findings") return { data: findings, error: null };
    if (name === "my_deliveries") return { data: [], error: null };
    if (name === "gc_client_directory") return { data: [], error: null };
    throw new Error(`unexpected rpc(${name})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from, rpc } as never);
  return { from, eq, rpc, titlesChain };
}

function statValue(html: string, key: string): string | null {
  const match = html.match(new RegExp(`data-dashboard-stat="${key}"[^>]*>([^<]*)<`));
  return match?.[1] ?? null;
}

/**
 * `/dashboard` has two legitimate modes. A client org still gets the
 * organization-scoped portfolio. GC staff without a client org stay on
 * Dashboard and see the existing GC-wide clients roster — not /queue
 * (focused work stays there) and not the client wizard.
 */
describe("DashboardPage modes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadRecipientDashboard).mockResolvedValue({
      periods: [],
      latestClosed: null,
      latestStatement: null,
      ledger: [],
      clientRateBp: null,
    });
  });

  it("renders the organization-scoped portfolio for a user with a client org", async () => {
    const { from, eq, rpc } = stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(from).toHaveBeenCalledWith("titles");
    expect(eq).toHaveBeenCalledWith("org_id", "org-1");
    expect(rpc).toHaveBeenCalledWith("my_findings", {
      p_limit: UNPAGINATED_MAX + 1,
      p_org_id: "org-1",
    });
    expect(rpc).not.toHaveBeenCalledWith("gc_client_directory", expect.anything());
    expect(html).toContain("Acme");
    expect(html).toMatch(/<h1 class="t-section text-ink">Acme<\/h1>/);
    expect(html).not.toMatch(/<h1[^>]*t-display/);
    expect(html).not.toContain(ORG_STATUS_LABELS.active);
    expect(html).not.toContain(ORG_ROLE_LABELS.account_owner);
    expect(html).not.toMatch(/Active · Account owner/);
    expect(html).toContain(DASHBOARD_ATTENTION_CLEAR);
    expect(html).toContain("/catalog-health");
    expect(html).toContain("data-dashboard-home");
    expect(html).toContain("data-dashboard-hero");
    expect(html).toContain("data-dashboard-overview-row");
    expect(html).toContain("data-dashboard-overview");
    expect(html).toContain("data-dashboard-territory");
    expect(html).toContain("data-dashboard-ranked=\"platforms\"");
    expect(html).toContain("data-dashboard-reports-cta");
    expect(html).toContain(`href="${REPORTS_HREF}"`);
    expect(html).toContain(DASHBOARD_HOME.reportsCta);
    expect(html).not.toContain("data-finance-glance");
    expect(html).not.toContain("data-finance-glance-stub");
    expect(html).toContain("dashboard-home-pill");
    expect(html).toContain('href="/catalog-health"');
    expect(html).toContain("h-9");
    expect(html).toContain("size-[14px]");
    expect(html).toContain(DASHBOARD_HOME.catalogEmpty);
    expect(html.split(DASHBOARD_HOME.catalogEmpty).length - 1).toBe(1);
    expect(html).toContain(DASHBOARD_HOME.addTitle);
    expect(html.split(DASHBOARD_HOME.addTitle).length - 1).toBe(1);
    expect(html).toContain(`href="${DASHBOARD_HOME.addTitleHref}"`);
    expect(html).toContain("data-dashboard-add-title");
    expect(html).not.toContain("data-add-title");
    expect(html).not.toContain(DASHBOARD_HOME.justInEmpty);
    expect(html).not.toContain("Just in");
    expect(html).toContain(DASHBOARD_HOME.catalogHealthCta);
    expect(html).toContain("bg-accent");
    expect(html).toContain("text-accent-contrast");
    expect(html).not.toContain(CLIENTS_PAGE.title);
    expect(html).not.toContain(CLIENTS_PAGE.subtitle);
    expect(html).toContain("lg:grid-cols-3");
    expect(html).toContain("lg:grid-cols-2");
    expect(html).not.toContain(dashboardAttentionSummary(1));
    expect(html).not.toContain("titles need your attention");
    expect(html).not.toContain("Meridian Pictures");
    expect(html).not.toContain("The Winter Line");
    expect(html).not.toContain(">248<");
    expect(html).not.toContain("Accounts");
  });

  it("lists just-in titles as ink links, not accent body copy", async () => {
    const createdAt = new Date().toISOString();
    stubClient([
      {
        id: "title-1",
        title: "Winter Light",
        status: "live",
        created_at: createdAt,
      },
    ]);
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(html).toContain("Winter Light");
    expect(html).toContain("/titles/title-1");
    expect(html).toContain("dashboard-home-panel");
    expect(html).toContain("t-body font-medium text-ink");
    expect(html).not.toContain("t-subhead");
    expect(html).not.toContain(DASHBOARD_HOME.justInEmpty);
    expect(html).not.toContain(DASHBOARD_HOME.catalogEmpty);
    expect(html).not.toContain("data-dashboard-add-title");
    expect(html).not.toContain(DASHBOARD_HOME.addTitle);
    expect(html).toContain("data-dashboard-just-in-cluster");
    expect(html).toContain("t-body font-medium text-ink");
    expect(html).toContain(TITLE_STATUS_LABELS.live);
    expect(html).toContain("data-dashboard-status-pill");
    expect(html).toContain(dashboardJustInDate(createdAt));
    expect(html).not.toContain("added ");
  });

  it("still renders the client portfolio when GC staff also hold a client org", async () => {
    const { rpc } = stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: true, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(rpc).toHaveBeenCalledWith("my_findings", {
      p_limit: UNPAGINATED_MAX + 1,
      p_org_id: "org-1",
    });
    expect(rpc).not.toHaveBeenCalledWith("gc_client_directory", expect.anything());
    expect(html).toContain("Acme");
    expect(html).toContain("data-dashboard-overview-row");
    expect(html).toContain("data-dashboard-hero");
    expect(html).toContain("data-dashboard-reports-cta");
    expect(html).toContain(DASHBOARD_HOME.reportsCta);
    expect(html).not.toContain("data-finance-glance");
    expect(html).not.toContain("data-finance-glance-stub");
    expect(html).not.toContain(FINANCE_PAGE.glance);
    expect(html).not.toContain(CLIENTS_PAGE.subtitle);
  });

  it("renders the GC-wide clients roster on Dashboard for staff with no client org", async () => {
    const { from, rpc } = stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: true, orgStatus: null }) as never,
    );

    const page = await DashboardPage();
    const html = renderToStaticMarkup(page);

    expect(rpc).toHaveBeenCalledWith("gc_client_directory", { p_limit: UNPAGINATED_MAX + 1 });
    expect(from).not.toHaveBeenCalledWith("titles");
    expect(html).toContain(CLIENTS_PAGE.title);
    expect(html).toContain(CLIENTS_PAGE.subtitle);
    expect(html).toContain(CLIENTS_PAGE.empty);
    expect(html).toContain("data-finance-glance-stub");
    expect(html).toContain(FINANCE_PAGE.glance);
    expect(html).not.toContain("Dashboard —");
    expect(html).not.toContain("/catalog-health");
    expect(html).not.toContain("data-dashboard-home");
    expect(html).not.toContain("dashboard-home-pill");
    expect(html).not.toContain(DASHBOARD_HOME.justInEmpty);
    expect(html).not.toContain(DASHBOARD_HOME.catalogEmpty);
    expect(html).not.toContain("data-dashboard-add-title");
    expect(html).not.toContain(DASHBOARD_HOME.addTitle);
    expect(html).not.toContain("data-dashboard-snapshot");
    expect(html).not.toContain(DASHBOARD_HOME.doNext);
  });

  it("does not send GC staff with no client org to /queue or the wizard", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: true, orgStatus: null }) as never,
    );

    await expect(DashboardPage()).resolves.toBeTruthy();
  });

  it("shows the empty company workspace for a non-GC user with no org", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: null }) as never,
    );
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toContain("data-aggregation-empty");
    expect(html).toContain(AGGREGATION_EMPTY.title);
    expect(html).toContain(AGGREGATION_EMPTY.create);
    expect(html).toContain("/onboarding");
    expect(html).not.toContain("data-dashboard-home");
  });

  it("sends an unauthenticated visitor to login", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/login");
  });
});

function stubRecipient() {
  vi.mocked(loadRecipientDashboard).mockResolvedValue({
    periods: [],
    latestClosed: null,
    latestStatement: null,
    ledger: [],
    clientRateBp: null,
  });
}

describe("client home information model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubRecipient();
  });

  it("shows the Overview hero, Top titles, ranked bars, Recent, and Do next without revenue", async () => {
    stubClient(
      [
        {
          id: "title-1",
          title: "Winter Light",
          status: "live",
          created_at: new Date().toISOString(),
        },
        {
          id: "title-2",
          title: "Draft Work",
          status: "draft",
          created_at: new Date().toISOString(),
        },
      ],
      [{ org_id: "org-1", entity_id: "title-1", message: "Synopsis is required." }],
    );
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(statValue(html, "catalog")).toBe("2");
    expect(statValue(html, "needsAttention")).toBe("1");
    expect(statValue(html, "live")).toBe("1");
    expect(html).toMatch(/<h1 class="t-section text-ink">Acme<\/h1>/);
    expect(html).toMatch(/data-dashboard-stat="catalog"[^>]*t-display t-data/);
    expect(html).toMatch(/data-dashboard-stat="needsAttention"[^>]*t-display t-data/);
    expect(html).toMatch(/data-dashboard-stat="live"/);
    expect(html).not.toMatch(/data-dashboard-stat="live"[^>]*t-display/);
    expect(html).not.toMatch(/data-dashboard-stat="[^"]*"[^>]*t-title/);
    expect(html).not.toMatch(/<h1[^>]*t-display/);
    expect(html).toContain(`t-label text-ink-3">${DASHBOARD_HOME.hero}`);
    expect(html).toContain(`t-label text-ink-3">${DASHBOARD_HOME.doNext}`);
    expect(html).toContain(`t-label text-ink-3">${DASHBOARD_HOME.justIn}`);
    expect(html).toContain(DASHBOARD_HOME.live);
    expect(html).toContain(DASHBOARD_HOME.doNext);
    expect(html).toContain("data-dashboard-overview-row");
    expect(html).toContain("data-dashboard-territory");
    expect(html).toContain('data-dashboard-module="top-titles"');
    expect(html).not.toContain(dashboardAttentionSummary(1));
    expect(html).not.toContain("titles need your attention");
    expect(html).toContain("Synopsis is required.");
    expect(html).toContain("t-body font-medium text-ink");
    expect(html).not.toContain("t-subhead");
    expect(html).toContain("Draft Work");
    expect(html).toContain(TITLE_STATUS_LABELS.draft);
    expect(html).toContain("Winter Light");
    expect(html).toContain(TITLE_STATUS_LABELS.live);
    expect(html).toContain("data-dashboard-status-pill");
    expect(html).toContain("data-dashboard-do-next");
    expect(html).toContain("data-dashboard-just-in");
    expect(html).toContain("data-dashboard-hero");
    expect(html).toContain("data-dashboard-overview");
    expect(html).toContain("flex flex-col gap-[var(--space-6)]");
    expect(html).toContain("lg:grid-cols-3");
    expect(html).toContain("lg:grid-cols-2");
    expect(html).toContain(DASHBOARD_HOME.justIn);
    expect(html).not.toContain("Just in");
    expect(html).not.toContain(DASHBOARD_HOME.catalogEmpty);
    expect(html).not.toContain("data-dashboard-add-title");
    expect(html).not.toContain(`${ORG_STATUS_LABELS.active} · ${ORG_ROLE_LABELS.account_owner}`);
    expect(html).not.toContain(ORG_STATUS_LABELS.active);
    expect(html).not.toContain(ORG_ROLE_LABELS.account_owner);
    expect(html).not.toContain("Revenue");
    expect(html).not.toContain("Upcoming");
    expect(html).toContain(DASHBOARD_HOME.hero);
    expect(html).not.toContain("dashboard-home-hero");
    expect(html).not.toContain("bg-band");
    expect(html).not.toContain("Access");
    expect(html).not.toContain("term ends");
    expect(html).not.toContain("Meridian Pictures");
    expect(html).not.toContain("Artwork missing");
    expect(html).not.toContain("Metadata incomplete");
    expect(html).not.toMatch(/>—</);
    expect(html.indexOf("data-dashboard-just-in")).toBeLessThan(
      html.indexOf("data-dashboard-do-next"),
    );
  });

  it("shows catalog and live as a floor when the title read is bounded", async () => {
    const createdAt = "2026-08-12T00:00:00.000Z";
    stubClient(
      Array.from({ length: UNPAGINATED_MAX }, (_, i) => ({
        id: `title-${i}`,
        title: `Title ${i}`,
        status: i === 0 ? "draft" : "live",
        created_at: createdAt,
      })),
    );
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(statValue(html, "catalog")).toBe(`${UNPAGINATED_MAX}+`);
    expect(statValue(html, "live")).toBe(`${UNPAGINATED_MAX - 1}+`);
    expect(statValue(html, "needsAttention")).toBe("0");
    expect(statValue(html, "catalog")).not.toBe(String(UNPAGINATED_MAX));
    expect(statValue(html, "live")).not.toBe(String(UNPAGINATED_MAX - 1));
  });

  it("shows needs attention as a floor when the findings probe overflows", async () => {
    stubClient(
      [
        {
          id: "title-1",
          title: "Winter Light",
          status: "live",
          created_at: "2026-08-12T00:00:00.000Z",
        },
      ],
      Array.from({ length: UNPAGINATED_MAX + 1 }, () => ({
        org_id: "org-1",
        entity_id: "title-1",
        message: "Synopsis is required.",
      })),
    );
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(statValue(html, "needsAttention")).toBe("1+");
    expect(statValue(html, "needsAttention")).not.toBe("1");
  });

  it("does not invent a stuck-too-long metric for drafts", async () => {
    stubClient([
      {
        id: "title-2",
        title: "Draft Work",
        status: "draft",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    ]);
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(html).toContain("Draft Work");
    expect(html).toContain(TITLE_STATUS_LABELS.draft);
    expect(html).not.toMatch(/stuck/i);
    expect(html).not.toContain(DASHBOARD_ATTENTION_CLEAR);
    expect(html).toContain(DASHBOARD_HOME.justInEmpty);
    expect(html).not.toContain(DASHBOARD_HOME.catalogEmpty);
    expect(html).not.toContain("data-dashboard-add-title");
  });
});

describe("client home copy lock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubRecipient();
  });

  it("locks empty catalog copy to The catalog is empty. and the existing Add Title action", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());
    const marker = html.indexOf('data-dashboard-add-title=""');
    const addStart = html.lastIndexOf("<a", marker);
    const addEnd = html.indexOf("</a>", marker);
    const link = html.slice(addStart, addEnd);

    expect(DASHBOARD_HOME.catalogEmpty).toBe("The catalog is empty.");
    expect(DASHBOARD_HOME.addTitle).toBe("Add Title");
    expect(html).toContain("The catalog is empty.");
    expect(html.split("The catalog is empty.").length - 1).toBe(1);
    expect(html.split("Add Title").length - 1).toBe(1);
    expect(html).toContain('href="/titles"');
    expect(link).toContain("data-dashboard-add-title");
    expect(link).toContain("Add Title");
    expect(link).toContain('href="/titles"');
    expect(link).toContain("t-body-sm");
    expect(link).toContain("text-accent");
    expect(link).toContain("hover:underline");
    expect(link).not.toContain("bg-accent");
    expect(link).not.toContain("text-accent-contrast");
    expect(link).not.toContain("data-add-title");
    expect(html).not.toContain("data-add-title");
    expect(html).not.toContain("No titles added recently.");
    expect(html).not.toContain("No titles yet.");
  });

  it("labels the section Recent, not Just in", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());

    expect(DASHBOARD_HOME.justIn).toBe("Recent");
    expect(html).toContain(`t-label text-ink-3">${DASHBOARD_HOME.justIn}`);
    expect(html).toContain(">Recent<");
    expect(html).not.toContain("Just in");
  });

  it("keeps an Artwork missing finding on Do next and does not invent one", async () => {
    stubClient(
      [
        {
          id: "title-1",
          title: "Winter Light",
          status: "live",
          created_at: new Date().toISOString(),
        },
      ],
      [{ org_id: "org-1", entity_id: "title-1", message: "Artwork missing" }],
    );
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );

    const html = renderToStaticMarkup(await DashboardPage());
    const rowStart = html.indexOf('data-dashboard-do-next-row="title-1"');
    const row = html.slice(rowStart, html.indexOf("</li>", rowStart));

    expect(row).toContain("Artwork missing");
    expect(html.split("Artwork missing").length - 1).toBe(1);
    expect(html).not.toContain("Metadata incomplete");
  });

  it("shows the Reports pointer and visual home modules for a client org", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active" }) as never,
    );
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toContain("data-dashboard-hero");
    expect(html).toContain("data-dashboard-overview-row");
    expect(html).toContain("data-dashboard-overview");
    expect(html).toContain("data-dashboard-territory");
    expect(html).toContain('data-dashboard-ranked="platforms"');
    expect(html).toContain('data-dashboard-module="top-titles"');
    expect(html).toContain('data-dashboard-module="deliveries-action"');
    expect(html).toContain('data-dashboard-module="findings-glance"');
    expect(html).toContain('data-dashboard-module="what-changed"');
    expect(html).toContain("data-dashboard-reports-cta");
    expect(html).toContain(`href="${REPORTS_HREF}"`);
    expect(html).toContain(DASHBOARD_HOME.reportsCta);
    expect(html).not.toContain("data-finance-glance");
    expect(html).not.toContain("data-finance-glance-stub");
    expect(html).not.toContain("Revenue");
    expect(html).not.toContain("bg-band");
    expect(html).not.toContain("data-reports-period");
    expect(html).not.toContain("data-reports-download");
  });

  it("still shows the Reports pointer when the recipient cannot view financial", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue({
      ...ctx({ isGcStaff: false, orgStatus: "active" }),
      activeRole: "viewer",
    } as never);
    const html = renderToStaticMarkup(await DashboardPage());
    expect(html).toContain("data-dashboard-home");
    expect(html).toContain("data-dashboard-reports-cta");
    expect(html).not.toContain("data-finance-glance");
    expect(html).not.toContain("data-finance-glance-stub");
  });

  it("hides Add Title on an empty catalog when the viewer cannot operate", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue({
      ...ctx({ isGcStaff: false, orgStatus: "active" }),
      canOperate: false,
    } as never);

    const html = renderToStaticMarkup(await DashboardPage());

    expect(html).toContain(DASHBOARD_HOME.catalogEmpty);
    expect(html).not.toContain("data-dashboard-add-title");
    expect(html).not.toContain(DASHBOARD_HOME.addTitle);
  });
});

describe("company admin Overview hero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubRecipient();
  });

  it("rematches RL Overview: period chrome, revenue MetricCard, recent activity, no export", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active", role: "account_owner" }) as never,
    );
    const html = renderToStaticMarkup(await DashboardPage({ searchParams: Promise.resolve({}) }));

    expect(html).toContain("data-dashboard-admin-hero");
    expect(html).toContain("data-dashboard-admin-chrome");
    expect(html).toContain("data-dashboard-admin-controls");
    expect(html).toContain("data-dashboard-period");
    expect(html).toContain("data-dashboard-user");
    expect(html).toContain("data-dashboard-revenue");
    expect(html).toContain("data-dashboard-revenue-chart");
    expect(html).toContain('data-dashboard-module="recent-activity"');
    expect(html).toContain("lg:grid-cols-5");
    expect(html).toContain("lg:col-span-3");
    expect(html).toContain("lg:col-span-2");
    expect(html).toMatch(/<h1 class="t-section text-ink">All time<\/h1>/);
    expect(html).toContain(DASHBOARD_ADMIN.revenue);
    expect(html).toContain(DASHBOARD_ADMIN.revenueEmpty);
    expect(html).toContain(DASHBOARD_ADMIN.activity);
    expect(html).toContain(DASHBOARD_ADMIN.allTime);
    expect(html).toContain(DASHBOARD_ADMIN.ytd);
    expect(html).toContain("2026");
    expect(html).toContain(DASHBOARD_ADMIN.findUser);
    expect(html).toContain(DASHBOARD_ADMIN.allCompany);
    expect(html).toContain("As of All time");
    expect(html).toContain(DASHBOARD_ADMIN.chartEmpty);
    expect(html).toContain("data-dashboard-overview");
    expect(html).toContain("data-dashboard-reports-cta");
    expect(html).toContain(`href="${REPORTS_HREF}"`);
    expect(html).not.toContain("data-reports-download");
    expect(html).not.toContain("Export CSV");
    expect(html).not.toContain("View lines");
    expect(html).not.toContain("Royalogic");
    expect(html).not.toContain("Advisory");
    expect(html).not.toContain("bg-band");
    expect(html).not.toContain("shadow-lg");
    expect(html).not.toContain('data-dashboard-module="top-titles"');
    expect(html).not.toContain("recharts");
    expect(loadRecipientDashboard).toHaveBeenCalledWith("org-1");
  });

  it("keeps a named period in ?period= and does not invent a user roster", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active", role: "account_owner" }) as never,
    );
    const html = renderToStaticMarkup(
      await DashboardPage({ searchParams: Promise.resolve({ period: "Q32026" }) }),
    );
    expect(html).toMatch(/<h1 class="t-section text-ink">Q3 2026<\/h1>/);
    expect(html).toContain('value="Q32026"');
    expect(html).not.toContain("data-dashboard-user-results");
    expect(html).toContain(DASHBOARD_ADMIN.allCompany);
  });

  it("does not load org money when a user is scoped", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(
      ctx({ isGcStaff: false, orgStatus: "active", role: "account_owner" }) as never,
    );
    const html = renderToStaticMarkup(
      await DashboardPage({ searchParams: Promise.resolve({ user: "maya" }) }),
    );
    expect(loadRecipientDashboard).not.toHaveBeenCalled();
    expect(html).toContain(DASHBOARD_ADMIN.revenueEmpty);
    expect(html).toContain(DASHBOARD_ADMIN.chartEmpty);
  });
});
