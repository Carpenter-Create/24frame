import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisState = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  get: vi.fn(async (key: string) => redisState.store.get(key) ?? null),
  set: vi.fn(async (key: string, value: unknown) => {
    redisState.store.set(key, value);
    return "OK";
  }),
  del: vi.fn(async (...keys: string[]) => {
    for (const key of keys) redisState.store.delete(key);
    return keys.length;
  }),
  constructed: 0,
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {
      redisState.constructed += 1;
    }
    get = redisState.get;
    set = redisState.set;
    del = redisState.del;
  },
}));

import {
  bustSocialCountsHotCache,
  bustSocialFollowHotCache,
  bustSocialProfileHotCache,
  isSocialHotCacheConfigured,
  resetSocialHotCacheForTests,
  socialHotCache,
  socialHotDel,
  socialHotGet,
  socialHotSet,
  withSocialHotCache,
} from "@/lib/social-hot-cache";

describe("social hot cache", () => {
  const priorUrl = process.env.UPSTASH_REDIS_REST_URL;
  const priorToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  beforeEach(() => {
    redisState.store.clear();
    redisState.get.mockClear();
    redisState.set.mockClear();
    redisState.del.mockClear();
    redisState.constructed = 0;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    resetSocialHotCacheForTests();
  });

  afterEach(() => {
    if (priorUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = priorUrl;
    if (priorToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = priorToken;
    resetSocialHotCacheForTests();
  });

  it("falls through to the loader when env is missing — no crash", async () => {
    expect(isSocialHotCacheConfigured()).toBe(false);
    expect(socialHotCache()).toBeNull();
    const load = vi.fn(async () => ({ id: "u1" }));
    await expect(withSocialHotCache("social:profile:u1", load)).resolves.toEqual({ id: "u1" });
    expect(load).toHaveBeenCalledOnce();
    await expect(socialHotGet("social:profile:u1")).resolves.toBeNull();
    await expect(socialHotSet("social:profile:u1", { id: "u1" })).resolves.toBeUndefined();
    await expect(socialHotDel(["social:profile:u1"])).resolves.toBeUndefined();
    expect(redisState.constructed).toBe(0);
  });

  it("reads, writes, and busts when REST env is set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    resetSocialHotCacheForTests();
    expect(isSocialHotCacheConfigured()).toBe(true);

    const load = vi.fn(async () => ({ id: "u1", handle: "ada" }));
    const first = await withSocialHotCache("social:profile:u1", load);
    const second = await withSocialHotCache("social:profile:u1", load);
    expect(first).toEqual({ id: "u1", handle: "ada" });
    expect(second).toEqual({ id: "u1", handle: "ada" });
    expect(load).toHaveBeenCalledOnce();
    expect(redisState.set).toHaveBeenCalledWith("social:profile:u1", { id: "u1", handle: "ada" }, { ex: 60 });

    await bustSocialProfileHotCache("u1", ["ada"]);
    expect(redisState.store.has("social:profile:u1")).toBe(false);
    expect(redisState.store.has("social:profile:handle:ada")).toBe(false);

    redisState.store.set("social:follow:v:t", true);
    redisState.store.set("social:counts:v", { followers: 1 });
    redisState.store.set("social:counts:t", { followers: 2 });
    redisState.store.set("social:counts:u1", { posts: 3 });
    await bustSocialCountsHotCache("u1");
    expect(redisState.store.has("social:counts:u1")).toBe(false);
    await bustSocialFollowHotCache("v", "t");
    expect(redisState.store.has("social:follow:v:t")).toBe(false);
    expect(redisState.store.has("social:counts:v")).toBe(false);
    expect(redisState.store.has("social:counts:t")).toBe(false);
  });

  it("treats a Redis throw as a miss so Supabase still loads", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    resetSocialHotCacheForTests();
    redisState.get.mockRejectedValueOnce(new Error("down"));
    const load = vi.fn(async () => 7);
    await expect(withSocialHotCache("social:counts:u1", load)).resolves.toBe(7);
    expect(load).toHaveBeenCalledOnce();
  });

  it("caches a false follow edge and does not cache a missing profile", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    resetSocialHotCacheForTests();
    const follow = vi.fn(async () => false);
    await expect(withSocialHotCache("social:follow:v:t", follow)).resolves.toBe(false);
    await expect(withSocialHotCache("social:follow:v:t", follow)).resolves.toBe(false);
    expect(follow).toHaveBeenCalledOnce();

    const missing = vi.fn(async () => null);
    await expect(withSocialHotCache("social:profile:missing", missing)).resolves.toBeNull();
    expect(redisState.set).not.toHaveBeenCalledWith("social:profile:missing", null, expect.anything());
  });
});
