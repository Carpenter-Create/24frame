import { describe, expect, it } from "vitest";

import { NEWS_HOME_CAP, NEWS_WINDOW_MS, newsItemTtlEpoch } from "./news";
import type { NormalizedNewsItem } from "./news-rss";
import { memoryNewsStore } from "./news-store";

const NOW = new Date("2026-09-18T18:00:00.000Z");

function item(n: number, published_at: string): NormalizedNewsItem {
  return {
    title: `Headline ${n}`,
    url: `https://variety.com/h${n}`,
    canonical_url: `https://variety.com/h${n}`,
    source: "variety",
    published_at,
    image_url: null,
  };
}

describe("memoryNewsStore", () => {
  it("upserts the same canonical URL once and keeps Home at 15 inside 90 days", async () => {
    const store = memoryNewsStore();
    const first = item(1, "2026-09-17T12:00:00.000Z");
    await store.upsertItems([first], NOW);
    await store.upsertItems([{ ...first, title: "Headline 1 again" }], NOW);
    const rows = await store.queryFeed({ limit: 20, now: NOW });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Headline 1 again");
    expect(newsItemTtlEpoch(first.published_at)).toBe(
      Math.floor((Date.parse(first.published_at) + NEWS_WINDOW_MS) / 1000),
    );

    const batch = Array.from({ length: 18 }, (_, i) =>
      item(i + 1, "2026-09-17T12:00:00.000Z"),
    );
    await store.upsertItems(batch, NOW);
    await store.upsertItems([item(99, "2026-06-01T12:00:00.000Z")], NOW);
    const home = await store.queryFeed({ limit: NEWS_HOME_CAP, now: NOW });
    expect(NEWS_HOME_CAP).toBe(15);
    expect(home).toHaveLength(15);
    expect(home.every((row) => row.published_at >= "2026-06-20T18:00:00.000Z")).toBe(true);

    const windowed = await store.queryFeed({ limit: 50, now: NOW });
    expect(windowed.some((row) => row.url.endsWith("/h99"))).toBe(false);
    expect(await store.purgeBefore("2026-06-20T18:00:00.000Z")).toBe(1);
  });
});
