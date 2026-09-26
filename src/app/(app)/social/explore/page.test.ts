import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderServerMarkup } from "@/lib/render-server-markup";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mintSocialMuxPlaybackTokens } from "@/lib/social-mux-server";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL, socialPostHref } from "@/lib/social";
import {
  SOCIAL_EXPLORE_SEARCH_RATE,
  assertExploreSearchAllowed,
  resetExploreSearchRateForTests,
} from "@/lib/social-explore-search-rate-limit";
import {
  SOCIAL_EXPLORE_CELL_CLASS,
  SOCIAL_EXPLORE_CELL_MEDIA_CLASS,
  SOCIAL_EXPLORE_CHROME_CLASS,
  SOCIAL_EXPLORE_GRID_CLASS,
  SOCIAL_EXPLORE_PAGE_CLASS,
} from "@/lib/social-chrome";
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
vi.mock("@/lib/s3-education", () => ({
  signedEducationCoverUrls: vi.fn(async () => new Map()),
}));
vi.mock("@/lib/social-mux-server", () => ({
  mintSocialMuxPlaybackTokens: vi.fn(async () => ({
    playback: "play.jwt",
    thumbnail: "thumb.jwt",
    storyboard: "board.jwt",
  })),
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

function emptyQuery() {
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
  return chain;
}

function stub() {
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => emptyQuery()) } as never);
}

