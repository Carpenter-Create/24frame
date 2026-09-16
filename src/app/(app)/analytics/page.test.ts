import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { ANALYTICS_PAGE } from "@/lib/analytics";
import AnalyticsPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));

describe("AnalyticsPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the named shell and does not invent money", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      user: { id: "u1", email: "someone@example.com" },
      rows: [],
      orgs: [],
      activeOrg: { id: "org-1", name: "Acme", status: "active" },
      activeRole: "account_owner",
      canOperate: true,
      isGcStaff: false,
      unread: Promise.resolve(0),
    } as never);

    const html = renderToStaticMarkup(await AnalyticsPage());
    expect(html).toContain(ANALYTICS_PAGE.title);
    expect(html).toContain(ANALYTICS_PAGE.subtitle);
    expect(html).toContain(ANALYTICS_PAGE.empty);
    expect(html).toContain("data-house-empty");
    expect(html).not.toContain("Revenue");
    expect(html).not.toContain("$");
    expect(html).not.toContain("threshold");
    expect(html).not.toContain("Client share");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(AnalyticsPage()).rejects.toThrow("REDIRECT:/login");
  });
});
