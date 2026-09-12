import { describe, expect, it } from "vitest";

import { accountInitials, initialsFromEmail } from "./faces";
import { loadSocialHome, mapSocialHome, type FeedClient, type SocialPostRow, type SocialProfileRow } from "./feed";

const profile: SocialProfileRow = {
  id: "u1",
  handle: "ada",
  display_name: "Ada Lovelace",
  status: "active",
};

const post: SocialPostRow = {
  id: "p1",
  body: "Hello from Social+Education",
  author_id: "u1",
  group_id: null,
  like_count: 0,
  created_at: "2026-09-12T00:00:00.000Z",
};

describe("mobile social home", () => {
  it("maps a lean feed and initials without a second avatar system", () => {
    expect(accountInitials("Ada Lovelace")).toBe("AL");
    expect(initialsFromEmail("ada@studio.com")).toBe("A");
    expect(mapSocialHome(null, [], [])).toEqual({ profile: null, posts: [] });
    expect(mapSocialHome(profile, [post], [profile]).posts[0]).toMatchObject({
      authorName: "Ada Lovelace",
      authorHandle: "ada",
      body: "Hello from Social+Education",
    });
  });

  it("loads visible posts through the JS client", async () => {
    const client: FeedClient = {
      from: (table) => ({
        select: () => ({
          eq: (column, value) => ({
            maybeSingle: async () => ({
              data: table === "profiles" && column === "id" && value === "u1" ? profile : null,
            }),
            order: () => ({
              limit: async () => ({ data: table === "posts" ? [post] : [] }),
            }),
          }),
          in: async () => ({ data: [profile] }),
        }),
      }),
    };
    const home = await loadSocialHome(client, "u1");
    expect(home.profile?.handle).toBe("ada");
    expect(home.posts).toHaveLength(1);
  });
});
