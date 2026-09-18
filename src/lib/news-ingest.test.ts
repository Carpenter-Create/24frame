import { describe, expect, it, vi } from "vitest";

import { NEWS_SOURCES } from "./news";
import {
  NEWS_OG_CONCURRENCY,
  NEWS_OG_TIMEOUT_MS,
  fetchNewsArticleHtml,
  fillNewsOgImages,
  ingestNewsFeeds,
} from "./news-ingest";
import type { NormalizedNewsItem } from "./news-rss";
import { memoryNewsStore } from "./news-store";

const NOW = new Date("2026-09-18T18:00:00.000Z");

const FEED = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Live item</title>
      <link>https://variety.com/live</link>
      <pubDate>Thu, 17 Sep 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

function liveItem(): NormalizedNewsItem {
  return {
    title: "Live item",
    url: "https://variety.com/live",
    canonical_url: "https://variety.com/live",
    source: "variety",
    published_at: "2026-09-17T12:00:00.000Z",
    image_url: null,
  };
}

describe("ingestNewsFeeds", () => {
  it("fails soft per source, skips a killed source, and upserts the rest", async () => {
    const persist = memoryNewsStore();
    await persist.putHealth({
      source: "indiewire",
      enabled: false,
      last_success_at: null,
      last_error: null,
      last_error_at: null,
    });
    const fetchXml = vi.fn(async (url: string) => {
      if (url === "https://deadline.com/feed/") throw new Error("timeout");
      return FEED;
    });

    const summary = await ingestNewsFeeds({
      persist,
      now: NOW,
      fetchXml,
      fetchOgHtml: async () => null,
    });

    expect(fetchXml).toHaveBeenCalledTimes(NEWS_SOURCES.length - 1);
    expect(fetchXml.mock.calls.flat()).not.toContain("https://www.indiewire.com/feed/");
    expect(summary.sources).toBe(11);
    expect(summary.failed).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.results.find((row) => row.source === "deadline")?.error).toBe("timeout");
    expect(summary.results.find((row) => row.source === "indiewire")?.skipped).toBe(true);
    expect(summary.inserted).toBeGreaterThan(0);
    expect((await persist.getHealth("deadline"))?.last_error).toBe("timeout");
    expect((await persist.getHealth("variety"))?.last_success_at).toBe(NOW.toISOString());
  });

  it("upserts the same canonical URL once and purges rows older than 30 days", async () => {
    const persist = memoryNewsStore();
    await persist.upsertItems(
      [
        liveItem(),
        {
          ...liveItem(),
          title: "Old headline",
          url: "https://variety.com/old",
          canonical_url: "https://variety.com/old",
          published_at: "2026-08-01T12:00:00.000Z",
        },
      ],
      NOW,
    );
    const first = liveItem();
    await persist.upsertItems([first], NOW);
    await persist.upsertItems([{ ...first, title: "Live item again" }], NOW);
    const fetchXml = vi.fn(async () => FEED);
    const summary = await ingestNewsFeeds({
      persist,
      now: NOW,
      fetchXml,
      fetchOgHtml: async () => null,
    });
    expect(summary.purged).toBe(1);
    expect(await persist.purgeBefore("2026-08-19T18:00:00.000Z")).toBe(0);
    const rows = await persist.queryFeed({ limit: 20, now: NOW });
    expect(rows.filter((row) => row.url === "https://variety.com/live")).toHaveLength(1);
  });
});

const EMPTY_FEED = `<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>`;

const FEED_WITH_THUMB = `<?xml version="1.0"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <item>
      <title>Has RSS image</title>
      <link>https://variety.com/has-thumb</link>
      <pubDate>Thu, 17 Sep 2026 12:00:00 GMT</pubDate>
      <media:thumbnail url="https://variety.com/thumbs/rss.jpg" />
    </item>
  </channel>
</rss>`;

const FEED_NO_THUMB = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Needs OG</title>
      <link>https://hollywoodreporter.com/needs-og</link>
      <pubDate>Thu, 17 Sep 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

function varietyOnlyXml(feed: string) {
  return async (url: string) => (url === "https://variety.com/feed/" ? feed : EMPTY_FEED);
}

