import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderServerMarkup } from "@/lib/render-server-markup";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_EXPLORE_POSTS_LIMIT } from "@/lib/social-home-bounds";
import SocialExplorePage from "./page";

vi.mock("next/image", () => ({
  default: ({
    src,
    className,
  }: {
    src: string;
    className?: string;
  }) => createElement("img", { src, className, alt: "" }),
}));
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

describe("Social Explore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stub();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("is a media discovery shell without Home lenses or a people hub", async () => {
    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({}) }),
    );
    const src = readFileSync("src/app/(app)/social/explore/page.tsx", "utf8");
    expect(html).toContain("data-social-explore");
    expect(html).toContain(SOCIAL.explore.title);
    expect(html).toContain(SOCIAL.explore.empty);
    expect(html).toContain("data-social-explore-search");
    expect(html).toContain("data-social-explore-trending");
    expect(html).toContain(SOCIAL.explore.searchPlaceholder);
    expect(html).not.toContain("data-social-lenses");
    expect(html).not.toContain("Cinematography");
    expect(html).not.toContain("data-social-feed");
    expect(html).not.toContain("data-social-for-you-people");
    expect(html).not.toContain(SOCIAL.forYou.people);
    expect(html).not.toContain(SOCIAL.search.people);
    expect(src).not.toContain("SocialLensRow");
    expect(src).not.toContain("SocialSuggestedPeople");
    expect(src).not.toContain("loadSuggestedPeople");
    expect(src).not.toContain("loadPeopleSearch");
    expect(src).toContain("loadExploreMedia");
    expect(src).toContain("SocialExploreResultsSkeleton");
    expect(src).not.toContain("fallback={<SocialExploreSkeleton");
  });

  it("sends an unauthenticated visitor to login", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SocialExplorePage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      "REDIRECT:/login",
    );
  });

  it("names the Explore media search bound when posts overflow", async () => {
    const posts = Array.from({ length: SOCIAL_EXPLORE_POSTS_LIMIT + 1 }, (_, i) => ({
      id: `x${i}`,
      body: `Clip ${i}`,
      author_id: "u1",
    }));
    const postsChain: Record<string, unknown> = {};
    const self = () => postsChain;
    postsChain.select = vi.fn(self);
    postsChain.eq = vi.fn(self);
    postsChain.is = vi.fn(self);
    postsChain.or = vi.fn(self);
    postsChain.ilike = vi.fn(self);
    postsChain.order = vi.fn(self);
    postsChain.in = vi.fn(self);
    postsChain.range = vi.fn(async () => ({ data: posts, error: null }));
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") throw new Error("Explore must not search people");
        return postsChain;
      }),
    } as never);

    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({ q: "ada" }) }),
    );
    expect(html).toContain("data-social-explore-truncated");
    expect(html).toContain(SOCIAL.explore.truncated);
    expect(html).toContain("Clip 0");
    expect(html).not.toContain(`Clip ${SOCIAL_EXPLORE_POSTS_LIMIT}`);
    expect(html).not.toContain("data-social-for-you-people");
  });

  it("renders a media grid from post stills and clips, not people rows", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const object = "22222222-2222-4222-8222-222222222222";
    const posts = [
      {
        id: "m1",
        body: "Night still",
        author_id: author,
        media: [
          {
            kind: "image",
            key: `posts/${author}/${object}.jpg`,
            contentType: "image/jpeg",
          },
        ],
      },
    ];
    const postsChain: Record<string, unknown> = {};
    const self = () => postsChain;
    postsChain.select = vi.fn(self);
    postsChain.eq = vi.fn(self);
    postsChain.is = vi.fn(self);
    postsChain.or = vi.fn(self);
    postsChain.ilike = vi.fn(self);
    postsChain.order = vi.fn(self);
    postsChain.in = vi.fn(self);
    postsChain.range = vi.fn(async () => ({ data: posts, error: null }));
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "profiles") throw new Error("Explore must not search people");
        return postsChain;
      }),
    } as never);

    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("data-social-explore-grid");
    expect(html).toContain("data-social-explore-tile");
    expect(html).toContain("data-social-explore-image");
    expect(html).toContain("aspect-square");
    expect(html).not.toContain("Night still");
    expect(html).not.toContain(SOCIAL.home.photoKind);
    expect(html).not.toContain("data-social-profile-play");
    expect(html).not.toContain("data-social-for-you-people");
    expect(html).not.toContain("data-social-person-row");
  });
});
