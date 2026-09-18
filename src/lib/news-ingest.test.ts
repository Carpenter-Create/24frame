import { describe, expect, it, vi } from "vitest";

import { NEWS_SOURCES } from "./news";
import { ingestNewsFeeds } from "./news-ingest";
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

    const summary = await ingestNewsFeeds({ persist, now: NOW, fetchXml });

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
    const summary = await ingestNewsFeeds({ persist, now: NOW, fetchXml });
    expect(summary.purged).toBe(1);
    expect(await persist.purgeBefore("2026-08-19T18:00:00.000Z")).toBe(0);
    const rows = await persist.queryFeed({ limit: 20, now: NOW });
    expect(rows.filter((row) => row.url === "https://variety.com/live")).toHaveLength(1);
  });
});