describe("Social Explore", () => {
  beforeEach(() => {
    resetExploreSearchRateForTests();
    vi.clearAllMocks();
    stub();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(mintSocialMuxPlaybackTokens).mockResolvedValue({
      playback: "play.jwt",
      thumbnail: "thumb.jwt",
      storyboard: "board.jwt",
    });
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
    expect(html).toContain("px-[var(--space-4)]");
    expect(html).toContain("bg-[#FAFAFB]");
    expect(html).toContain("lg:max-w-[720px]");
    expect(html).not.toContain("data-social-lenses");
    expect(html).not.toContain("Cinematography");
    expect(html).not.toContain("data-social-feed");
    expect(html).not.toContain("data-social-for-you");
    expect(html).not.toContain(SOCIAL.forYou.title);
    expect(html).not.toContain("lg:max-w-[1052px]");
    expect(html).not.toContain("gap-[32px]");
    expect(html).not.toContain("lg:max-w-[600px]");
    expect(html).not.toContain("lg:max-w-[932px]");
    expect(html).not.toContain("w-[300px]");
    expect(html).not.toContain("892");
    expect(html).not.toContain("data-social-for-you-people");
    expect(html).not.toContain(SOCIAL.forYou.people);
    expect(html).not.toContain(SOCIAL.search.people);
    expect(src).not.toContain("SocialDesktopForYouSlot");
    expect(src).not.toContain("SOCIAL_HOME_LAYOUT_CLASS");
    expect(src).toContain("SOCIAL_HOME_CENTER_CLASS");
    expect(src).toContain("SOCIAL_EXPLORE_GRID_CLASS");
    expect(src).toContain("SOCIAL_MOBILE_BLEED_CLASS");
    expect(src).not.toContain("SocialForYouRail");
    expect(src).not.toContain('from "@/components/social/social-for-you-covers"');
    expect(src).not.toContain("signSocialForYouCourseCovers");
    expect(src).toContain('export const runtime = "nodejs"');
    expect(src).not.toContain("SocialStoryMuxThumb");
    expect(src).not.toContain("@/lib/social-mux-server");
    expect(src).toContain("signExploreMuxPosterUrls");
    expect(src).toContain("assertExploreSearchAllowed");
    const hitsFn = src.slice(src.indexOf("function SocialExploreHits"));
    const mediaFn = src.slice(src.indexOf("function SocialExploreMedia"), src.indexOf("function SocialExploreHits"));
    expect(mediaFn).not.toContain("assertExploreSearchAllowed");
    expect(hitsFn.indexOf("assertExploreSearchAllowed")).toBeGreaterThan(-1);
    expect(hitsFn.indexOf("assertExploreSearchAllowed")).toBeLessThan(hitsFn.indexOf("loadExploreSearch"));
    expect(src).not.toContain("SocialLensRow");
    expect(src).not.toContain("SocialSuggestedPeople");
    expect(src).not.toContain("loadSuggestedPeople");
    expect(src).not.toContain("loadPeopleSearch");
    expect(src).toContain("loadExploreMedia");
    expect(src).toContain("loadExploreSearch");
    expect(src).toContain("SocialExploreGridSkeleton");
    expect(src).not.toContain("fallback={<SocialExploreSkeleton");
    expect(src).not.toContain("<SocialPostCard");
    expect(src).not.toContain("data-social-post-actions");
    expect(src).toContain("socialPostHref");
    expect(SOCIAL_EXPLORE_GRID_CLASS).toBe("grid grid-cols-3 gap-[2px] lg:grid-cols-4");
    expect(SOCIAL_EXPLORE_CELL_CLASS).toContain("aspect-square");
    expect(SOCIAL_EXPLORE_CELL_MEDIA_CLASS).toContain("object-cover");
    expect(SOCIAL_EXPLORE_CHROME_CLASS).toBe("px-[var(--space-4)]");
    expect(SOCIAL_EXPLORE_PAGE_CLASS).toContain("bg-[#FAFAFB]");
    expect(SOCIAL_EXPLORE_PAGE_CLASS).not.toContain("rounded-");
    expect(SOCIAL_EXPLORE_GRID_CLASS).not.toContain("bg-surface ");
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
        if (table === "posts") return postsChain;
        return emptyQuery();
      }),
    } as never);

    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({ q: "ada" }) }),
    );
    expect(html).toContain("data-social-explore-truncated");
    expect(html).toContain(SOCIAL.explore.truncated);
    expect(html).toContain(SOCIAL.explore.noResults);
    expect(html).not.toContain("Clip 0");
    expect(html).not.toContain(`Clip ${SOCIAL_EXPLORE_POSTS_LIMIT}`);
    expect(html).not.toContain("data-social-explore-grid");
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
        if (table === "posts") return postsChain;
        return emptyQuery();
      }),
    } as never);

    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("data-social-explore-grid");
    expect(html).toContain("grid-cols-3");
    expect(html).toContain("lg:grid-cols-4");
    expect(html).toContain("gap-[2px]");
    expect(html).toContain("data-social-explore-tile");
    expect(html).toContain("data-social-explore-image");
    expect(html).toContain("aspect-square");
    expect(html).toContain("object-cover");
    expect(html).toContain(`href="${socialPostHref("m1")}"`);
    expect(html).not.toContain("Night still");
    expect(html).not.toContain(SOCIAL.home.photoKind);
    expect(html).not.toContain("data-social-profile-play");
    expect(html).not.toContain("data-social-explore-stack");
    expect(html).not.toContain("data-social-for-you-people");
    expect(html).not.toContain("data-social-person-row");
    expect(html).not.toContain("data-social-post-actions");
  });

  it("paints a Mux poster and a stack cue, and clears search back to trending", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const still = "22222222-2222-4222-8222-222222222222";
    const clip = "33333333-3333-4333-8333-333333333333";
    const playbackId = "uNbxnGLKJ00yfbijDO8COxT";
    const posts = [
      {
        id: "m-stack",
        body: "Two stills",
        author_id: author,
        media: [
          { kind: "image", key: `posts/${author}/${still}.jpg`, contentType: "image/jpeg" },
          { kind: "image", key: `posts/${author}/${clip}.jpg`, contentType: "image/jpeg" },
        ],
      },
      {
        id: "m-video",
        body: "Night clip",
        author_id: author,
        media: [
          {
            kind: "video",
            key: `posts/${author}/${clip}.mp4`,
            contentType: "video/mp4",
            provider: "mux",
            playbackId,
            playbackPolicy: "public",
          },
        ],
      },
      {
        id: "m-text",
        body: "Words only",
        author_id: author,
        media: [],
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
        if (table === "posts") return postsChain;
        return emptyQuery();
      }),
    } as never);

    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({ q: "night" }) }),
    );

    expect(html).toContain("data-social-explore-query");
    expect(html).toContain("data-social-explore-grid");
    expect(html).toContain("data-social-explore-stack");
    expect(html).toContain('data-social-icon="stack"');
    expect(html).toContain("data-social-explore-video");
    expect(html).toContain(`https://image.mux.com/${playbackId}/thumbnail.webp`);
    expect(html).not.toContain("?token=");
    expect(html).not.toContain("data-social-story-mux-thumb");
    expect(mintSocialMuxPlaybackTokens).not.toHaveBeenCalled();
    expect(html).toContain(`href="${socialPostHref("m-stack")}"`);
    expect(html).toContain(`href="${socialPostHref("m-video")}"`);
    expect(html).toContain('data-social-explore-clear=""');
    expect(html).toContain('href="/social/explore"');
    expect(html).not.toContain("Two stills");
    expect(html).not.toContain("Night clip");
    expect(html).not.toContain("Words only");
    expect(html).not.toContain("<video");
    expect(html).not.toContain("data-social-profile-play");
    expect(html).not.toContain("squares-four");
    expect(html).not.toContain("data-social-explore-trending");
  });

  it("refuses Explore search once the per-user meter is full", async () => {
    for (let i = 0; i < SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute; i += 1) {
      await assertExploreSearchAllowed("u1");
    }
    const from = vi.fn(() => emptyQuery());
    vi.mocked(createClient).mockResolvedValue({ from } as never);
    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({ q: "ada" }) }),
    );
    expect(html).toContain("data-social-explore-rate-limited");
    expect(html).toContain("data-social-explore-query");
    expect(html).toContain(SOCIAL.explore.rateLimited);
    expect(html).not.toContain("data-social-explore-grid");
    expect(from).not.toHaveBeenCalled();
    expect(mintSocialMuxPlaybackTokens).not.toHaveBeenCalled();
  });

  it("still loads trending after the search meter is full", async () => {
    for (let i = 0; i < SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute; i += 1) {
      await assertExploreSearchAllowed("u1");
    }
    const from = vi.fn(() => emptyQuery());
    vi.mocked(createClient).mockResolvedValue({ from } as never);
    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("data-social-explore-trending");
    expect(html).not.toContain("data-social-explore-rate-limited");
    expect(from).toHaveBeenCalled();
  });

  it("paints a server-signed Mux poster for a signed cover", async () => {
    const author = "11111111-1111-4111-8111-111111111111";
    const clip = "33333333-3333-4333-8333-333333333333";
    const playbackId = "uNbxnGLKJ00yfbijDO8COxT";
    const posts = [
      {
        id: "m-signed",
        body: "Signed clip",
        author_id: author,
        media: [
          {
            kind: "video",
            key: `posts/${author}/${clip}.mp4`,
            contentType: "video/mp4",
            provider: "mux",
            playbackId,
            playbackPolicy: "signed",
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
        if (table === "posts") return postsChain;
        return emptyQuery();
      }),
    } as never);

    const html = await renderServerMarkup(
      await SocialExplorePage({ searchParams: Promise.resolve({}) }),
    );
    expect(html).toContain("data-social-explore-video");
    expect(html).toContain(`https://image.mux.com/${playbackId}/thumbnail.webp?token=thumb.jwt`);
    expect(html).not.toContain("data-social-story-mux-thumb");
    expect(html).not.toContain("<video");
    expect(html).not.toContain("Signed clip");
    expect(mintSocialMuxPlaybackTokens).toHaveBeenCalledTimes(1);
    expect(mintSocialMuxPlaybackTokens).toHaveBeenCalledWith(playbackId);
  });
});
