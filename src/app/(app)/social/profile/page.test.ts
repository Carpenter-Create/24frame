import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { SOCIAL, SOCIAL_PROFILE_POSTS_PAGE } from "@/lib/social";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import SocialProfilePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn() }),
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
  ensureOwnSocialProfileResult: vi.fn(),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  createSocialProfile: vi.fn(),
  updateSocialBio: vi.fn(),
  toggleSocialLike: vi.fn(),
}));
vi.mock("@/app/(app)/account/actions", () => ({
  uploadAccountPhoto: vi.fn(),
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

function chain(result: unknown) {
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.eq = vi.fn(self);
  c.in = vi.fn(self);
  c.is = vi.fn(self);
  c.gt = vi.fn(self);
  c.order = vi.fn(self);
  c.range = vi.fn(async () => ({ data: result, error: null }));
  c.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(result) ? (result[0] ?? null) : result,
    error: null,
  }));
  c.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({
      data: result,
      error: null,
      count: Array.isArray(result) ? result.length : 0,
    }).then(resolve);
  return c;
}

function stubClient({
  profile = null,
  posts = [],
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
  }[];
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === "profiles") return chain(profile ? [profile] : []);
    if (table === "posts") return chain(posts);
    if (table === "likes") return chain([]);
    if (table === "follows") return chain([]);
    if (table === "stories") return chain([]);
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from };
}

const ensured = {
  id: "u1",
  handle: "ada",
  display_name: "Ada Lovelace",
  status: "active",
  bio: "Writes engines.",
};

describe("Social profile public face", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signedAvatarUrl).mockResolvedValue(null);
    vi.mocked(signedSocialMediaByPostId).mockResolvedValue(new Map());
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: ensured,
      error: null,
    });
  });

  it("shows the handle field after ensure and does not insert on render", async () => {
    const { from } = stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile");
    expect(html).toContain("data-social-profile-form");
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain(SOCIAL.profile.handlePlaceholder);
    expect(html).toContain("https://24frame.co/@ada");
    expect(html).toContain('data-social-share-url="https://24frame.co/@ada"');
    expect(html).toContain("data-social-profile-url");
    expect(html).toContain(">24frame.co/@ada<");
    expect(html).not.toContain("Copies ");
    expect(html).not.toContain("data-social-share-hint");
    expect(html).toContain("@ada");
    expect(html).toContain("data-social-profile-tabs");
    expect(html).toContain(SOCIAL.profile.postsTab);
    expect(html).toContain(SOCIAL.profile.highlightsTab);
    expect(html).toContain(SOCIAL.profile.creditsTab);
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("data-social-for-you");
    expect(html).toContain("data-social-share");
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Reels");
    expect(html).not.toContain("Globee");
    expect(html).not.toContain("app.24frame.co");
    expect(from).not.toHaveBeenCalledWith("memberships");
  });

  it("renders the public face with history and edit affordances", async () => {
    stubClient({
      profile: ensured,
      posts: [
        {
          id: "p1",
          body: "First engine note",
          author_id: "u1",
          group_id: null,
          like_count: 2,
          created_at: "2026-09-13T12:00:00.000Z",
        },
      ],
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile-identity");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("Writes engines.");
    expect(html).toContain("data-social-profile-bio");
    expect(html).toContain("First engine note");
    expect(html).toContain('data-social-post="p1"');
    expect(html).toContain("data-social-author-history");
    expect(html).toContain("data-social-author-posts");
    expect(html).toContain("data-social-profile-form");
    expect(html).toContain("data-social-bio-form");
    expect(html).toContain("data-social-profile-photo");
    expect(html).toContain(SOCIAL.profile.uploadPhoto);
    expect(html).toContain('type="file"');
    expect(html).toContain("AL");
  });

  it("renders the signed account face and uploads through Settings", async () => {
    stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(signedAvatarUrl).mockResolvedValue("https://s3.example/signed-avatar");

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain("AL");
    expect(html).toContain("data-social-profile-photo");
    expect(html).toContain("data-social-profile-form");

    const src = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
    expect(src).toContain("signedAvatarUrl");
    expect(src).toContain("SocialProfilePhotoForm");
    expect(src).toContain("loadAuthorPosts");
    expect(src).not.toContain("putAvatarObject");
    expect(src).not.toContain("uploadAccountPhoto");
    expect(src).not.toContain("S3_AVATARS_BUCKET");
  });

  it("shows an honest empty history when the author has no posts", async () => {
    stubClient({ profile: ensured, posts: [] });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-author-empty");
    expect(html).toContain(SOCIAL.profile.postsEmpty);
    expect(html).toContain(SOCIAL.profile.postsEmptyOwnHint);
    expect(html).toContain(SOCIAL.profile.sharePost);
    expect(html).not.toContain("data-social-author-posts");
    expect(html).not.toContain("data-social-author-truncated");
    expect(html).not.toContain("Sets");
    expect(html).not.toContain("Riley Okonkwo");
  });

  it("names the bound when author history is truncated", async () => {
    const posts = Array.from({ length: SOCIAL_PROFILE_POSTS_PAGE + 1 }, (_, i) => ({
      id: `p${i}`,
      body: `Post ${i}`,
      author_id: "u1",
      group_id: null,
      like_count: 0,
      created_at: "2026-09-13T12:00:00.000Z",
    }));
    stubClient({ profile: ensured, posts });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-author-truncated");
    expect(html).toContain(SOCIAL.profile.postsTruncated);
    expect(html).toContain('data-social-post="p0"');
    expect(html).not.toContain(`data-social-post="p${SOCIAL_PROFILE_POSTS_PAGE}"`);
  });

  it("shows the locked Credits blank empty state and no invented credits", async () => {
    stubClient({
      profile: ensured,
      posts: [
        {
          id: "p1",
          body: "First engine note",
          author_id: "u1",
          group_id: null,
          like_count: 2,
          created_at: "2026-09-13T12:00:00.000Z",
        },
      ],
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(
      await SocialProfilePage({ searchParams: Promise.resolve({ tab: "credits" }) }),
    );
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain('data-social-profile-tab-active=""');
    expect(html).toContain('data-social-icon="film-slate"');
    expect(html).toContain(SOCIAL.profile.creditsEmpty);
    expect(html).not.toContain("First engine note");
    expect(html).not.toContain("data-social-author-history");
    expect(html).not.toContain(SOCIAL.profile.highlightsEmpty);
    expect(html).not.toContain("Analytics");
    expect(html).not.toContain("Your credits will appear");
  });

  it("shows @handle after ensure, not an empty create form", async () => {
    stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("@ada");
    expect(html).toContain("https://24frame.co/@ada");
    expect(html).toContain('value="@ada"');
    expect(html).toContain("Ada Lovelace");
  });

  it("keeps SocialHandleField on the empty create form when ensure fails", async () => {
    stubClient();
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: null,
      error: "null value in column birth_date",
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = renderToStaticMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain('value="@"');
    expect(html).toContain("data-social-handle-url");
    expect(html).toContain("https://24frame.co/@");
    expect(html).toContain(SOCIAL.profile.handlePlaceholder);
    expect(html).toContain("null value in column birth_date");
    expect(html).not.toContain("Ada Lovelace");
    expect(html).not.toContain("data-social-author-history");
  });
});
