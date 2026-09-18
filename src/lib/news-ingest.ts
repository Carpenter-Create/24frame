import { NEWS_SOURCES, newsSourceIsLive, newsWindowStart, type NewsSourceId } from "@/lib/news";
import { parseNewsFeed } from "@/lib/news-rss";
import { createNewsIngestStore, type NewsPersist } from "@/lib/news-store";

// Scheduled News ingest (Lambda + EventBridge). Fail-soft per source.
// Persist to DynamoDB only — never fan-out RSS on a page read.

export const NEWS_FEED_TIMEOUT_MS = 8_000;
export const NEWS_FEED_MAX_BYTES = 1_500_000;
export const NEWS_INGEST_CONCURRENCY = 3;
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
}): Promise<NewsIngestSummary> {
  const now = input.now ?? new Date();
  const persist = input.persist ?? createNewsIngestStore();
  const fetchXml = input.fetchXml ?? ((url: string) => fetchNewsFeedXml(url));

  const results = await runBatched(
    NEWS_SOURCES,
    async (source): Promise<NewsIngestSourceResult> => {
      try {
        const health = await persist.getHealth(source.id);
        if (!newsSourceIsLive(source.id, health)) {
          console.log(JSON.stringify({ msg: "news ingest skip", source: source.id }));
          return { source: source.id, fetched: 0, inserted: 0, skipped: true };
        }
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
        try {
          await markHealth(persist, source.id, { now, error: message });
        } catch {
          // Health write must not fail the rest of the run.
        }
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
