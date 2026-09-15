import { readFileSync } from "node:fs";
import { renderServerMarkup } from "@/lib/render-server-markup";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_EXPLORE_PEOPLE_LIMIT } from "@/lib/social-home-bounds";
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
    const html = await renderServerMarkup(
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

  it("names the Explore search bound when either side overflows", async () => {
    const people = Array.from({ length: SOCIAL_EXPLORE_PEOPLE_LIMIT + 1 }, (_, i) => ({
      id: `p${i}`,
      handle: `h${i}`,
      display_name: `Name ${i}`,
    }));
    const peopleChain: Record<string, unknown> = {};
    const postsChain: Record<string, unknown> = {};
    const self = (chain: Record<string, unknown>) => () => chain;
    for (const chain of [peopleChain, postsChain]) {
      chain.select = vi.fn(self(chain));
      chain.eq = vi.fn(self(chain));
      chain.is = vi.fn(self(chain));
      chain.or = vi.fn(self(chain));
      chain.ilike = vi.fn(self(chain));
    }
    peopleChain.range = vi.fn(async () => ({ data: people, error: null }));
    postsChain.range = vi.fn(async () => ({ data: [], error: null }));
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => (table === "profiles" ? peopleChain : postsChain)),
    } as never);

    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({ q: "ada" }) }),
    );
    expect(html).toContain("data-social-explore-truncated");
    expect(html).toContain(SOCIAL.explore.truncated);
    expect(html).toContain("Name 0");
    expect(html).not.toContain(`Name ${SOCIAL_EXPLORE_PEOPLE_LIMIT}`);
  });
});
