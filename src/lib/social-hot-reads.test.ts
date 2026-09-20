import { describe, expect, it, vi } from "vitest";

import {
  loadCachedIsFollowing,
  loadCachedProfileSocialCounts,
  loadCachedSocialProfileByHandle,
  loadCachedSocialProfileById,
} from "@/lib/social-hot-reads";
import { SOCIAL_PROFILE_COLUMNS } from "@/lib/social-profile";

describe("social hot reads", () => {
  it("falls through to Supabase profile / counts / follow when Redis is unset", async () => {
    const profile = {
      id: "u2",
      handle: "ada",
      display_name: "Ada",
      status: "active",
      bio: null,
    };
    const maybeSingle = vi.fn(async () => ({ data: profile, error: null }));
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle })),
          })),
        };
      }
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.is = vi.fn(() => chain);
      chain.then = (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ count: table === "posts" ? 3 : 1, error: null }).then(resolve);
      return chain;
    });
    const supabase = { from } as never;

    await expect(loadCachedSocialProfileById(supabase, "u2")).resolves.toEqual(profile);
    await expect(loadCachedSocialProfileByHandle(supabase, "ada")).resolves.toEqual(profile);
    expect(maybeSingle).toHaveBeenCalled();
    expect(from).toHaveBeenCalledWith("profiles");

    await expect(loadCachedProfileSocialCounts(supabase, "u2")).resolves.toEqual({
      posts: 3,
      followers: 1,
      following: 1,
    });

    const followMaybe = vi.fn(async () => ({ data: { followee_id: "u2" }, error: null }));
    const followClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ maybeSingle: followMaybe })),
          })),
        })),
      })),
    };
    await expect(loadCachedIsFollowing(followClient as never, "u1", "u2")).resolves.toBe(true);
    expect(SOCIAL_PROFILE_COLUMNS).toContain("handle");
  });
});
