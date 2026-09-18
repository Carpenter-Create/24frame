import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { LIST_PAGE, probeRange } from "@/lib/list-bounds";
import { SOCIAL_PROFILE_POSTS_PAGE } from "@/lib/social";
import {
  SOCIAL_EXPLORE_PEOPLE_LIMIT,
  SOCIAL_EXPLORE_POSTS_LIMIT,
  SOCIAL_FOLLOWEES_LIMIT,
  SOCIAL_FOLLOWING_WALL_LIMIT,
  SOCIAL_STORIES_RAIL_LIMIT,
  encodeFollowingWallCursor,
  followingWallKeysetOrFilter,
} from "@/lib/social-home-bounds";
import {
  loadAuthorPosts,
  loadExploreSearch,
  loadFolloweeIds,
  loadFollowingPosts,
  loadLiveStories,
  type SocialPostRow,
  type SocialStoryRow,
} from "@/lib/social-feed";

function post(id: string, authorId = "u1"): SocialPostRow {
  return {
    id,
    body: id,
    author_id: authorId,
    group_id: null,
    like_count: 0,
    created_at: "2026-09-13T12:00:00.000Z",
    media: [],
  };
}

function authorClient(rows: SocialPostRow[] | null) {
  const range = vi.fn(async () => ({ data: rows, error: null }));
  const order = vi.fn(() => ({ range }));
  const authorEq = vi.fn(() => ({ order }));
  const groupIs = vi.fn(() => ({ eq: authorEq }));
  const statusEq = vi.fn(() => ({ is: groupIs }));
  const select = vi.fn(() => ({ eq: statusEq }));
  const from = vi.fn(() => ({ select }));
  return { from, select, statusEq, groupIs, authorEq, order, range };
}

describe("loadAuthorPosts", () => {
  it("reads one author's public wall with a documented probe", async () => {
    const rows = [post("p1"), post("p2")];
    const client = authorClient(rows);
    const page = await loadAuthorPosts(client as never, "u1");

    expect(client.from).toHaveBeenCalledWith("posts");
    expect(client.select).toHaveBeenCalledWith(
      "id, body, author_id, group_id, like_count, created_at, media, category",
    );
    expect(client.statusEq).toHaveBeenCalledWith("status", "active");
    expect(client.groupIs).toHaveBeenCalledWith("group_id", null);
    expect(client.authorEq).toHaveBeenCalledWith("author_id", "u1");
    expect(client.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(client.range).toHaveBeenCalledWith(...probeRange(SOCIAL_PROFILE_POSTS_PAGE));
    expect(SOCIAL_PROFILE_POSTS_PAGE).toBe(LIST_PAGE);
    expect(page).toEqual({ posts: rows, truncated: false });
  });

  it("reports honest truncation when the probe row comes back", async () => {
    const rows = Array.from({ length: SOCIAL_PROFILE_POSTS_PAGE + 1 }, (_, i) => post(`p${i}`));
    const client = authorClient(rows);
    const page = await loadAuthorPosts(client as never, "u2");
    expect(page.posts).toHaveLength(SOCIAL_PROFILE_POSTS_PAGE);
    expect(page.posts[0]?.id).toBe("p0");
    expect(page.truncated).toBe(true);
    expect(client.authorEq).toHaveBeenCalledWith("author_id", "u2");
  });

  it("treats a null page as empty and not truncated", async () => {
    const client = authorClient(null);
    await expect(loadAuthorPosts(client as never, "u1")).resolves.toEqual({
      posts: [],
      truncated: false,
    });
  });
});

function feedChain(result: unknown) {
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
  return c;
}

function wallPost(i: number, createdAt = `2026-09-14T12:00:${String(i).padStart(2, "0")}.000Z`): SocialPostRow {
  return {
    id: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
    body: `p${i}`,
    author_id: "u1",
    group_id: null,
    like_count: 0,
    created_at: createdAt,
    media: [],
  };
}

describe("loadFolloweeIds", () => {
  it("probes one past the followee cap and reports overflow", async () => {
    const rows = Array.from({ length: SOCIAL_FOLLOWEES_LIMIT + 1 }, (_, i) => ({
      followee_id: `f${i}`,
    }));
    const chain = feedChain(rows);
    const page = await loadFolloweeIds({ from: vi.fn(() => chain) } as never, "u1");
    expect(chain.eq).toHaveBeenCalledWith("follower_id", "u1");
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(chain.order).toHaveBeenCalledWith("followee_id", { ascending: true });
    expect(chain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_FOLLOWEES_LIMIT));
    expect(page.ids).toHaveLength(SOCIAL_FOLLOWEES_LIMIT);
    expect(page.truncated).toBe(true);
  });

  it("keeps an exactly-full followee page honest", async () => {
    const rows = Array.from({ length: SOCIAL_FOLLOWEES_LIMIT }, (_, i) => ({ followee_id: `f${i}` }));
    const page = await loadFolloweeIds({ from: vi.fn(() => feedChain(rows)) } as never, "u1");
    expect(page.ids).toHaveLength(SOCIAL_FOLLOWEES_LIMIT);
    expect(page.truncated).toBe(false);
  });
});

