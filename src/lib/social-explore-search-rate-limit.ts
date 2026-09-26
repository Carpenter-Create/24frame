import "server-only";

import { createHash } from "node:crypto";

import { socialHotCache } from "@/lib/social-hot-cache";

// Abuse meter for authenticated Explore search. The probe cap
// (SOCIAL_EXPLORE_POSTS_LIMIT) bounds rows, not requests. No new table —
// Redis when the hot cache is configured, otherwise this instance's memory.
// A Redis error falls through to memory so search stays metered. Fail closed.
// 30/minute/user is an abuse cap, not a product or pricing decision.
export const SOCIAL_EXPLORE_SEARCH_RATE = {
  perUserPerMinute: 30,
  windowMs: 60_000,
} as const;

export class SocialExploreSearchRateLimitError extends Error {
  readonly scope = "user" as const;

  constructor() {
    super("rate-limited");
    this.name = "SocialExploreSearchRateLimitError";
  }
}

type Bucket = { windowStart: number; count: number };

const memory = new Map<string, Bucket>();

export function resetExploreSearchRateForTests(): void {
  memory.clear();
}

function windowStart(now: number): number {
  const { windowMs } = SOCIAL_EXPLORE_SEARCH_RATE;
  return Math.floor(now / windowMs) * windowMs;
}

function fingerprint(userId: string): string {
  return createHash("sha256").update(userId).digest("hex").slice(0, 12);
}

function memoryCount(userId: string, start: number): number {
  const existing = memory.get(userId);
  if (!existing || existing.windowStart !== start) {
    memory.set(userId, { windowStart: start, count: 1 });
    return 1;
  }
  existing.count += 1;
  return existing.count;
}

async function redisCount(userId: string, start: number): Promise<number | null> {
  const redis = socialHotCache();
  if (!redis) return null;
  const key = `social:explore-search:${userId}:${start}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      const ttlSeconds = Math.ceil((SOCIAL_EXPLORE_SEARCH_RATE.windowMs * 2) / 1000);
      try {
        await redis.expire(key, ttlSeconds);
      } catch {
        // The next window uses a new key.
      }
    }
    return count;
  } catch {
    return null;
  }
}

export async function assertExploreSearchAllowed(userId: string, now = Date.now()): Promise<void> {
  if (!userId.trim()) throw new Error("Explore search requires a signed-in user");
  const start = windowStart(now);
  const fromRedis = await redisCount(userId, start);
  const count = fromRedis === null ? memoryCount(userId, start) : fromRedis;
  if (count > SOCIAL_EXPLORE_SEARCH_RATE.perUserPerMinute) {
    console.warn("[explore-search] rate limited", { user: fingerprint(userId) });
    throw new SocialExploreSearchRateLimitError();
  }
}
