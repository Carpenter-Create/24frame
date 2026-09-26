import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redis = vi.hoisted(() => ({
  enabled: false,
  incr: vi.fn<(key: string) => Promise<number>>(async () => 1),
  expire: vi.fn<(key: string, seconds: number) => Promise<number>>(async () => 1),
}));

vi.mock("@/lib/social-hot-cache", () => ({
  socialHotCache: () => (redis.enabled ? { incr: redis.incr, expire: redis.expire } : null),
}));

import {
  SOCIAL_EXPLORE_SEARCH_RATE,
  SocialExploreSearchRateLimitError,
  assertExploreSearchAllowed,
  resetExploreSearchRateForTests,
} from "./social-explore-search-rate-limit";

const USER = "11111111-1111-4111-8111-111111111111";
const USER_KEY = createHash("sha256").update(USER).digest("hex");
const T0 = 1_700_000_040_000;

describe("assertExploreSearchAllowed", () => {
  beforeEach(() => {
    resetExploreSearchRateForTests();
    redis.enabled = false;
    redis.incr.mockReset();
    redis.expire.mockReset();
    redis.incr.mockResolvedValue(1);
    redis.expire.mockResolvedValue(1);
  });

  it("allows the per-user cap and refuses the next search in the same window", async () => {
    for (let i = 0; i < SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute; i += 1) {
      await assertExploreSearchAllowed(USER, T0);
    }
    await expect(assertExploreSearchAllowed(USER, T0)).rejects.toBeInstanceOf(
      SocialExploreSearchRateLimitError,
    );
    await expect(assertExploreSearchAllowed(USER, T0)).rejects.toMatchObject({
      name: "SocialExploreSearchRateLimitError",
      scope: "user",
    });
  });

  it("opens a new window and does not share a bucket across users", async () => {
    for (let i = 0; i < SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute; i += 1) {
      await assertExploreSearchAllowed(USER, T0);
    }
    await expect(assertExploreSearchAllowed(USER, T0)).rejects.toBeInstanceOf(
      SocialExploreSearchRateLimitError,
    );
    await expect(
      assertExploreSearchAllowed(USER, T0 + SOCIAL_EXPLORE_SEARCH_RATE.windowMs),
    ).resolves.toBeUndefined();
    await expect(assertExploreSearchAllowed("22222222-2222-4222-8222-222222222222", T0)).resolves.toBeUndefined();
  });

  it("refuses an empty user id", async () => {
    await expect(assertExploreSearchAllowed("")).rejects.toThrow(/signed-in user/);
    await expect(assertExploreSearchAllowed("   ")).rejects.toThrow(/signed-in user/);
  });

  it("refuses when Redis is already over the cap without charging memory", async () => {
    redis.enabled = true;
    redis.incr.mockResolvedValue(SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute + 1);
    await expect(assertExploreSearchAllowed(USER, T0)).rejects.toBeInstanceOf(
      SocialExploreSearchRateLimitError,
    );
    expect(redis.expire).not.toHaveBeenCalled();
    redis.enabled = false;
    await expect(assertExploreSearchAllowed(USER, T0)).resolves.toBeUndefined();
  });

  it("meters in memory when Redis fails", async () => {
    redis.enabled = true;
    redis.incr.mockRejectedValue(new Error("redis down"));
    for (let i = 0; i < SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute; i += 1) {
      await assertExploreSearchAllowed(USER, T0);
    }
    await expect(assertExploreSearchAllowed(USER, T0)).rejects.toBeInstanceOf(
      SocialExploreSearchRateLimitError,
    );
    expect(redis.incr).toHaveBeenCalled();
  });

  it("sets a Redis ttl on the first hit of a window", async () => {
    redis.enabled = true;
    redis.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    await assertExploreSearchAllowed(USER, T0);
    await assertExploreSearchAllowed(USER, T0);
    expect(redis.expire).toHaveBeenCalledTimes(1);
    expect(redis.expire).toHaveBeenCalledWith(
      `social:explore-search:${USER_KEY}:${T0 - (T0 % SOCIAL_EXPLORE_SEARCH_RATE.windowMs)}`,
      Math.ceil((SOCIAL_EXPLORE_SEARCH_RATE.windowMs * 2) / 1000),
    );
    expect(String(redis.incr.mock.calls[0]?.[0])).not.toContain(USER);
  });

  it("puts a sha256 of the user id in the Redis key and the warn log", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    redis.enabled = true;
    redis.incr.mockResolvedValue(SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute + 1);
    await expect(assertExploreSearchAllowed(USER, T0)).rejects.toBeInstanceOf(
      SocialExploreSearchRateLimitError,
    );
    const key = String(redis.incr.mock.calls[0]?.[0]);
    expect(key).toBe(`social:explore-search:${USER_KEY}:${T0}`);
    expect(key).not.toContain(USER);
    expect(warn).toHaveBeenCalledWith("[explore-search] rate limited", { user: USER_KEY });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(USER);
    warn.mockRestore();
  });
});