describe("loadFollowingPosts", () => {
  it("probes the wall cap and does not use page-N OFFSET", async () => {
    const rows = [wallPost(1)];
    const chain = feedChain(rows);
    const page = await loadFollowingPosts({ from: vi.fn(() => chain) } as never, ["u1", "u2"]);
    expect(chain.in).toHaveBeenCalledWith("author_id", ["u1", "u2"]);
    expect(chain.or).not.toHaveBeenCalled();
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(chain.order).toHaveBeenCalledWith("id", { ascending: false });
    expect(chain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_FOLLOWING_WALL_LIMIT));
    expect(page).toEqual({ posts: rows, truncated: false, nextCursor: null });
  });

  it("applies created_at+id keyset at offset 0", async () => {
    const cursor = {
      createdAt: "2026-09-14T12:00:00.000Z",
      id: "11111111-1111-4111-8111-000000000099",
    };
    const chain = feedChain([]);
    await loadFollowingPosts({ from: vi.fn(() => chain) } as never, ["u1"], { cursor });
    expect(chain.or).toHaveBeenCalledWith(followingWallKeysetOrFilter(cursor));
    expect(chain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_FOLLOWING_WALL_LIMIT));
    const range = chain.range as ReturnType<typeof vi.fn>;
    const [from] = range.mock.calls[0] as [number, number];
    expect(from).toBe(0);
  });

  it("drops the probe row and exposes the next cursor", async () => {
    const rows = Array.from({ length: SOCIAL_FOLLOWING_WALL_LIMIT + 1 }, (_, i) => wallPost(i));
    const page = await loadFollowingPosts({ from: vi.fn(() => feedChain(rows)) } as never, ["u1"]);
    expect(page.truncated).toBe(true);
    expect(page.posts).toHaveLength(SOCIAL_FOLLOWING_WALL_LIMIT);
    expect(page.nextCursor).toBe(encodeFollowingWallCursor(page.posts[SOCIAL_FOLLOWING_WALL_LIMIT - 1]!));
    expect(page.posts.at(-1)?.id).not.toBe(rows.at(-1)?.id);
  });

  it("skips the query when the author set is empty", async () => {
    const from = vi.fn();
    const page = await loadFollowingPosts({ from } as never, []);
    expect(from).not.toHaveBeenCalled();
    expect(page).toEqual({ posts: [], truncated: false, nextCursor: null });
  });
});

