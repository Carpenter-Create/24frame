import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DASHBOARD_NEWS_HISTORY_LIST_CLASS } from "@/lib/dashboard-craft";
import { NEWS_PAGE } from "@/lib/news";
import { loadNewsHistory } from "@/lib/news-load";
import { getOrgContext } from "@/lib/supabase/context";
import NewsPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/news-load", () => ({
  loadNewsHistory: vi.fn(),
}));

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com" },
    rows: [{ role: "account_owner", organizations: { id: "org-1", name: "Meridian", status: "active" } }],
    orgs: [{ id: "org-1", name: "Meridian" }],
    activeOrg: { id: "org-1", name: "Meridian", status: "active" },
    activeRole: "account_owner",
    canOperate: true,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

const ITEM = {
  id: "n1",
  title: "Harbor Cut lands a festival slot",
  url: "https://variety.com/harbor-cut",
  source: "variety" as const,
  published_at: "2026-09-17T12:00:00.000Z",
  image_url: null,
};

describe("NewsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the 30-day history with the same card and no summary", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(loadNewsHistory).mockResolvedValue({
      rows: [ITEM],
      truncated: false,
      failed: false,
    });

    const html = renderToStaticMarkup(await NewsPage());
    expect(html).toContain("data-news-history");
    expect(html).toContain(NEWS_PAGE.title);
    expect(html).toContain(NEWS_PAGE.subtitle);
    expect(html).toContain("Harbor Cut lands a festival slot");
    expect(html).toContain("https://variety.com/harbor-cut");
    expect(html).toContain("Variety");
    expect(html).toContain(DASHBOARD_NEWS_HISTORY_LIST_CLASS);
    expect(html).toContain("flex flex-col");
    expect(html.indexOf("data-news-thumb")).toBeLessThan(html.indexOf("Harbor Cut lands a festival slot"));
    expect(html).not.toMatch(/summary|rewrite|republish/i);
    expect(html).not.toContain(NEWS_PAGE.viewAll);
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(NewsPage()).rejects.toThrow("REDIRECT:/login");
  });
});
