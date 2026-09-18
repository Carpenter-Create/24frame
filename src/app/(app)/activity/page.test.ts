import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ACTIVITY, ACTIVITY_HREF } from "@/lib/activity";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

import ActivityPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), push: vi.fn() }),
  usePathname: () => "/activity",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("./actions", () => ({ markActivityDone: vi.fn() }));

const TITLE_ID = "aaaaaaaa-1111-4111-8111-111111111111";

function ctx({
  isGcStaff = false,
  hasOrg = true,
}: {
  isGcStaff?: boolean;
  hasOrg?: boolean;
} = {}) {
  const org = hasOrg ? { id: "org-1", name: "Meridian Pictures", status: "active" } : null;
  return {
    user: { id: "u1", email: "ada@example.com" },
    rows: org ? [{ role: "account_owner", organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? "account_owner" : null,
    canOperate: !!org,
    isGcStaff,
    unread: Promise.resolve(0),
  };
}

function stubClient(notifications: unknown[] = []) {
  const rpc = vi.fn(async (name: string) => {
    if (name === "my_notifications") return { data: notifications, error: null };
    throw new Error(`unexpected rpc(${name})`);
  });
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return rpc;
}

async function renderPage(search: Record<string, string | string[] | undefined> = {}) {
  return renderToStaticMarkup(
    await ActivityPage({ searchParams: Promise.resolve(search) }),
  ).replaceAll("&#x27;", "'");
}

describe("ActivityPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the Open inbox by default and hides History period pills", async () => {
    stubClient([
      {
        id: "n-open",
        org_id: "org-1",
        kind: "delivery_update",
        title: "North Wind is live",
        body: "Delivery advanced.",
        source_refs: { title_id: TITLE_ID },
        created_at: "2026-09-18T12:00:00.000Z",
        unread: true,
      },
      {
        id: "n-done",
        org_id: "org-1",
        kind: "title_rejected",
        title: "Harbor Cut was returned",
        body: "Missing chain of title.",
        source_refs: { title_id: TITLE_ID },
        created_at: "2026-09-10T12:00:00.000Z",
        unread: false,
      },
    ]);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderPage();
    expect(html).toContain('data-activity-inbox=""');
    expect(html).toContain('data-activity-state="open"');
    expect(html).toContain(ACTIVITY.title);
    expect(html).toContain("North Wind is live");
    expect(html).not.toContain("Harbor Cut was returned");
    expect(html).toContain(ACTIVITY.markDone);
    expect(html).toContain(ACTIVITY.markAllDone);
    expect(html).not.toContain('data-activity-period=""');
    expect(html).toContain(`href="${ACTIVITY_HREF}"`);
    expect(html).toContain('href="/activity?state=done"');
  });

  it("shows Done History with Reports-style period pills", async () => {
    stubClient([
      {
        id: "n-done",
        org_id: "org-1",
        kind: "delivery_update",
        title: "North Wind is live",
        body: "Delivery advanced.",
        source_refs: { title_id: TITLE_ID },
        created_at: "2026-09-18T12:00:00.000Z",
        unread: false,
      },
    ]);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderPage({ state: "done", period: "ytd" });
    expect(html).toContain('data-activity-state="done"');
    expect(html).toContain("North Wind is live");
    expect(html).toContain('data-activity-period=""');
    expect(html).toContain('data-activity-period-chip="ytd"');
    expect(html).toContain('data-activity-period-select=""');
    expect(html).toContain('data-activity-period-stub=""');
    expect(html).not.toContain(ACTIVITY.markDone);
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(renderPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("does not invent an org for members without one", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx({ hasOrg: false }) as never);
    const html = await renderPage();
    expect(html).toContain(ACTIVITY.noOrg);
    expect(html).not.toContain('data-activity-inbox=""');
  });
});
