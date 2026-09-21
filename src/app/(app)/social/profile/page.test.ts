import { readFileSync } from "node:fs";
import { cookies } from "next/headers";
import { renderServerMarkup } from "@/lib/render-server-markup";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId, signedSocialMediaUrl } from "@/lib/s3-social-media";
import { SOCIAL, SOCIAL_PROFILE_POSTS_PAGE } from "@/lib/social";
import { ensureOwnSocialProfileResult } from "@/lib/social-profile";
import { SOCIAL_PROFILE_OPTIMISTIC_COOKIE } from "@/lib/social-profile-edit";
import SocialProfilePage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => undefined })),
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
  signedSocialMediaUrl: vi.fn().mockResolvedValue(null),
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
  profile?: {
    id: string;
    handle: string;
    display_name: string;
    status: string;
    bio?: string | null;
    welcome_video_key?: string | null;
    crafts?: string[] | null;
    topics?: string[] | null;
    imdb_url?: string | null;
    website_url?: string | null;
  } | null;
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
    vi.mocked(signedSocialMediaUrl).mockResolvedValue(null);
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: ensured,
      error: null,
    });
  });

  it("shows the public face after ensure and does not insert on render", async () => {
    const { from } = stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile");
    expect(html).toContain("https://24frame.co/@ada");
    expect(html).toContain('data-social-share-url="https://24frame.co/@ada"');
    expect(html).not.toContain("data-social-profile-url");
    expect(html).not.toContain("data-social-profile-links");
    expect(html).not.toContain(">24frame.co/@ada<");
    expect(html).not.toContain("Copies ");
    expect(html).not.toContain("data-social-share-hint");
    expect(html).toContain("@ada");
    expect(html).toContain("data-social-profile-tabs");
    expect(html).toContain(SOCIAL.profile.postsTab);
    expect(html).toContain(SOCIAL.profile.highlightsTab);
    expect(html).toContain(SOCIAL.profile.creditsTab);
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain("overflow-x-auto");
    expect(html).not.toContain("data-social-for-you");
    expect(html).not.toContain("data-social-for-you-skeleton");
    expect(html).toContain("mx-auto");
    expect(html).toContain("md:max-w-[892px]");
    expect(html).not.toContain("max-w-[935px]");
    expect(html).not.toContain("lg:max-w-[892px]");
    expect(html).toContain("data-social-share");
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Reels");
    expect(html).not.toContain("Globee");
    expect(html).not.toContain("app.24frame.co");
    expect(from).not.toHaveBeenCalledWith("memberships");
  });

  it("renders the public face with history and the header Edit profile button", async () => {
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

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile-identity");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("Writes engines.");
    expect(html).toContain("data-social-profile-bio");
    expect(html).toContain("First engine note");
    expect(html).toContain('data-social-post="p1"');
    expect(html).toContain("data-social-author-history");
    expect(html).toContain("data-social-author-posts");
    expect(html).toContain(SOCIAL.profile.edit);
    expect(html).toContain('href="/social/profile/edit"');
    expect(html).not.toContain('href="#social-profile-edit"');
    expect(html).not.toContain("id=\"social-profile-edit\"");
    expect(html).not.toContain("<summary");
    expect(html).not.toContain("data-social-profile-form");
    expect(html).not.toContain("data-social-bio-form");
    expect(html).not.toContain("data-social-profile-photo");
    expect(html).not.toContain(SOCIAL.profile.uploadPhoto);
    expect(html).not.toContain('type="file"');
    expect(html).toContain("AL");
  });

  it("renders the signed account face and uploads through Settings", async () => {
    stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(signedAvatarUrl).mockResolvedValue("https://s3.example/signed-avatar");

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("https%3A%2F%2Fs3.example%2Fsigned-avatar");
    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain("AL");
    expect(html).not.toContain("data-social-profile-photo");
    expect(html).not.toContain("data-social-profile-form");

    const src = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
    expect(src).toContain("signedAvatarUrl");
    expect(src).not.toContain("SocialProfilePhotoForm");
    expect(src).toContain("loadAuthorPosts");
    expect(src).not.toContain("putAvatarObject");
    expect(src).not.toContain("uploadAccountPhoto");
    expect(src).not.toContain("S3_AVATARS_BUCKET");
  });

  it("shows an honest empty history when the author has no posts", async () => {
    stubClient({ profile: ensured, posts: [] });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-author-empty");
    expect(html).toContain(SOCIAL.profile.postsEmpty);
    expect(html).toContain(SOCIAL.profile.sharePost);
    expect(html).toContain("/social/create?kind=media");
    const empty = html.slice(html.indexOf("data-social-author-empty"));
    expect(empty).not.toContain(SOCIAL.profile.edit);
    expect(empty).not.toContain(SOCIAL.profile.completeIdentity);
    expect(empty).not.toContain("/social/profile/edit");
    expect(empty).not.toContain(SOCIAL.profile.postsEmptyOwnHint);
    expect(empty).not.toContain("py-[var(--space-12)]");
    expect(html.match(/href="\/social\/profile\/edit"/g)?.length).toBe(1);
    expect(html).not.toContain("data-social-author-posts");
    expect(html).not.toContain("data-social-author-truncated");
    expect(html).not.toContain("Sets");
    expect(html).not.toContain("Riley Okonkwo");
    expect(html).toContain(SOCIAL.profile.edit);
    expect(html).toContain('href="/social/profile/edit"');
    expect(html).not.toContain("id=\"social-profile-edit\"");
    expect(html).not.toContain("<summary");
    expect(html).not.toContain("data-social-welcome-video");
    expect(html).not.toContain("data-social-profile-roles");
    expect(html).not.toContain("data-social-profile-topics");
  });

  it("prints individual Profession pills after bio and omits them when crafts is empty", async () => {
    stubClient({
      profile: { ...ensured, crafts: ["actor", "producer", "screenwriter", "investor"] },
    });
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: { ...ensured, crafts: ["actor", "producer", "screenwriter", "investor"] },
      error: null,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile-roles");
    expect(html).toContain('data-social-profile-role="actor"');
    expect(html).toContain('data-social-profile-role="producer"');
    expect(html).toContain('data-social-profile-role="screenwriter"');
    expect(html).toContain('data-social-profile-role="investor"');
    expect(html).toContain("Actor");
    expect(html).toContain("Investor");
    expect(html).not.toContain("Actor · Producer");
    expect(html).not.toContain("Actor · Producer · Screenwriter +1");
    expect(html).not.toContain("data-social-profile-roles-more");
    expect(html).not.toContain("+1");
    expect(html).toContain("bg-surface-muted");
    expect(html).toContain("data-house-chip-rail");
    expect(html).toContain('data-house-chip-rail-row="0"');
    expect(html).not.toContain('data-house-chip-rail-row="1"');
    const roles = html.slice(
      html.indexOf("data-social-profile-roles"),
      html.indexOf('data-social-profile-role="investor"') + 80,
    );
    expect(roles).toContain("overflow-x-auto");
    expect(roles).toContain("no-scrollbar");
    expect(roles).not.toContain("flex-wrap");
    expect(html).toContain("grid-cols-3");
    expect(html).not.toContain("data-social-profile-handle");
    const head = html.slice(html.indexOf("data-social-profile-head"), html.indexOf("data-social-profile-name"));
    expect(head).toContain("data-social-avatar");
    expect(head).toContain("data-social-profile-stats");
    expect(head).toContain("max-w-xs");
    expect(head).toContain("items-center");
    expect(head).not.toContain("flex min-w-0 flex-1 items-center");
    expect(head).not.toContain("@ada");
    expect(html.indexOf("data-social-profile-stats")).toBeLessThan(html.indexOf("data-social-profile-name"));
    expect(html.indexOf("data-social-profile-name")).toBeLessThan(html.indexOf("data-social-profile-bio"));
    expect(html.indexOf("data-social-profile-bio")).toBeLessThan(html.indexOf("data-social-profile-roles"));
    expect(html).not.toContain("data-social-profile-mutuals");
    expect(html).not.toContain("Roles:");
    expect(html).not.toContain("Professions:");
    expect(html).not.toContain("data-social-profile-imdb");
  });

  it("prints selected Topics chips under identity and omits a Topics prefix", async () => {
    stubClient({
      profile: { ...ensured, topics: ["Acting", "Financing"] },
    });
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: { ...ensured, topics: ["Acting", "Financing"] },
      error: null,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile-topics");
    expect(html).toContain('data-social-profile-topic="Acting"');
    expect(html).toContain("Acting");
    expect(html).not.toContain("Topics:");
    expect(html).not.toContain("Actor");
  });

  it("prints a quiet IMDb name link when the claim is set", async () => {
    stubClient({
      profile: { ...ensured, imdb_url: "https://www.imdb.com/name/nm0000158/" },
    });
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: { ...ensured, imdb_url: "https://www.imdb.com/name/nm0000158/" },
      error: null,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile-imdb");
    expect(html).toContain('href="https://www.imdb.com/name/nm0000158/"');
    expect(html).toContain(SOCIAL.profile.imdb);
    expect(html).not.toContain("Connect to scrape");
    expect(html).not.toContain(">https://www.imdb.com/name/nm0000158/<");
  });

  it("renders Instagram as an icon, not a raw URL, and omits the links row when empty", async () => {
    stubClient({
      profile: { ...ensured, website_url: "https://instagram.com/ada" },
    });
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: { ...ensured, website_url: "https://instagram.com/ada" },
      error: null,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-profile-links");
    expect(html).toContain('data-social-profile-link="instagram"');
    expect(html).toContain('href="https://instagram.com/ada"');
    expect(html).not.toContain(">https://instagram.com/ada<");
    expect(html).toContain('aria-label="Instagram"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("renders the welcome video band only when a signed URL exists", async () => {
    stubClient({
      profile: { ...ensured, welcome_video_key: "posts/u1/welcome.mp4" },
    });
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: { ...ensured, welcome_video_key: "posts/u1/welcome.mp4" },
      error: null,
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(signedSocialMediaUrl).mockResolvedValue("https://s3.example/welcome.mp4");

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-welcome-video");
    expect(html).toContain('src="https://s3.example/welcome.mp4#t=0.1"');
    expect(html.indexOf("data-social-welcome-video")).toBeLessThan(html.indexOf("data-social-profile-tabs") || html.length);
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

    const html = await renderServerMarkup(await SocialProfilePage());
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

    const html = await renderServerMarkup(
      await SocialProfilePage({ searchParams: Promise.resolve({ tab: "credits" }) }),
    );
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain('data-social-profile-tab-active=""');
    expect(html).toContain('data-social-icon="film-slate"');
    expect(html).toContain(SOCIAL.profile.creditsEmpty);
    expect(html).toContain(SOCIAL.profile.creditsEmptyOwnHint);
    expect(html).not.toContain("First engine note");
    expect(html).not.toContain("data-social-author-history");
    expect(html).not.toContain(SOCIAL.profile.highlightsEmpty);
    expect(html).not.toContain("Analytics");
    expect(html).not.toContain("Your credits will appear");
  });

  it("shows @handle after ensure, not an empty create form", async () => {
    stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("@ada");
    expect(html).toContain("https://24frame.co/@ada");
    expect(html).toContain("Ada Lovelace");
    expect(html).not.toContain('value="@ada"');
    expect(html).not.toContain("data-social-handle-field");
  });

  it("keeps SocialHandleField on the empty create form when ensure fails", async () => {
    stubClient();
    vi.mocked(ensureOwnSocialProfileResult).mockResolvedValue({
      profile: null,
      error: "null value in column birth_date",
    });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain('value="@"');
    expect(html).toContain("data-social-handle-url");
    expect(html).toContain("https://24frame.co/@");
    expect(html).toContain(SOCIAL.profile.handlePlaceholder);
    expect(html).toContain("null value in column birth_date");
    expect(html).not.toContain("Ada Lovelace");
    expect(html).not.toContain("data-social-author-history");
  });

  it("paints a Save-hop cookie identity before the server row lands", async () => {
    stubClient({ profile: ensured });
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
    vi.mocked(cookies).mockResolvedValueOnce({
      get: (name: string) =>
        name === SOCIAL_PROFILE_OPTIMISTIC_COOKIE
          ? {
              value: encodeURIComponent(
                JSON.stringify({ handle: "ada", displayName: "Ada Byron" }),
              ),
            }
          : undefined,
    } as never);

    const html = await renderServerMarkup(await SocialProfilePage());
    expect(html).toContain("Ada Byron");
    expect(html).toContain("@ada");
    expect(html).not.toContain("Ada Lovelace");
  });
});
