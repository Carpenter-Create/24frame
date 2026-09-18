import {
  NEWS_SOURCES,
  newsSourceIsLive,
  newsWindowStart,
  type NewsSourceHealth,
  type NewsSourceId,
} from "@/lib/news";
import { parseNewsFeed, type NormalizedNewsItem } from "@/lib/news-rss";
import type { createAdminClient } from "@/lib/supabase/admin";

// Scheduled News ingest (Vercel cron + CRON_SECRET). Fail-soft per source.
// Persist to news_items only — never fan-out RSS on a page read.

export const NEWS_FEED_TIMEOUT_MS = 8_000;
export const NEWS_FEED_MAX_BYTES = 1_500_000;
export const NEWS_INGEST_CONCURRENCY = 3;
export const NEWS_USER_AGENT = "24FrameNews/1.0";

type AdminClient = ReturnType<typeof createAdminClient>;

export type NewsIngestSourceResult = {
  source: NewsSourceId;
  fetched: number;
  inserted: number;
  skipped?: boolean;
  error?: string;
};

export type NewsIngestSummary = {
  sources: number;
  fetched: number;
  inserted: number;
  failed: number;
  skipped: number;
  purged: number;
  results: NewsIngestSourceResult[];
};

export type NewsPersist = {
  upsertItems: (items: readonly NormalizedNewsItem[], now: Date) => Promise<number>;
  getHealth: (source: NewsSourceId) => Promise<NewsSourceHealth | null>;
  putHealth: (row: NewsSourceHealth) => Promise<void>;
  purgeBefore: (cutoffIso: string) => Promise<number>;
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

export function memoryNewsPersist(seed: readonly NormalizedNewsItem[] = []): NewsPersist {
  const items = new Map<string, NormalizedNewsItem>();
  const health = new Map<NewsSourceId, NewsSourceHealth>();
  for (const item of seed) items.set(item.canonical_url, item);
  return {
    async upsertItems(rows) {
      for (const row of rows) items.set(row.canonical_url, row);
      return rows.length;
    },
    async getHealth(source) {
      return health.get(source) ?? null;
    },
    async putHealth(row) {
      health.set(row.source, row);
    },
    async purgeBefore(cutoffIso) {
      let removed = 0;
      for (const [key, row] of items) {
        if (row.published_at < cutoffIso) {
          items.delete(key);
          removed += 1;
        }
      }
      return removed;
    },
  };
}

export function supabaseNewsPersist(admin: AdminClient): NewsPersist {
  return {
    async upsertItems(rows, now) {
      if (rows.length === 0) return 0;
      const fetchedAt = now.toISOString();
      const { error } = await admin.from("news_items").upsert(
        rows.map((row) => ({
          title: row.title,
          url: row.url,
          canonical_url: row.canonical_url,
          source: row.source,
          published_at: row.published_at,
          image_url: row.image_url,
          fetched_at: fetchedAt,
        })),
        { onConflict: "canonical_url" },
      );
      if (error) throw new Error(error.message);
      return rows.length;
    },
    async getHealth(source) {
      const { data, error } = await admin
        .from("news_source_health")
        .select("source, enabled, last_success_at, last_error, last_error_at")
        .eq("source", source)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      return {
        source,
        enabled: data.enabled !== false,
        last_success_at: data.last_success_at ?? null,
        last_error: data.last_error ?? null,
        last_error_at: data.last_error_at ?? null,
      };
    },
    async putHealth(row) {
      const { error } = await admin.from("news_source_health").upsert(
        {
          source: row.source,
          enabled: row.enabled,
          last_success_at: row.last_success_at,
          last_error: row.last_error,
          last_error_at: row.last_error_at,
        },
        { onConflict: "source" },
      );
      if (error) throw new Error(error.message);
    },
    async purgeBefore(cutoffIso) {
      const { data, error } = await admin
        .from("news_items")
        .delete()
        .lt("published_at", cutoffIso)
        .select("id");
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },
  };
}

async function markHealth(
  persist: NewsPersist,
  source: NewsSourceId,
  patch: { now: Date; error?: string },
): Promise<void> {
  const prior = (await persist.getHealth(source)) ?? {
    source,
    enabled: true,
    last_success_at: null,
    last_error: null,
    last_error_at: null,
  };
  const at = patch.now.toISOString();
  await persist.putHealth({
    ...prior,
    last_success_at: patch.error ? prior.last_success_at : at,
    last_error: patch.error ?? null,
    last_error_at: patch.error ? at : null,
  });
}

export async function ingestNewsFeeds(input: {
  persist: NewsPersist;
  now?: Date;
  fetchXml?: (url: string) => Promise<string>;
}): Promise<NewsIngestSummary> {
  const now = input.now ?? new Date();
  const persist = input.persist;
  const fetchXml = input.fetchXml ?? ((url: string) => fetchNewsFeedXml(url));

  const results = await runBatched(
    NEWS_SOURCES,
    async (source): Promise<NewsIngestSourceResult> => {
      const health = await persist.getHealth(source.id);
      if (!newsSourceIsLive(source.id, health)) {
        console.log(JSON.stringify({ msg: "news ingest skip", source: source.id }));
        return { source: source.id, fetched: 0, inserted: 0, skipped: true };
      }
      try {
        const xml = await fetchXml(source.feedUrl);
        const items = parseNewsFeed(xml, source.id, now);
        const inserted = await persist.upsertItems(items, now);
        await markHealth(persist, source.id, { now });
        console.log(
          JSON.stringify({
            msg: "news ingest source",
            source: source.id,
            fetched: items.length,
            inserted,
          }),
        );
        return { source: source.id, fetched: items.length, inserted };
      } catch (err) {
        const message = err instanceof Error ? err.message : "feed failed";
        console.error(JSON.stringify({ msg: "news ingest fail", source: source.id, error: message }));
        await markHealth(persist, source.id, { now, error: message });
        return { source: source.id, fetched: 0, inserted: 0, error: message };
      }
    },
    NEWS_INGEST_CONCURRENCY,
  );

  const purged = await persist.purgeBefore(newsWindowStart(now).toISOString());

  return {
    sources: NEWS_SOURCES.length,
    fetched: results.reduce((sum, row) => sum + row.fetched, 0),
    inserted: results.reduce((sum, row) => sum + row.inserted, 0),
    failed: results.filter((row) => row.error).length,
    skipped: results.filter((row) => row.skipped).length,
    purged,
    results,
  };
}
