import type { createClient } from "@/lib/supabase/server";
import { probeRange, splitProbe, UNPAGINATED_MAX } from "@/lib/list-bounds";
import {
  NEWS_HOME_CAP,
  NEWS_READ_REVALIDATE_SECONDS,
  dedupeNewsHeadlines,
  isNewsSourceId,
  newsInWindow,
  newsWindowStart,
  overviewNewsHeadlines,
  type NewsItem,
  type NewsListResult,
} from "@/lib/news";

// Home + /news read news_items through the signed-in user client
// (courses-shaped RLS: authenticated SELECT). Never fan out RSS here.
// Success-only process cache is the SWR equivalent — failures are not stored.

type ServerClient = Awaited<ReturnType<typeof createClient>>;

type NewsItemRow = {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  image_url: string | null;
};

const NEWS_ITEM_SELECT = "id, title, url, source, published_at, image_url";

type NewsCacheEntry = { expiresAt: number; value: NewsListResult };

const newsReadCache = new Map<string, NewsCacheEntry>();

export function newsReadCacheKey(limit: number, now: Date): string {
  const bucket = Math.floor(now.getTime() / (NEWS_READ_REVALIDATE_SECONDS * 1000));
  return `news:${limit}:${bucket}`;
}

export function resetNewsReadCache(): void {
  newsReadCache.clear();
}

export function peekNewsReadCache(key: string, now: Date): NewsListResult | null {
  const hit = newsReadCache.get(key);
  if (!hit || hit.expiresAt <= now.getTime()) return null;
  return hit.value;
}

function rememberNewsRead(key: string, value: NewsListResult, now: Date): void {
  if (value.failed) return;
  newsReadCache.set(key, {
    expiresAt: now.getTime() + NEWS_READ_REVALIDATE_SECONDS * 1000,
    value,
  });
}

function rowToItem(row: NewsItemRow): NewsItem | null {
  if (!isNewsSourceId(row.source)) return null;
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    source: row.source,
    published_at: row.published_at,
    image_url: row.image_url,
  };
}

export async function loadNewsItems(
  supabase: ServerClient,
  input: { limit: number; now: Date },
): Promise<NewsListResult> {
  const key = newsReadCacheKey(input.limit, input.now);
  const cached = peekNewsReadCache(key, input.now);
  if (cached) return cached;

  const since = newsWindowStart(input.now).toISOString();
  const until = input.now.toISOString();
  const { data, error } = await supabase
    .from("news_items")
    .select(NEWS_ITEM_SELECT)
    .gte("published_at", since)
    .lte("published_at", until)
    .order("published_at", { ascending: false })
    .range(...probeRange(input.limit));

  if (error) {
    console.error(`[news:read] ${error.message}`);
    return { rows: [], truncated: false, failed: true };
  }

  const mapped = (data ?? [])
    .map((row) => rowToItem(row as NewsItemRow))
    .filter((row): row is NewsItem => row !== null)
    .filter((row) => newsInWindow(row.published_at, input.now));
  const unique = dedupeNewsHeadlines(mapped);
  const { rows, truncated } = splitProbe(unique, input.limit);
  const loaded = { rows, truncated, failed: false };
  rememberNewsRead(key, loaded, input.now);
  return loaded;
}

export async function loadHomeNews(
  supabase: ServerClient,
  now: Date,
): Promise<NewsItem[]> {
  const loaded = await loadNewsItems(supabase, { limit: NEWS_HOME_CAP, now });
  return overviewNewsHeadlines(loaded.failed ? [] : loaded.rows);
}

export async function loadNewsHistory(
  supabase: ServerClient,
  now: Date,
): Promise<NewsListResult> {
  return loadNewsItems(supabase, { limit: UNPAGINATED_MAX, now });
}
