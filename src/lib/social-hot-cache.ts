import "server-only";

import { Redis } from "@upstash/redis";

import {
  SOCIAL_HOT_TTL_SECONDS,
  socialFeedInvalidateKeys,
  socialFollowInvalidateKeys,
  socialProfileInvalidateKeys,
} from "@/lib/social-cache-keys";

// Upstash Redis REST — server-only. Missing env (local / CI) is a no-op
// fall-through to Supabase. Never NEXT_PUBLIC_. Never import from client.
//
// Adam's Vercel Marketplace store injects KV_* (preferred) and may also
// inject the classic UPSTASH_REDIS_REST_* pair. KV_URL is redis:// — not REST.

type RedisEnv = { url: string; token: string };

function firstPresent(...values: Array<string | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function isRedisRestUrl(value: string): boolean {
  return value.startsWith("https://") || value.startsWith("http://");
}

export function readSocialHotCacheEnv(): RedisEnv | null {
  const url = firstPresent(process.env.KV_REST_API_URL, process.env.UPSTASH_REDIS_REST_URL);
  const token = firstPresent(process.env.KV_REST_API_TOKEN, process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!url || !token || !isRedisRestUrl(url)) return null;
  return { url, token };
}

export function isSocialHotCacheConfigured(): boolean {
  return readSocialHotCacheEnv() !== null;
}

let cached: Redis | null | undefined;

export function socialHotCache(): Redis | null {
  if (cached !== undefined) return cached;
  const env = readSocialHotCacheEnv();
  cached = env ? new Redis(env) : null;
  return cached;
}

/** Test seam — do not use in app code. */
export function resetSocialHotCacheForTests(): void {
  cached = undefined;
}

export async function socialHotGet<T>(key: string): Promise<T | null> {
  const redis = socialHotCache();
  if (!redis) return null;
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

export async function socialHotSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = SOCIAL_HOT_TTL_SECONDS,
): Promise<void> {
  const redis = socialHotCache();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Fall through to Supabase on the next read.
  }
}

export async function socialHotDel(keys: readonly string[]): Promise<void> {
  const redis = socialHotCache();
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // Best-effort bust. TTL is short.
  }
}

export async function withSocialHotCache<T>(
  key: string,
  load: () => Promise<T>,
  cacheable: (value: T) => boolean = (value) => value !== null && value !== undefined,
): Promise<T> {
  const hit = await socialHotGet<T>(key);
  if (hit !== null) return hit;
  const value = await load();
  if (cacheable(value)) await socialHotSet(key, value);
  return value;
}

export async function bustSocialProfileHotCache(
  profileId: string,
  handles: readonly (string | null | undefined)[] = [],
): Promise<void> {
  await socialHotDel(socialProfileInvalidateKeys(profileId, handles));
}

export async function bustSocialFollowHotCache(viewerId: string, targetId: string): Promise<void> {
  await socialHotDel(socialFollowInvalidateKeys(viewerId, targetId));
}

export async function bustSocialFeedHotCache(viewerId: string): Promise<void> {
  await socialHotDel(socialFeedInvalidateKeys(viewerId));
}
