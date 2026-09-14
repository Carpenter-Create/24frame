import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_FOLLOWEES_LIMIT,
  SOCIAL_FOLLOWING_WALL_LIMIT,
  SOCIAL_STORIES_RAIL_LIMIT,
  encodeFollowingWallCursor,
} from "@/lib/social-home-bounds";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import SocialHomePage from "./page";

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
vi.mock("@/lib/s3-social-media", () => ({
  signedSocialMediaItems: vi.fn().mockResolvedValue([]),
  signedSocialMediaByPostId: vi.fn().mockResolvedValue(new Map()),
}));
vi.mock("@/lib/social-profile", () => ({
  ensureOwnSocialProfile: vi.fn(),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  createSocialProfile: vi.fn(),
  createSocialPost: vi.fn(),
  presignSocialMediaUpload: vi.fn(),
  toggleSocialLike: vi.fn(),
  createSocialGroup: vi.fn(),
  joinSocialGroup: vi.fn(),
  openSocialDm: vi.fn(),
  sendSocialDm: vi.fn(),
  addSocialDmPeople: vi.fn(),
  setSocialDmTitle: vi.fn(),
  markSocialDmRead: vi.fn(),
}));

function ctx({ hasOrg = false }: { hasOrg?: boolean } = {}) {
  const org = hasOrg ? { id: "org-1", name: "Acme", status: "active" } : null;
  return {
    user: { id: "u1", email: "ada@example.com" },
    rows: org ? [{ role: "account_owner", organizations: org }] : [],
    orgs: org ? [{ id: org.id, name: org.name }] : [],
    activeOrg: org,
    activeRole: org ? "account_owner" : null,
    canOperate: !!org,
    isGcStaff: false,
    unread: Promise.resolve(0),
  };
}

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.eq = vi.fn(self);
  c.in = vi.fn(self);
  c.is = vi.fn(self);
  c.gt = vi.fn(self);
  c.or = vi.fn(self);
  c.ilike = vi.fn(self);
  c.order = vi.fn(self);
  c.range = vi.fn(async () => ({ data: result, error: null }));
  c.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(result) ? (result[0] ?? null) : result,
    error: null,
  }));
  c.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: result, error: null }).then(resolve);
  return c;
}

async function renderHome(topic?: string) {
  return renderToStaticMarkup(
    await SocialHomePage({
      searchParams: Promise.resolve(topic ? { topic } : {}),
    }),
  );
}

function stubClient({
  profile = null,
  posts = [],
  follows = [],
  stories = [],
}: {
  profile?: { id: string; handle: string; display_name: string; status: string; bio?: string | null } | null;
  posts?: {
    id: string;
    body: string;
    author_id: string;
    group_id: string | null;
    like_count: number;
    created_at: string;
    media?: unknown;
    category?: string | null;
  }[];
  follows?: { followee_id: string }[];
  stories?: {
    id: string;
    author_id: string;
    body: string | null;
    media: unknown;
    expires_at: string;
    created_at: string;
  }[];
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === "profiles") return chain(profile ? [profile] : []);
    if (table === "posts") return chain(posts);
    if (table === "groups") return chain([]);
    if (table === "likes") return chain([]);
    if (table === "follows") return chain(follows);
    if (table === "stories") return chain(stories);
    if (table === "story_views") return chain([]);
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from, rpc: vi.fn() } as never);
  return { from };
}

const ensured = {
  id: "u1",
  handle: "ada",
  display_name: "Ada Lovelace",
  status: "active",
  bio: null,
};

