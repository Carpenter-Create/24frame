import { describe, expect, it, vi } from "vitest";

import { NEWS_SOURCES } from "./news";
import { ingestNewsFeeds } from "./news-ingest";
import type { NormalizedNewsItem } from "./news-rss";

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
  it("fails soft per source and still persists the others", async () => {
    const persist = vi.fn(async (items: readonly NormalizedNewsItem[]) => items.length);
    const fetchXml = vi.fn(async (url: string) => {
      if (url === "https://deadline.com/feed/") throw new Error("timeout");
      return FEED;
    });

    const summary = await ingestNewsFeeds({
      supabase: {} as never,
      now: NOW,
      fetchXml,
      persist,
    });

    expect(fetchXml).toHaveBeenCalledTimes(NEWS_SOURCES.length);
    expect(summary.sources).toBe(11);
    expect(summary.failed).toBe(1);
    expect(summary.results.find((row) => row.source === "deadline")?.error).toBe("timeout");
    expect(summary.inserted).toBeGreaterThan(0);
    expect(persist).toHaveBeenCalled();
    const persistedSources = persist.mock.calls.map((call) => call[0][0]?.source);
    expect(persistedSources).not.toContain("deadline");
  });
});
