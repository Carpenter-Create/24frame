import { NEWS_SOURCES, newsSourceIsLive, newsWindowStart, type NewsSourceId } from "@/lib/news";
import { parseNewsFeed, parseOgImageUrl, type NormalizedNewsItem } from "@/lib/news-rss";
import { createNewsIngestStore, type NewsPersist } from "@/lib/news-store";

// Scheduled News ingest (Lambda + EventBridge). Fail-soft per source.
// Persist to DynamoDB only — never fan-out RSS on a page read.
// RSS media/enclosure first; OG-scrape the article only when image_url
// is null. One bad article URL must not fail the source or the run.

export const NEWS_FEED_TIMEOUT_MS = 8_000;
export const NEWS_FEED_MAX_BYTES = 1_500_000;
export const NEWS_OG_TIMEOUT_MS = 4_000;
export const NEWS_OG_MAX_BYTES = 512_000;
export const NEWS_INGEST_CONCURRENCY = 3;
export const NEWS_OG_CONCURRENCY = 4;
export const NEWS_USER_AGENT = "24FrameNews/1.0";

export type { NewsPersist };

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

export async function fetchNewsArticleHtml(
  url: string,
  init: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<string | null> {
  if (!/^https:\/\//i.test(url)) return null;
  const fetchImpl = init.fetchImpl ?? fetch;
  const timeoutMs = init.timeoutMs ?? NEWS_OG_TIMEOUT_MS;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const work = (async (): Promise<string | null> => {
    const res = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": NEWS_USER_AGENT,
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const slice = buf.byteLength > NEWS_OG_MAX_BYTES ? buf.subarray(0, NEWS_OG_MAX_BYTES) : buf;
    return new TextDecoder("utf-8").decode(slice);
  })().catch(() => null);

  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function fillNewsOgImages(
  items: readonly NormalizedNewsItem[],
  init: {
    fetchHtml?: (url: string) => Promise<string | null>;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<NormalizedNewsItem[]> {
  const fetchHtml =
    init.fetchHtml ??
    ((url: string) =>
      fetchNewsArticleHtml(url, { fetchImpl: init.fetchImpl, timeoutMs: init.timeoutMs }));
  const missing = items.filter((item) => !item.image_url);
  if (missing.length === 0) return items.map((item) => item);

  const scraped = new Map<string, string | null>();
  await runPooled(
    missing,
    async (item) => {
      try {
        const html = await fetchHtml(item.url);
        scraped.set(item.canonical_url, html ? parseOgImageUrl(html, item.url) : null);
      } catch {
        scraped.set(item.canonical_url, null);
      }
    },
    NEWS_OG_CONCURRENCY,
  );

  return items.map((item) => {
    if (item.image_url) return item;
    return { ...item, image_url: scraped.get(item.canonical_url) ?? null };
  });
}

/** Sliding pool — a slow URL holds one slot, not the rest of the batch. */
async function runPooled<T>(
  items: readonly T[],
  worker: (item: T) => Promise<void>,
  concurrency: number,
): Promise<void> {
  if (items.length === 0) return;
  let next = 0;
  async function pump() {
    while (next < items.length) {
      const i = next;
      next += 1;
      await worker(items[i]!);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, () => pump()),
  );
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
  persist?: NewsPersist;
  now?: Date;
  fetchXml?: (url: string) => Promise<string>;
  fetchOgHtml?: (url: string) => Promise<string | null>;
}): Promise<NewsIngestSummary> {
  const now = input.now ?? new Date();
  const persist = input.persist ?? createNewsIngestStore();
  const fetchXml = input.fetchXml ?? ((url: string) => fetchNewsFeedXml(url));
  const fetchOgHtml = input.fetchOgHtml;

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
        const parsed = parseNewsFeed(xml, source.id, now);
        let items = parsed;
        try {
          items = await fillNewsOgImages(parsed, { fetchHtml: fetchOgHtml });
        } catch {
          items = parsed;
        }
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
