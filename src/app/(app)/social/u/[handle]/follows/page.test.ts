import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";
import SocialFollowsPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/social/u/ada/follows",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/s3-avatars", () => ({
  signedAvatarUrl: vi.fn().mockResolvedValue(null),
  signedAvatarUrls: vi.fn().mockResolvedValue(new Map()),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  toggleSocialFollow: vi.fn(),
}));

function ctx(userId = "u1") {
  return {
    user: { id: userId, email: "bob@example.com" },
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
};

const ada: PublicProfile = {
  id: "u2",
  handle: "ada",
  display_name: "Ada Lovelace",
  status: "active",
};

const carol: PublicProfile = {
  id: "u3",
  handle: "carol",
  display_name: "Carol King",
  status: "active",
};

function stubClient({
  member = ada,
  people = [carol],
  tab = "followers",
  followingIds = [] as string[],
  followerIds = [] as string[],
}: {
  member?: PublicProfile | null;
  people?: PublicProfile[];
  tab?: "followers" | "following";
  followingIds?: string[];
  followerIds?: string[];
} = {}) {
  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      const rows = member ? [member, ...people.filter((row) => row.id !== member.id)] : [];
      return chain(rows);
    }
    if (table === "posts") return chain([]);
    if (table === "follows") {
      const edges = people.map((person) => ({
        follower_id: tab === "following" ? (member?.id ?? "u2") : person.id,
        followee_id: tab === "following" ? person.id : (member?.id ?? "u2"),
        created_at: "2026-09-20T12:00:00.000Z",
      }));
      const c = chain(edges);
      c.in = vi.fn((col: string) => {
        if (col === "followee_id") return chain(followingIds.map((id) => ({ followee_id: id })));
        return chain(followerIds.map((id) => ({ follower_id: id })));
      });
      return c;
    }
    throw new Error(`unexpected from(${table})`);
  });
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from };
}

async function renderFollows(
  handle = "ada",
  search: Record<string, string | string[] | undefined> = {},
) {
  return renderToStaticMarkup(
    await SocialFollowsPage({
      params: Promise.resolve({ handle }),
      searchParams: Promise.resolve(search),
    }),
  );
}

describe("Social follow list", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOrgContext).mockResolvedValue(ctx() as never);
  });

  it("opens Followers with real people, search, and a follow button", async () => {
    stubClient({ followerIds: ["u3"] });
    const html = await renderFollows();
    expect(html).toContain("data-social-follows");
    expect(html).toContain("data-social-follows-header");
    expect(html).toContain("@ada");
    expect(html).toContain('data-social-follows-tab="followers"');
    expect(html).toContain('data-social-follows-tab="following"');
    expect(html).toContain("data-social-follows-search");
    expect(html).toContain(SOCIAL.profile.followsSearch);
    expect(html).toContain("data-social-follows-list");
    expect(html).toContain("@carol");
    expect(html).toContain("Carol King");
    expect(html).not.toContain("Member");
    expect(html).toContain("data-social-follow");
    expect(html).toContain(SOCIAL.follow.followBack);
    expect(html).toContain('href="/social/u/carol"');
    expect(html).toContain('href="/social/u/ada"');
    expect(html).not.toContain("Subscriptions");
    expect(html).not.toContain("Sort by");
  });

  it("defaults Following from the tab query and links back to the public profile", async () => {
    stubClient({
      tab: "following",
      people: [{ id: "u3", handle: "carol", display_name: "Carol King", status: "active" }],
      followingIds: ["u3"],
    });
    const html = await renderFollows("ada", { tab: "following" });
    expect(html).toContain('data-social-follows-tab="following"');
    expect(html).toContain("@carol");
    expect(html).toContain(SOCIAL.follow.following);
    expect(html).toContain('href="/social/u/ada"');
  });

  it("filters the list by the search query", async () => {
    stubClient({
      people: [
        { id: "u3", handle: "carol", display_name: "Carol King", status: "active" },
        { id: "u4", handle: "dan", display_name: "Dan", status: "active" },
      ],
    });
    const html = await renderFollows("ada", { q: "dan" });
    expect(html).toContain("@dan");
    expect(html).not.toContain("@carol");
  });

  it("shows a calm empty state when nobody matches", async () => {
    stubClient({ people: [] });
    const html = await renderFollows();
    expect(html).toContain("data-social-follows-empty");
    expect(html).toContain(SOCIAL.profile.followersEmpty);
    expect(html).not.toContain("data-social-follows-list");
    expect(html).not.toContain("data-inline-notice-error");
  });

  it("redirects a casing miss to the stored handle on this screen", async () => {
    stubClient({ member: { ...ada, handle: "AdamC" } });
    await expect(renderFollows("adamc", { tab: "following" })).rejects.toThrow(
      "REDIRECT:/social/u/AdamC/follows?tab=following",
    );
  });

  it("returns own lists to the workspace profile", async () => {
    stubClient({
      member: { id: "u1", handle: "bob", display_name: "Bob One", status: "active" },
      people: [],
    });
    const html = await renderFollows("bob");
    expect(html).toContain("@bob");
    expect(html).toContain('href="/social/profile"');
    expect(html).toContain(SOCIAL.profile.followersEmpty);
  });

  it("uses the same empty state for a missing handle", async () => {
    stubClient({ member: null, people: [] });
    const html = await renderFollows("missing");
    expect(html).toContain("data-social-follows-missing");
    expect(html).toContain(SOCIAL.member.missing);
    expect(html).not.toContain("data-social-follows-list");
  });

  it("stays on the in-app follow list and reuses house search plus person rows", () => {
    const src = readFileSync("src/app/(app)/social/u/[handle]/follows/page.tsx", "utf8");
    expect(src).toContain("HousePageSearch");
    expect(src).toContain("SocialFollowsTabs");
    expect(src).toContain("SocialFollowsList");
    expect(src).toContain("loadProfileFollowList");
    expect(src).toContain("socialProfileFollowsCasingRedirect");
    expect(src).not.toContain("PageHeader");
    expect(src).not.toContain("Subscriptions");
  });
});
