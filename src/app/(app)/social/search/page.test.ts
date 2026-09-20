import { readFileSync } from "node:fs";
import { renderServerMarkup } from "@/lib/render-server-markup";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL, SOCIAL_SEARCH_PEOPLE_INTENT, socialSearchHref } from "@/lib/social";
import { SOCIAL_EXPLORE_PEOPLE_LIMIT } from "@/lib/social-home-bounds";
import SocialSearchPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/s3-avatars", () => ({
  signedAvatarUrl: vi.fn().mockResolvedValue(null),
  signedAvatarUrls: vi.fn().mockResolvedValue(new Map()),
}));
vi.mock("@/lib/social-profile", () => ({
  ensureOwnSocialProfile: vi.fn().mockResolvedValue({
    id: "u1",
    handle: "ada",
    display_name: "Ada Lovelace",
    status: "active",
    crafts: [],
  }),
}));

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
  chain.order = vi.fn(self);
  chain.in = vi.fn(self);
  chain.range = vi.fn(async () => ({ data: [], error: null }));
  chain.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => chain) } as never);
}

describe("Social Search people discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stub();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("is a people-intent surface with suggested people, not Explore", async () => {
    const html = await renderServerMarkup(
      await SocialSearchPage({ searchParams: Promise.resolve({ intent: SOCIAL_SEARCH_PEOPLE_INTENT }) }),
    );
    expect(html).toContain("data-social-search");
    expect(html).toContain(`data-social-search-intent="${SOCIAL_SEARCH_PEOPLE_INTENT}"`);
    expect(html).toContain(SOCIAL.search.title);
    expect(html).toContain(SOCIAL.search.subtitle);
    expect(html).toContain("data-social-search-people");
    expect(html).toContain("data-social-search-suggested");
    expect(html).toContain(SOCIAL.search.empty);
    expect(html).toContain(SOCIAL.search.searchPlaceholder);
    expect(html).not.toContain("data-social-explore");
    expect(html).not.toContain(SOCIAL.explore.searchPlaceholder);
    expect(socialSearchHref({ intent: "people" })).toBe("/social/search?intent=people");
    expect(readFileSync("src/app/(app)/social/search/page.tsx", "utf8")).toContain("SocialSuggestedPeople");
    expect(readFileSync("src/app/(app)/social/search/page.tsx", "utf8")).toContain("loadSuggestedPeople");
    expect(readFileSync("src/app/(app)/social/search/page.tsx", "utf8")).toContain("loadPeopleSearch");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(
      SocialSearchPage({ searchParams: Promise.resolve({ intent: "people" }) }),
    ).rejects.toThrow("REDIRECT:/login");
  });

  it("names the people-search bound when results overflow", async () => {
    const people = Array.from({ length: SOCIAL_EXPLORE_PEOPLE_LIMIT + 1 }, (_, i) => ({
      id: `p${i}`,
      handle: `h${i}`,
      display_name: `Name ${i}`,
    }));
    const peopleChain: Record<string, unknown> = {};
    const self = () => peopleChain;
    peopleChain.select = vi.fn(self);
    peopleChain.eq = vi.fn(self);
    peopleChain.is = vi.fn(self);
    peopleChain.or = vi.fn(self);
    peopleChain.ilike = vi.fn(self);
    peopleChain.order = vi.fn(self);
    peopleChain.in = vi.fn(self);
    peopleChain.range = vi.fn(async () => ({ data: people, error: null }));
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "posts") throw new Error("People search page must not load posts");
        return peopleChain;
      }),
    } as never);

    const html = await renderServerMarkup(
      await SocialSearchPage({ searchParams: Promise.resolve({ intent: "people", q: "ada" }) }),
    );
    expect(html).toContain("data-social-search-truncated");
    expect(html).toContain(SOCIAL.search.truncated);
    expect(html).toContain("Name 0");
    expect(html).not.toContain(`Name ${SOCIAL_EXPLORE_PEOPLE_LIMIT}`);
  });
});
