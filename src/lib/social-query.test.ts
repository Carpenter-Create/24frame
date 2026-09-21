import { describe, expect, it } from "vitest";

import { createAppQueryClient } from "@/lib/query-client";
import {
  socialCountsQueryKey,
  socialFollowQueryKey,
  socialProfileQueryKey,
} from "@/lib/social-cache-keys";
import {
  applyOptimisticFollow,
  applyOptimisticSocialProfile,
  applyOptimisticSocialProfilePatch,
  invalidateSocialQueries,
  socialProfileFaceFromRow,
} from "@/lib/social-query";

describe("social query cache helpers", () => {
  it("writes profile and follow edges into the one QueryClient", () => {
    const client = createAppQueryClient();
    applyOptimisticSocialProfile(client, {
      id: "u1",
      handle: "ada",
      display_name: "Ada",
      status: "active",
      bio: "Writes.",
    });
    expect(client.getQueryData(socialProfileQueryKey("u1"))).toEqual({
      id: "u1",
      handle: "ada",
      display_name: "Ada",
      status: "active",
      bio: "Writes.",
    });

    applyOptimisticSocialProfilePatch(client, "u1", { bio: "Engines." });
    expect(client.getQueryData(socialProfileQueryKey("u1"))).toMatchObject({ bio: "Engines." });

    client.setQueryData(socialCountsQueryKey("u2"), { posts: 3, followers: 4, following: 1 });
    client.setQueryData(socialCountsQueryKey("u1"), { posts: 1, followers: 0, following: 2 });
    applyOptimisticFollow(client, { viewerId: "u1", targetId: "u2", following: true });
    expect(client.getQueryData(socialFollowQueryKey("u1", "u2"))).toBe(true);
    expect(client.getQueryData(socialCountsQueryKey("u2"))).toEqual({
      posts: 3,
      followers: 5,
      following: 1,
    });
    expect(client.getQueryData(socialCountsQueryKey("u1"))).toEqual({
      posts: 1,
      followers: 0,
      following: 3,
    });

    applyOptimisticFollow(client, { viewerId: "u1", targetId: "u2", following: false });
    expect(client.getQueryData(socialCountsQueryKey("u2"))).toEqual({
      posts: 3,
      followers: 4,
      following: 1,
    });
  });

  it("invalidates profile, counts, and follow queries together", () => {
    const client = createAppQueryClient();
    client.setQueryData(socialProfileQueryKey("u1"), { id: "u1" });
    client.setQueryData(socialCountsQueryKey("u1"), { posts: 0, followers: 0, following: 0 });
    client.setQueryData(socialFollowQueryKey("u1", "u2"), true);
    invalidateSocialQueries(client, { profileId: "u1", viewerId: "u1", targetId: "u2" });
    expect(client.getQueryState(socialProfileQueryKey("u1"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(socialCountsQueryKey("u1"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(socialFollowQueryKey("u1", "u2"))?.isInvalidated).toBe(true);
  });

  it("maps a Query profile row without restoring cleared face fields", () => {
    const face = socialProfileFaceFromRow({
      id: "u1",
      handle: "ada",
      display_name: "Ada",
      status: "active",
      bio: null,
      cover_key: null,
      welcome_video_key: null,
      crafts: [],
      topics: [],
      imdb_url: null,
      website_url: null,
    });
    expect(face.bio).toBe("");
    expect(face.coverUrl).toBeNull();
    expect(face.welcomeVideoUrl).toBeNull();
    expect(face.imdbUrl).toBeNull();
    expect(face.websiteUrl).toBeNull();
    expect(face.photoUrl).toBe("/api/social/avatar/u1");
  });

  it("uses the shared 45s Social staleTime", () => {
    const client = createAppQueryClient();
    expect(client.getDefaultOptions().queries?.staleTime).toBe(45_000);
  });
});