describe("Social home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signedAvatarUrls).mockResolvedValue(new Map());
    vi.mocked(signedSocialMediaByPostId).mockResolvedValue(new Map());
    vi.mocked(ensureOwnSocialProfile).mockResolvedValue(ensured);
  });

  it("renders for a signed-in user without an org", async () => {
    stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx({ hasOrg: false }) as never);

    const html = await renderHome();
    expect(html).toContain("data-social-home");
    expect(html).toContain(SOCIAL.home.title);
    expect(html).toContain("24Frame");
    expect(html).toContain("data-social-checklist");
    expect(html).toContain("data-social-lenses");
    expect(html).toContain("data-social-stories");
    expect(html).toContain("data-social-following-empty");
    expect(html).toContain("Cinematography");
    expect(html).toContain("Music");
    expect(html).not.toContain("data-social-need-profile");
    expect(html).not.toContain("Cinematographers");
    expect(html).not.toContain("Composers");
    expect(html).not.toContain("data-social-post-form");
    expect(html).not.toContain("Globee");
    expect(html).not.toContain(ASK_GLOBEE.headline);
  });

  it("shows the checklist once the ensure path has a profile", async () => {
    const { from } = stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderHome();
    expect(ensureOwnSocialProfile).toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("stories");
    expect(html).toContain("data-social-checklist");
    expect(html).toContain("data-social-story-create");
    expect(html).not.toContain("data-social-need-profile");
    expect(html).not.toContain("data-social-post-form");
  });

  it("shows a signed author face on a feed post", async () => {
    stubClient({
      profile: { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
      posts: [
        {
          id: "p1",
          body: "hello",
          author_id: "u1",
          group_id: null,
          like_count: 0,
          created_at: "2026-09-12T14:00:00.000Z",
        },
      ],
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(signedAvatarUrls).mockResolvedValue(
      new Map([["u1", "https://s3.example/signed-avatar"]]),
    );

    const html = await renderHome();
    expect(html).toContain('data-social-post="p1"');
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).toContain("data-social-checklist");
    expect(html).not.toContain("AL");
    expect(html).not.toContain("data-social-avatar-ring");
  });

  it("renders signed post media from posts.media keys", async () => {
    stubClient({
      profile: { id: "u1", handle: "ada", display_name: "Ada Lovelace", status: "active" },
      posts: [
        {
          id: "p1",
          body: "hello",
          author_id: "u1",
          group_id: null,
          like_count: 0,
          created_at: "2026-09-12T14:00:00.000Z",
          media: [{ kind: "image", key: "posts/u1/a.jpg", contentType: "image/jpeg" }],
        },
      ],
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(signedSocialMediaByPostId).mockResolvedValue(
      new Map([
        [
          "p1",
          [{ kind: "image", url: "https://cf.example/signed-image", contentType: "image/jpeg" }],
        ],
      ]),
    );

    const html = await renderHome();
    expect(html).toContain("data-social-post-image");
    expect(html).toContain('src="https://cf.example/signed-image"');
  });

  it("sends an unauthenticated visitor to login", async () => {
    stubClient();
    vi.mocked(getOrgContext).mockResolvedValue(null as never);
    await expect(SocialHomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT:/login");
  });

  it("exposes followee, story, and wall truncation instead of a silent max", async () => {
    const follows = Array.from({ length: SOCIAL_FOLLOWEES_LIMIT + 1 }, (_, i) => ({
      followee_id: `u${i + 2}`,
    }));
    const posts = Array.from({ length: SOCIAL_FOLLOWING_WALL_LIMIT + 1 }, (_, i) => ({
      id: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
      body: `hello ${i}`,
      author_id: "u1",
      group_id: null,
      like_count: 0,
      created_at: `2026-09-14T12:00:${String(i).padStart(2, "0")}.000Z`,
    }));
    const stories = Array.from({ length: SOCIAL_STORIES_RAIL_LIMIT + 1 }, (_, i) => ({
      id: `s${i}`,
      author_id: "u1",
      body: null,
      media: [],
      expires_at: "2099-01-01T00:00:00.000Z",
      created_at: "2026-09-14T12:00:00.000Z",
    }));
    stubClient({ profile: ensured, posts, follows, stories });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderHome();
    expect(html).toContain("data-social-followees-truncated");
    expect(html).toContain(SOCIAL.home.truncatedFollowees);
    expect(html).toContain("data-social-stories-truncated");
    expect(html).toContain(SOCIAL.home.truncatedStories);
    expect(html).toContain("data-social-wall-truncated");
    expect(html).toContain(SOCIAL.home.truncatedWall);
    expect(html).toContain("data-social-wall-older");
    expect(html).toContain(SOCIAL.home.olderPosts);
    const lastKept = posts[SOCIAL_FOLLOWING_WALL_LIMIT - 1]!;
    expect(html).toContain(encodeFollowingWallCursor(lastKept));
    expect(html).toContain(`data-social-post="${posts[0]!.id}"`);
    expect(html).not.toContain(`data-social-post="${posts[SOCIAL_FOLLOWING_WALL_LIMIT]!.id}"`);
  });
});

describe("messages clash lock", () => {
  it("does not steal /messages for DMs", () => {
    const home = readFileSync("src/app/(app)/social/page.tsx", "utf8");
    const dms = readFileSync("src/app/(app)/social/dms/page.tsx", "utf8");
    const messages = readFileSync("src/app/(app)/messages/page.tsx", "utf8");
    expect(home).not.toContain('"/messages"');
    expect(dms).toContain("get_dm_inbox");
    expect(messages).toContain("AskGlobeeLanding");
    expect(messages).not.toContain("get_dm_inbox");
    expect(messages).not.toContain("open_or_get_direct_conversation");
  });
});