describe("loadLiveStories", () => {
  function story(i: number): SocialStoryRow {
    return {
      id: `s${i}`,
      author_id: "u1",
      body: null,
      media: [],
      expires_at: "2026-09-15T12:00:00.000Z",
      created_at: "2026-09-14T12:00:00.000Z",
    };
  }

  it("probes the rail cap and reports overflow", async () => {
    const rows = Array.from({ length: SOCIAL_STORIES_RAIL_LIMIT + 1 }, (_, i) => story(i));
    const chain = feedChain(rows);
    const now = new Date("2026-09-14T12:00:00.000Z");
    const page = await loadLiveStories({ from: vi.fn(() => chain) } as never, ["u1"], now);
    expect(chain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_STORIES_RAIL_LIMIT));
    expect(page.stories).toHaveLength(SOCIAL_STORIES_RAIL_LIMIT);
    expect(page.truncated).toBe(true);
  });
});

describe("loadExploreSearch", () => {
  it("probes people and posts independently", async () => {
    const people = Array.from({ length: SOCIAL_EXPLORE_PEOPLE_LIMIT + 1 }, (_, i) => ({
      id: `p${i}`,
      handle: `h${i}`,
      display_name: `N${i}`,
    }));
    const posts = Array.from({ length: SOCIAL_EXPLORE_POSTS_LIMIT + 1 }, (_, i) => ({
      id: `x${i}`,
      body: `hello ${i}`,
      author_id: "u1",
    }));
    const peopleChain = feedChain(people);
    const postsChain = feedChain(posts);
    const from = vi.fn((table: string) => (table === "profiles" ? peopleChain : postsChain));
    const page = await loadExploreSearch({ from } as never, "ada");
    expect(peopleChain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_EXPLORE_PEOPLE_LIMIT));
    expect(postsChain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_EXPLORE_POSTS_LIMIT));
    expect(page.peopleTruncated).toBe(true);
    expect(page.postsTruncated).toBe(true);
    expect(page.truncated).toBe(true);
    expect(page.hits.filter((hit) => hit.kind === "person")).toHaveLength(SOCIAL_EXPLORE_PEOPLE_LIMIT);
    expect(page.hits.filter((hit) => hit.kind === "post")).toHaveLength(SOCIAL_EXPLORE_POSTS_LIMIT);
  });
});

describe("class 5 Social Home access lock", () => {
  it("keeps Home loaders on probe + keyset and off page-N OFFSET", () => {
    const src = readFileSync("src/lib/social-feed.ts", "utf8");
    const followees = src.slice(
      src.indexOf("export async function loadFolloweeIds"),
      src.indexOf("export async function loadIsFollowing"),
    );
    const wall = src.slice(
      src.indexOf("export async function loadFollowingPosts"),
      src.indexOf("export type SocialAuthorPostsPage"),
    );
    const stories = src.slice(
      src.indexOf("export async function loadLiveStories"),
      src.indexOf("export async function loadViewedStoryIds"),
    );
    const explore = src.slice(
      src.indexOf("export async function loadExploreSearch"),
      src.indexOf("export type SocialSuggestedPerson"),
    );
    expect(followees).toContain("probeRange(SOCIAL_FOLLOWEES_LIMIT)");
    expect(wall).toContain("probeRange(SOCIAL_FOLLOWING_WALL_LIMIT)");
    expect(wall).toContain("followingWallKeysetOrFilter");
    expect(stories).toContain("probeRange(SOCIAL_STORIES_RAIL_LIMIT)");
    expect(explore).toContain("probeRange(SOCIAL_EXPLORE_PEOPLE_LIMIT)");
    expect(explore).toContain("probeRange(SOCIAL_EXPLORE_POSTS_LIMIT)");
    for (const chunk of [followees, wall, stories, explore]) {
      expect(chunk).toContain("splitProbe");
      expect(chunk).not.toContain("rangeFor");
      expect(chunk).not.toMatch(/offset/i);
    }
    expect(src).not.toMatch(/get_dm_inbox|fan-out|direct_messages/i);
  });
});

