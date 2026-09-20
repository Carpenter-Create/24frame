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
  constructedWith: [] as Array<{ url: string; token: string }>,
}));

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(opts: { url: string; token: string }) {
      redisState.constructed += 1;
      redisState.constructedWith.push(opts);
    }
    get = redisState.get;
    set = redisState.set;
    del = redisState.del;
  },
}));

import {
  bustSocialFollowHotCache,
  bustSocialProfileHotCache,
  isSocialHotCacheConfigured,
  readSocialHotCacheEnv,
  resetSocialHotCacheForTests,
  socialHotCache,
  socialHotDel,
  socialHotGet,
  socialHotSet,
  withSocialHotCache,
} from "@/lib/social-hot-cache";

const ENV_KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "KV_URL",
] as const;

describe("social hot cache", () => {
  const prior = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

  function clearRedisEnv() {
    for (const key of ENV_KEYS) delete process.env[key];
    resetSocialHotCacheForTests();
  }

  beforeEach(() => {
    redisState.store.clear();
    redisState.get.mockClear();
    redisState.set.mockClear();
    redisState.del.mockClear();
    redisState.constructed = 0;
    redisState.constructedWith = [];
    clearRedisEnv();
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (prior[key] === undefined) delete process.env[key];
      else process.env[key] = prior[key];
    }
    resetSocialHotCacheForTests();
  });

  it("falls through to the loader when env is missing — no crash", async () => {
    expect(isSocialHotCacheConfigured()).toBe(false);
    expect(readSocialHotCacheEnv()).toBeNull();
    expect(socialHotCache()).toBeNull();
    const load = vi.fn(async () => ({ id: "u1" }));
    await expect(withSocialHotCache("social:profile:u1", load)).resolves.toEqual({ id: "u1" });
    expect(load).toHaveBeenCalledOnce();
    await expect(socialHotGet("social:profile:u1")).resolves.toBeNull();
    await expect(socialHotSet("social:profile:u1", { id: "u1" })).resolves.toBeUndefined();
    await expect(socialHotDel(["social:profile:u1"])).resolves.toBeUndefined();
    expect(redisState.constructed).toBe(0);
  });

  it("reads, writes, and busts when classic REST env is set", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
    resetSocialHotCacheForTests();
    expect(isSocialHotCacheConfigured()).toBe(true);
    expect(readSocialHotCacheEnv()).toEqual({
      url: "https://example.upstash.io",
      token: "test-token",
    });

    const load = vi.fn(async () => ({ id: "u1", handle: "ada" }));
    const first = await withSocialHotCache("social:profile:u1", load);
    const second = await withSocialHotCache("social:profile:u1", load);
    expect(first).toEqual({ id: "u1", handle: "ada" });
    expect(second).toEqual({ id: "u1", handle: "ada" });
    expect(load).toHaveBeenCalledOnce();
    expect(redisState.set).toHaveBeenCalledWith("social:profile:u1", { id: "u1", handle: "ada" }, { ex: 60 });
    expect(redisState.constructedWith[0]).toEqual({
      url: "https://example.upstash.io",
      token: "test-token",
    });

    await bustSocialProfileHotCache("u1", ["ada"]);
    expect(redisState.store.has("social:profile:u1")).toBe(false);
    expect(redisState.store.has("social:profile:handle:ada")).toBe(false);

    redisState.store.set("social:follow:v:t", true);
    redisState.store.set("social:counts:v", { followers: 1 });
    redisState.store.set("social:counts:t", { followers: 2 });
    await bustSocialFollowHotCache("v", "t");
    expect(redisState.store.has("social:follow:v:t")).toBe(false);
    expect(redisState.store.has("social:counts:v")).toBe(false);
    expect(redisState.store.has("social:counts:t")).toBe(false);
  });

  it("accepts Vercel KV REST names and prefers them over classic Upstash names", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://classic.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "classic-token";
    process.env.KV_REST_API_URL = "https://kv.upstash.io";
    process.env.KV_REST_API_TOKEN = "kv-token";
    process.env.KV_URL = "rediss://default:secret@kv.upstash.io:6379";
    expect(readSocialHotCacheEnv()).toEqual({
      url: "https://kv.upstash.io",
      token: "kv-token",
    });
    expect(socialHotCache()).not.toBeNull();
    expect(redisState.constructedWith[0]).toEqual({
      url: "https://kv.upstash.io",
      token: "kv-token",
    });
  });

  it("does not treat KV_URL redis:// as a REST endpoint", () => {
    process.env.KV_URL = "rediss://default:secret@kv.upstash.io:6379";
    process.env.KV_REST_API_TOKEN = "kv-token";
    expect(readSocialHotCacheEnv()).toBeNull();
    expect(isSocialHotCacheConfigured()).toBe(false);
    expect(socialHotCache()).toBeNull();
    expect(redisState.constructed).toBe(0);
  });

  it("mixes a KV REST URL with a classic token when the KV token is absent", () => {
    process.env.KV_REST_API_URL = "https://kv.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "classic-token";
    expect(readSocialHotCacheEnv()).toEqual({
      url: "https://kv.upstash.io",
      token: "classic-token",
    });
  });

  it("treats a Redis throw as a miss so Supabase still loads", async () => {
    process.env.KV_REST_API_URL = "https://kv.upstash.io";
    process.env.KV_REST_API_TOKEN = "kv-token";
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
