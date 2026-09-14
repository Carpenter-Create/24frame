import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import SocialExplorePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function ctx() {
  return {
    user: { id: "u1", email: "ada@example.com" },
    rows: [],
    orgs: [],
    activeOrg: null,
    activeRole: null,
    canOperate: false,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

function stub() {
  const chain: Record<string, unknown> = {};
  const self = () => chain;
  chain.select = vi.fn(self);
  chain.eq = vi.fn(self);
  chain.is = vi.fn(self);
  chain.or = vi.fn(self);
  chain.ilike = vi.fn(self);
  chain.range = vi.fn(async () => ({ data: [], error: null }));
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never);
}

describe("Social Explore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stub();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("is a trending and search shell without Home lenses", async () => {
    const html = renderToStaticMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("data-social-explore");
    expect(html).toContain(SOCIAL.explore.title);
    expect(html).toContain(SOCIAL.explore.empty);
    expect(html).toContain("data-social-explore-search");
    expect(html).toContain("data-social-explore-trending");
    expect(html).not.toContain("data-social-lenses");
    expect(html).not.toContain("Cinematography");
    expect(html).not.toContain("data-social-feed");
    expect(readFileSync("src/app/(app)/social/explore/page.tsx", "utf8")).not.toContain("SocialLensRow");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SocialExplorePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login",
    );
  });
});
