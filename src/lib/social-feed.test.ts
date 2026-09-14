import { describe, expect, it, vi } from "vitest";

import { LIST_PAGE, probeRange } from "@/lib/list-bounds";
import { SOCIAL_PROFILE_POSTS_PAGE } from "@/lib/social";
import { loadAuthorPosts, type SocialPostRow } from "@/lib/social-feed";

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
