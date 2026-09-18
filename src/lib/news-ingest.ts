import "server-only";

import { NEWS_SOURCES, type NewsSourceId } from "@/lib/news";
import { parseNewsFeed, type NormalizedNewsItem } from "@/lib/news-rss";
import type { createAdminClient } from "@/lib/supabase/admin";

// Scheduled News ingest. Fail-soft per source. Persist only — never
// fan-out RSS on a page read. Service-role writes; unique URL skip.

type AdminClient = ReturnType<typeof createAdminClient>;

export const NEWS_FEED_TIMEOUT_MS = 8_000;
export const NEWS_FEED_MAX_BYTES = 1_500_000;
export const NEWS_INGEST_CONCURRENCY = 3;
export const NEWS_USER_AGENT = "24FrameNews/1.0";

export type NewsIngestSourceResult = {
  source: NewsSourceId;
  fetched: number;
  inserted: number;
  error?: string;
};

export type NewsIngestSummary = {
  sources: number;
  fetched: number;
  inserted: number;
  failed: number;
  results: NewsIngestSourceResult[];
};

export async function fetchNewsFeedXml(
  url: string,
  init: { fetchImpl?: typeof fetch } = {},
): Promise<string> {
  const fetchImpl = init.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NEWS_FEED_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "user-agent": NEWS_USER_AGENT,
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > NEWS_FEED_MAX_BYTES) {
      throw new Error("feed exceeded size cap");
    }
    return new TextDecoder("utf-8").decode(buf);
  } finally {
    clearTimeout(timer);
  }
}

export async function persistNewsItems(
  supabase: AdminClient,
  items: readonly NormalizedNewsItem[],
): Promise<number> {
  if (items.length === 0) return 0;
  const { data, error } = await supabase
    .from("news_items")
    .upsert(
      items.map((item) => ({
        title: item.title,
        url: item.url,
        canonical_url: item.canonical_url,
        source: item.source,
        published_at: item.published_at,
        image_url: item.image_url,
      })),
      { onConflict: "canonical_url", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

async function runBatched<T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    results.push(...(await Promise.all(batch.map(worker))));
  }
  return results;
}

export async function ingestNewsFeeds(input: {
  supabase: AdminClient;
  now?: Date;
  fetchXml?: (url: string) => Promise<string>;
  persist?: (items: readonly NormalizedNewsItem[]) => Promise<number>;
}): Promise<NewsIngestSummary> {
  const now = input.now ?? new Date();
  const fetchXml = input.fetchXml ?? ((url: string) => fetchNewsFeedXml(url));
  const persist = input.persist ?? ((items: readonly NormalizedNewsItem[]) => persistNewsItems(input.supabase, items));

  const results = await runBatched(
    NEWS_SOURCES,
    async (source): Promise<NewsIngestSourceResult> => {
      try {
        const xml = await fetchXml(source.feedUrl);
        const items = parseNewsFeed(xml, source.id, now);
        const inserted = await persist(items);
        return { source: source.id, fetched: items.length, inserted };
      } catch (err) {
        const message = err instanceof Error ? err.message : "feed failed";
        console.error(`[news:ingest] ${source.id} failed: ${message}`);
        return { source: source.id, fetched: 0, inserted: 0, error: message };
      }
    },
    NEWS_INGEST_CONCURRENCY,
  );

  return {
    sources: NEWS_SOURCES.length,
    fetched: results.reduce((sum, row) => sum + row.fetched, 0),
    inserted: results.reduce((sum, row) => sum + row.inserted, 0),
    failed: results.filter((row) => row.error).length,
    results,
  };
}
