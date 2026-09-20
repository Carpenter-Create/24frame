import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { signedAvatarUrl } from "@/lib/s3-avatars";
import { signedSocialMediaByPostId } from "@/lib/s3-social-media";
import { SOCIAL } from "@/lib/social";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import SocialPublicProfilePage, { generateMetadata } from "./page";

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
  signedSocialMediaUrl: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/social-profile", () => ({
  ensureOwnSocialProfile: vi.fn(),
  SOCIAL_PROFILE_COLUMNS:
    "id, handle, display_name, status, bio, welcome_video_key, crafts, imdb_url, website_url",
}));
vi.mock("@/app/(app)/social/actions", () => ({
  toggleSocialFollow: vi.fn(),
  openSocialDm: vi.fn(),
  toggleSocialLike: vi.fn(),
}));

function ctx(userId = "u1") {
  return {
    user: { id: userId, email: "ada@example.com" },
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

type PublicProfile = {
  id: string;
  handle: string;
  display_name: string;
  status: string;
  bio: string | null;
  crafts?: string[] | null;
  imdb_url?: string | null;
  website_url?: string | null;
};

const ada: PublicProfile = {
  id: "u2",
  handle: "ada",
  display_name: "Ada Lovelace",
  status: "active",
  bio: "Writes engines.",
};

const viewer: PublicProfile = {
  id: "u1",
  handle: "bob",
  display_name: "Bob One",
  status: "active",
  bio: null,
};

function stubClient({
  member = ada,
  posts = [],
}: {
  member?: PublicProfile | null;
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
    if (table === "profiles") return chain(member ? [member] : []);
    if (table === "posts") return chain(posts);
    if (table === "likes") return chain([]);
    if (table === "follows") return chain([]);
    if (table === "stories") return chain([]);
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from };
}

async function renderPublic(handle = "@ada") {
  return renderToStaticMarkup(
    await SocialPublicProfilePage({ params: Promise.resolve({ handle }) }),
  );
}

describe("Social public profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(signedAvatarUrl).mockResolvedValue(null);
    vi.mocked(signedSocialMediaByPostId).mockResolvedValue(new Map());
    vi.mocked(ensureOwnSocialProfile).mockResolvedValue(viewer);
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("shows that author's posts under the identity header", async () => {
    stubClient({
      posts: [
        {
          id: "p9",
          body: "Public engine note",
          author_id: "u2",
          group_id: null,
          like_count: 1,
          created_at: "2026-09-13T12:00:00.000Z",
        },
      ],
    });

    const html = await renderPublic();
    expect(html).toContain("data-social-member");
    expect(html).toContain("data-social-profile-identity");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("Writes engines.");
    expect(html).toContain("Public engine note");
    expect(html).toContain('data-social-post="p9"');
    expect(html).toContain("data-social-author-history");
    expect(html).toContain("data-social-follow");
    expect(html).toContain("data-social-share");
    expect(html).toContain("data-social-profile-tabs");
    expect(html).toContain(SOCIAL.profile.postsTab);
    expect(html).toContain(SOCIAL.profile.highlightsTab);
    expect(html).toContain(SOCIAL.profile.creditsTab);
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain('data-social-share-url="https://24frame.co/@ada"');
    expect(html).not.toContain("data-social-profile-url");
    expect(html).not.toContain(">24frame.co/@ada<");
    expect(html).not.toContain("Copies ");
    expect(html).not.toContain("data-social-share-hint");
    expect(html).toContain("data-social-for-you");
    expect(html).not.toContain("Education");
    expect(html).not.toContain("data-social-open-dm");
    expect(html).not.toContain("data-social-profile-form");
    expect(html).not.toContain("data-social-bio-form");
    expect(html).not.toContain("data-social-profile-photo");
    expect(html).not.toContain("data-social-profile-roles");
    expect(html).not.toContain("data-social-profile-imdb");
  });

  it("prints the Roles line when crafts are set and omits a Roles prefix", async () => {
    stubClient({
      member: { ...ada, crafts: ["actor", "producer"] },
    });
    const html = await renderPublic();
    expect(html).toContain("data-social-profile-roles");
    expect(html).toContain("Actor · Producer");
    expect(html).not.toContain("Roles:");
  });

  it("prints a quiet IMDb link when the member claim is set", async () => {
    stubClient({
      member: { ...ada, imdb_url: "https://www.imdb.com/name/nm0000158/" },
    });
    const html = await renderPublic();
    expect(html).toContain("data-social-profile-imdb");
    expect(html).toContain('href="https://www.imdb.com/name/nm0000158/"');
    expect(html).not.toContain("Connect to scrape");
  });

  it("renders the same public profile for a bare handle param", async () => {
    stubClient({
      posts: [
        {
          id: "p9",
          body: "Public engine note",
          author_id: "u2",
          group_id: null,
          like_count: 1,
          created_at: "2026-09-13T12:00:00.000Z",
        },
      ],
    });

    const html = await renderPublic("ada");
    expect(html).toContain("data-social-member");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).toContain("Public engine note");
    expect(html).not.toContain(SOCIAL.member.missing);
  });

  it("still accepts an @-decorated route param if one is passed", async () => {
    stubClient();
    const html = await renderPublic("@ada");
    expect(html).toContain("data-social-member");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("@ada");
    expect(html).not.toContain(SOCIAL.member.missing);
  });

  it("shows an honest empty state when that author has no posts", async () => {
    stubClient({ posts: [] });
    const html = await renderPublic();
    expect(html).toContain("data-social-author-empty");
    expect(html).toContain(SOCIAL.profile.postsEmpty);
    expect(html).not.toContain("data-social-author-posts");
  });

  it("shows the locked Credits blank empty state on a public profile", async () => {
    stubClient({
      posts: [
        {
          id: "p9",
          body: "Public engine note",
          author_id: "u2",
          group_id: null,
          like_count: 1,
          created_at: "2026-09-13T12:00:00.000Z",
        },
      ],
    });
    const html = renderToStaticMarkup(
      await SocialPublicProfilePage({
        params: Promise.resolve({ handle: "@ada" }),
        searchParams: Promise.resolve({ tab: "credits" }),
      }),
    );
    expect(html).toContain('data-social-profile-tab="credits"');
    expect(html).toContain('data-social-icon="film-slate"');
    expect(html).toContain(SOCIAL.profile.creditsEmpty);
    expect(html).not.toContain("Public engine note");
    expect(html).not.toContain("data-social-author-history");
    expect(html).not.toContain(SOCIAL.profile.highlightsEmpty);
  });

  it("does not show follow or edit on the viewer's own public route", async () => {
    stubClient({ member: { ...viewer, bio: null } });
    vi.mocked(ensureOwnSocialProfile).mockResolvedValue(viewer);
    vi.mocked(getOrgContext).mockResolvedValue(ctx("u1") as never);

    const html = await renderPublic("@bob");
    expect(html).toContain("Bob One");
    expect(html).toContain("data-social-author-history");
    expect(html).not.toContain("data-social-follow");
    expect(html).not.toContain("data-social-profile-form");
    expect(html).not.toContain("data-social-profile-photo");
  });

  it("redirects a casing miss to the stored public URL", async () => {
    stubClient({ member: { ...ada, handle: "AdamC" } });
    await expect(renderPublic("adamc")).rejects.toThrow("REDIRECT:/@AdamC");
  });

  it("sets the public canonical to https://24frame.co/@handle", async () => {
    await expect(generateMetadata({ params: Promise.resolve({ handle: "AdamC" }) })).resolves.toEqual({
      alternates: { canonical: "https://24frame.co/@AdamC" },
    });
    await expect(generateMetadata({ params: Promise.resolve({ handle: "ab" }) })).resolves.toEqual({});
  });

  it("keeps the stored casing when the requested handle already matches", async () => {
    stubClient({ member: { ...ada, handle: "AdamC" } });
    const html = await renderPublic("AdamC");
    expect(html).toContain("@AdamC");
    expect(html).toContain('data-social-share-url="https://24frame.co/@AdamC"');
    expect(html).not.toContain("/social/@");
  });

  it("uses the same empty state for a missing handle or an RLS-null row", async () => {
    const { from } = stubClient({ member: null });
    const html = await renderPublic("@missing");
    expect(html).toContain("data-social-member-missing");
    expect(html).toContain(SOCIAL.member.missing);
    expect(html).not.toContain("data-social-author-history");
    expect(from).not.toHaveBeenCalledWith("posts");
  });

  it("signs the account face and reuses Home post cards", async () => {
    stubClient({
      posts: [
        {
          id: "p9",
          body: "hello",
          author_id: "u2",
          group_id: null,
          like_count: 0,
          created_at: "2026-09-13T12:00:00.000Z",
        },
      ],
    });
    vi.mocked(signedAvatarUrl).mockResolvedValue("https://s3.example/signed-avatar");

    const html = await renderPublic();
    expect(html).toContain('src="https://s3.example/signed-avatar"');
    expect(html).toContain('data-social-post="p9"');

    const src = readFileSync("src/app/(app)/social/u/[handle]/page.tsx", "utf8");
    expect(src).toContain("signedAvatarUrl");
    expect(src).toContain("loadAuthorPosts");
    expect(src).toContain("SocialAuthorHistory");
    expect(src).toContain("socialProfileCasingRedirect");
    expect(src).toContain("generateMetadata");
    expect(src).toContain("socialProfileCanonicalUrl");
    expect(src).toContain("loadProfileMutuals");
    expect(src).not.toContain("putAvatarObject");
    expect(src).not.toContain("uploadAccountPhoto");
    expect(src).not.toContain("S3_AVATARS_BUCKET");
  });
});
