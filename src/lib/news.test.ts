import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { NEWS_INGEST_FUNCTION } from "./news-aws";
import {
  NEWS_HOME_CAP,
  NEWS_HREF,
  NEWS_INGEST_PATH,
  NEWS_PAGE,
  NEWS_READ_REVALIDATE_SECONDS,
  NEWS_SOURCES,
  NEWS_WINDOW_MS,
  newsInWindow,
  newsSourceLabel,
  newsWindowStart,
  overviewNewsHeadlines,
} from "./news";
import { loadNewsItems, memoryNewsStore } from "./news-store";

const NOW = new Date("2026-09-18T18:00:00.000Z");

function item(n: number, published_at: string) {
  return {
    id: `n${n}`,
    title: `Headline ${n}`,
    url: `https://variety.com/h${n}`,
    source: "variety" as const,
    published_at,
    image_url: null,
  };
}

describe("News SoT", () => {
  it("locks the name, Home cap, 30-day window, and allowlist", () => {
    expect(NEWS_PAGE.title).toBe("News");
    expect(NEWS_HREF).toBe("/news");
    expect(NEWS_PAGE.viewAll).toBe("View all");
    expect(NEWS_HOME_CAP).toBe(12);
    expect(NEWS_WINDOW_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(NEWS_READ_REVALIDATE_SECONDS).toBe(60);
    expect(NEWS_INGEST_PATH).toBe(NEWS_INGEST_FUNCTION);
    expect(NEWS_SOURCES.map((source) => source.label)).toEqual([
      "IndieWire",
      "Variety",
      "Deadline",
      "Hollywood Reporter",
      "TVLine",
      "No Film School",
      "Filmmaker Magazine",
      "MovieMaker",
      "JoBlo",
      "Film Threat",
      "Screen Daily",
    ]);
    expect(NEWS_SOURCES.every((source) => source.enabled)).toBe(true);
    expect(newsSourceLabel("variety")).toBe("Variety");
    expect(JSON.stringify(NEWS_PAGE)).not.toMatch(/summary|rewrite|republish/i);
    expect(readFileSync("vercel.json", "utf8")).not.toContain("news-ingest");
    expect(readFileSync("docs/infra/news-aws-setup.md", "utf8")).toContain(NEWS_INGEST_FUNCTION);
  });

  it("caps Home at 12 and hides items outside the 30-day window", () => {
    const rows = Array.from({ length: 15 }, (_, i) =>
      item(i + 1, "2026-09-17T12:00:00.000Z"),
    );
    expect(overviewNewsHeadlines(rows)).toHaveLength(12);
    expect(overviewNewsHeadlines(rows).map((row) => row.id)).toEqual(
      rows.slice(0, 12).map((row) => row.id),
    );
    expect(newsWindowStart(NOW).toISOString()).toBe("2026-08-19T18:00:00.000Z");
    expect(newsInWindow("2026-09-01T00:00:00.000Z", NOW)).toBe(true);
    expect(newsInWindow("2026-08-19T18:00:00.000Z", NOW)).toBe(true);
    expect(newsInWindow("2026-08-18T17:59:59.000Z", NOW)).toBe(false);
    expect(newsInWindow("2026-09-19T00:00:00.000Z", NOW)).toBe(false);
  });
});

describe("loadNewsItems", () => {
  it("reads the store window and does not fan out RSS", async () => {
    const store = memoryNewsStore(
      Array.from({ length: 13 }, (_, i) => item(i + 1, "2026-09-17T12:00:00.000Z")),
    );
    const loaded = await loadNewsItems({ limit: 12, now: NOW, store });
    expect(loaded.rows).toHaveLength(12);
    expect(loaded.truncated).toBe(true);
    expect(loaded.failed).toBe(false);
    expect(JSON.stringify(loaded.rows)).not.toMatch(/summary/i);
  });
});
