import { describe, expect, it } from "vitest";

import {
  SOCIAL_HOT_TTL_SECONDS,
  SOCIAL_QUERY_STALE_MS,
  socialCountsCacheKey,
  socialCountsQueryKey,
  socialFollowCacheKey,
  socialFollowInvalidateKeys,
  socialFollowQueryKey,
  socialProfileCacheKey,
  socialProfileHandleCacheKey,
  socialProfileInvalidateKeys,
  socialProfileQueryKey,
} from "@/lib/social-cache-keys";

describe("social cache keys — one SoT", () => {
  it("names Redis keys as social:profile|counts|follow", () => {
    expect(socialProfileCacheKey("u1")).toBe("social:profile:u1");
    expect(socialProfileHandleCacheKey("ada")).toBe("social:profile:handle:ada");
    expect(socialCountsCacheKey("u1")).toBe("social:counts:u1");
    expect(socialFollowCacheKey("viewer", "target")).toBe("social:follow:viewer:target");
    expect(SOCIAL_HOT_TTL_SECONDS).toBeGreaterThanOrEqual(30);
    expect(SOCIAL_HOT_TTL_SECONDS).toBeLessThanOrEqual(120);
    expect(SOCIAL_QUERY_STALE_MS).toBeGreaterThanOrEqual(30_000);
    expect(SOCIAL_QUERY_STALE_MS).toBeLessThanOrEqual(60_000);
  });

  it("keeps Query tuples aligned with the Redis identity", () => {
    expect(socialProfileQueryKey("u1")).toEqual(["social", "profile", "u1"]);
    expect(socialCountsQueryKey("u1")).toEqual(["social", "counts", "u1"]);
    expect(socialFollowQueryKey("v", "t")).toEqual(["social", "follow", "v", "t"]);
  });

  it("busts profile id plus named handles on write", () => {
    expect(socialProfileInvalidateKeys("u1", ["ada", "Ada", "", null])).toEqual([
      "social:profile:u1",
      "social:profile:handle:ada",
      "social:profile:handle:Ada",
    ]);
    expect(socialProfileInvalidateKeys("u1")).toEqual(["social:profile:u1"]);
  });

  it("busts the follow edge and both count keys", () => {
    expect(socialFollowInvalidateKeys("viewer", "target")).toEqual([
      "social:follow:viewer:target",
      "social:counts:viewer",
      "social:counts:target",
    ]);
  });
});
