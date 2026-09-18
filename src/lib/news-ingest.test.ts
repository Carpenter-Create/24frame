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

describe("ingestNewsFeeds", () => {
  it("fails soft per source, skips a killed source, and upserts the rest", async () => {
    const store = memoryNewsStore();
    await store.putHealth({
      source: "indiewire",
      enabled: false,
      last_success_at: null,
      last_error: null,
      last_error_at: null,
    });
    const persist = vi.fn(async (items: readonly NormalizedNewsItem[]) => items.length);
    const fetchXml = vi.fn(async (url: string) => {
      if (url === "https://deadline.com/feed/") throw new Error("timeout");
      return FEED;
    });

    const summary = await ingestNewsFeeds({
      store,
      now: NOW,
      fetchXml,
      persist,
    });

    expect(fetchXml).toHaveBeenCalledTimes(NEWS_SOURCES.length - 1);
    expect(fetchXml.mock.calls.flat()).not.toContain("https://www.indiewire.com/feed/");
    expect(summary.sources).toBe(11);
    expect(summary.failed).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.results.find((row) => row.source === "deadline")?.error).toBe("timeout");
    expect(summary.results.find((row) => row.source === "indiewire")?.skipped).toBe(true);
    expect(summary.inserted).toBeGreaterThan(0);
    expect((await store.getHealth("deadline"))?.last_error).toBe("timeout");
    expect((await store.getHealth("variety"))?.last_success_at).toBe(NOW.toISOString());
  });
});
