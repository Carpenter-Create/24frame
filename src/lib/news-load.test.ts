import { beforeEach, describe, expect, it, vi } from "vitest";

import { NEWS_HOME_CAP } from "./news";
import {
  loadHomeNews,
  loadNewsItems,
  newsReadCacheKey,
  peekNewsReadCache,
  resetNewsReadCache,
} from "./news-load";

const NOW = new Date("2026-09-18T18:00:00.000Z");

function item(n: number, published_at: string, title = `Headline ${n}`) {
  return {
    id: `n${n}`,
    title,
    url: `https://variety.com/h${n}`,
    source: "variety",
    published_at,
    image_url: null,
  };
}

function fakeClient(result: { data: unknown; error: { message: string } | null }) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "gte", "lte", "order"]) {
    builder[method] = vi.fn(() => builder);
  }
  builder.range = vi.fn(async () => result);
  return {
    from: vi.fn((table: string) => {
      if (table !== "news_items") throw new Error(`unexpected table ${table}`);
      return builder;
    }),
    builder,
  };
}

beforeEach(() => {
  resetNewsReadCache();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("loadNewsItems", () => {
  it("caps Home at 12, hides rows outside 30 days, and does not fan out RSS", async () => {
    const rows = [
      ...Array.from({ length: 13 }, (_, i) => item(i + 1, "2026-09-17T12:00:00.000Z")),
      item(99, "2026-08-01T12:00:00.000Z"),
    ];
    const supabase = fakeClient({ data: rows, error: null });
    const home = await loadHomeNews(supabase as never, NOW);
    expect(home).toHaveLength(NEWS_HOME_CAP);
    expect(home.every((row) => row.published_at >= "2026-08-19T18:00:00.000Z")).toBe(true);
    expect(home.some((row) => row.url.endsWith("/h99"))).toBe(false);
    expect(JSON.stringify(home)).not.toMatch(/summary/i);
    expect(supabase.from).toHaveBeenCalledWith("news_items");
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  it("dedupes the same source title so Home is not spammed", async () => {
    const supabase = fakeClient({
      data: [
        item(1, "2026-09-17T12:00:00.000Z", "Harbor Cut lands a festival slot"),
        {
          ...item(2, "2026-09-17T13:00:00.000Z", "Harbor Cut lands a festival slot"),
          url: "https://variety.com/harbor-cut-alt",
        },
      ],
      error: null,
    });
    const loaded = await loadNewsItems(supabase as never, { limit: 12, now: NOW });
    expect(loaded.rows).toHaveLength(1);
  });

  it("does not cache a failed read as empty news", async () => {
    const failed = fakeClient({ data: null, error: { message: "boom" } });
    const first = await loadNewsItems(failed as never, { limit: 12, now: NOW });
    expect(first.failed).toBe(true);
    expect(first.rows).toEqual([]);
    expect(peekNewsReadCache(newsReadCacheKey(12, NOW), NOW)).toBeNull();

    const ok = fakeClient({
      data: [item(1, "2026-09-17T12:00:00.000Z")],
      error: null,
    });
    const second = await loadNewsItems(ok as never, { limit: 12, now: NOW });
    expect(second.failed).toBe(false);
    expect(second.rows).toHaveLength(1);
  });
});
