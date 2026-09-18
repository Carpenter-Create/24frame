import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OVERVIEW, OVERVIEW_HREF } from "@/lib/overview";
import { SOCIAL_ROUTES } from "@/lib/social";
import { getOrgContext } from "@/lib/supabase/context";

import HomePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/overview-load", () => ({
  loadOverviewPulse: vi.fn(async () => ({
    revenueCents: null,
    topTitleNames: [],
    socialUnread: 0,
    socialEntered: false,
    socialAvatars: [],
    courses: [],
    needsYou: [],
    thisWeek: null,
  })),
}));

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

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the pulse when an org is active", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain("data-home-page");
    expect(html).toContain("data-overview-page");
    expect(html).toContain("data-overview-pulse");
    expect(html).toContain(OVERVIEW.title);
    expect(OVERVIEW.title).toBe("Home");
    expect(OVERVIEW_HREF).toBe("/home");
    expect(OVERVIEW_HREF).not.toBe(SOCIAL_ROUTES.home);
    expect(html).not.toContain("Globee");
    expect(html).not.toContain("data-workspace-switcher");
    const pageSrc = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
    expect(pageSrc).not.toContain("WorkspaceSwitcher");
    expect(pageSrc).not.toContain("Social Home");
  });

  it("asks for an organization when the seat has none", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx({ hasOrg: false }) as never);
    const html = renderToStaticMarkup(await HomePage());
    expect(html).toContain(OVERVIEW.noOrg);
    expect(html).not.toContain("data-overview-pulse");
  });
});