describe("ingest OG images", () => {
  it("does not scrape when RSS already has an image", async () => {
    const persist = memoryNewsStore();
    const fetchOgHtml = vi.fn(async () => {
      throw new Error("should not scrape");
    });
    await ingestNewsFeeds({
      persist,
      now: NOW,
      fetchXml: varietyOnlyXml(FEED_WITH_THUMB),
      fetchOgHtml,
    });
    expect(fetchOgHtml).not.toHaveBeenCalled();
    const rows = await persist.queryFeed({ limit: 20, now: NOW });
    expect(rows[0]?.image_url).toBe("https://variety.com/thumbs/rss.jpg");
  });

  it("OG-scrapes when RSS has no image and stores the absolute https URL", async () => {
    const persist = memoryNewsStore();
    const fetchOgHtml = vi.fn(async (url: string) => {
      expect(url).toBe("https://hollywoodreporter.com/needs-og");
      return `<html><head><meta property="og:image" content="http://www.thr.com/og.jpg" /></head></html>`;
    });
    await ingestNewsFeeds({
      persist,
      now: NOW,
      fetchXml: async (url: string) =>
        url === "https://www.hollywoodreporter.com/feed/" ? FEED_NO_THUMB : EMPTY_FEED,
      fetchOgHtml,
    });
    expect(fetchOgHtml).toHaveBeenCalledTimes(1);
    const rows = await persist.queryFeed({ limit: 20, now: NOW });
    expect(rows[0]?.image_url).toBe("https://thr.com/og.jpg");
  });

  it("keeps a grey plate when OG scrape fails and does not fail the source", async () => {
    const persist = memoryNewsStore();
    const fetchOgHtml = vi.fn(async () => {
      throw new Error("timeout");
    });
    const summary = await ingestNewsFeeds({
      persist,
      now: NOW,
      fetchXml: async (url: string) =>
        url === "https://www.hollywoodreporter.com/feed/" ? FEED_NO_THUMB : EMPTY_FEED,
      fetchOgHtml,
    });
    expect(summary.failed).toBe(0);
    expect(summary.results.find((row) => row.source === "hollywood-reporter")?.error).toBeUndefined();
    const rows = await persist.queryFeed({ limit: 20, now: NOW });
    expect(rows[0]?.image_url).toBeNull();
  });

  it("scrapes missing images independently — one miss does not drop a sibling hit", async () => {
    const persist = memoryNewsStore();
    const mixed = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Hit</title>
      <link>https://hollywoodreporter.com/hit</link>
      <pubDate>Thu, 17 Sep 2026 12:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Miss</title>
      <link>https://hollywoodreporter.com/miss</link>
      <pubDate>Thu, 17 Sep 2026 13:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;
    const fetchOgHtml = vi.fn(async (url: string) => {
      if (url === "https://hollywoodreporter.com/miss") throw new Error("timeout");
      return `<meta property="og:image" content="https://thr.com/hit.jpg" />`;
    });
    const summary = await ingestNewsFeeds({
      persist,
      now: NOW,
      fetchXml: async (url: string) =>
        url === "https://www.hollywoodreporter.com/feed/" ? mixed : EMPTY_FEED,
      fetchOgHtml,
    });
    expect(summary.failed).toBe(0);
    const rows = await persist.queryFeed({ limit: 20, now: NOW });
    expect(rows.find((row) => row.url === "https://hollywoodreporter.com/hit")?.image_url).toBe(
      "https://thr.com/hit.jpg",
    );
    expect(rows.find((row) => row.url === "https://hollywoodreporter.com/miss")?.image_url).toBeNull();
  });
});

describe("fetchNewsArticleHtml", () => {
  it("uses a 4s hard timeout and fail-softs to null", async () => {
    expect(NEWS_OG_TIMEOUT_MS).toBe(4_000);
    expect(NEWS_OG_CONCURRENCY).toBe(4);
    const html = await fetchNewsArticleHtml("https://hollywoodreporter.com/story", {
      fetchImpl: async () => {
        throw new Error("aborted");
      },
    });
    expect(html).toBeNull();
    expect(
      await fetchNewsArticleHtml("https://hollywoodreporter.com/story", {
        fetchImpl: async () => new Response("nope", { status: 503 }),
      }),
    ).toBeNull();
  });
});

describe("fillNewsOgImages", () => {
  it("skips items that already have image_url", async () => {
    const fetchHtml = vi.fn(async () => "<meta property=\"og:image\" content=\"https://x.com/x.jpg\" />");
    const [kept] = await fillNewsOgImages(
      [{ ...liveItem(), image_url: "https://variety.com/thumbs/rss.jpg" }],
      { fetchHtml },
    );
    expect(kept?.image_url).toBe("https://variety.com/thumbs/rss.jpg");
    expect(fetchHtml).not.toHaveBeenCalled();
  });
});
