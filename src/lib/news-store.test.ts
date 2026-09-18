import { describe, expect, it } from "vitest";

import {
  loadHomeNews,
  loadNewsItems,
  memoryNewsStore,
} from "./news-store";
import type { NormalizedNewsItem } from "./news-rss";

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
  it("upserts the same canonical URL once and keeps Home at 12 inside 30 days", async () => {
    const store = memoryNewsStore();
    const first = item(1, "2026-09-17T12:00:00.000Z");
    await store.putItems([first], NOW);
    await store.putItems([{ ...first, title: "Headline 1 again" }], NOW);
    const rows = await store.queryFeed({ limit: 20, now: NOW });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Headline 1 again");

    const batch = Array.from({ length: 15 }, (_, i) =>
      item(i + 1, "2026-09-17T12:00:00.000Z"),
    );
    await store.putItems(batch, NOW);
    await store.putItems([item(99, "2026-08-01T12:00:00.000Z")], NOW);
    const home = await loadHomeNews(NOW, store);
    expect(home).toHaveLength(12);
    expect(home.every((row) => row.published_at >= "2026-08-19T18:00:00.000Z")).toBe(true);

    const windowed = await loadNewsItems({ limit: 50, now: NOW, store });
    expect(windowed.rows.some((row) => row.url.endsWith("/h99"))).toBe(false);
  });
});
