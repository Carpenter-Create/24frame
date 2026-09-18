import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  NEWS_CRON_SCHEDULE,
  NEWS_HOME_CAP,
  NEWS_HREF,
  NEWS_INGEST_PATH,
  NEWS_PAGE,
  NEWS_READ_REVALIDATE_SECONDS,
  NEWS_SOURCES,
  NEWS_WINDOW_MS,
  dedupeNewsHeadlines,
  newsInWindow,
  newsSourceIsLive,
  newsSourceLabel,
  newsWindowStart,
  overviewNewsHeadlines,
} from "./news";

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
  it("locks the name, Home cap, 30-day window, house cron, and allowlist", () => {
    expect(NEWS_PAGE.title).toBe("News");
    expect(NEWS_HREF).toBe("/news");
    expect(NEWS_PAGE.viewAll).toBe("View all");
    expect(NEWS_HOME_CAP).toBe(12);
    expect(NEWS_WINDOW_MS).toBe(30 * 24 * 60 * 60 * 1000);
    expect(NEWS_READ_REVALIDATE_SECONDS).toBe(60);
    expect(NEWS_INGEST_PATH).toBe("/api/cron/news-ingest");
    expect(NEWS_CRON_SCHEDULE).toBe("*/30 * * * *");
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
    const vercel = readFileSync("vercel.json", "utf8");
    expect(vercel).toContain(NEWS_INGEST_PATH);
    expect(vercel).toContain(NEWS_CRON_SCHEDULE);
    expect(readFileSync("docs/scheduled/news-ingest.md", "utf8")).toContain(NEWS_INGEST_PATH);
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

  it("skips a killed source and drops near-duplicate titles", () => {
    expect(
      newsSourceIsLive("indiewire", {
        source: "indiewire",
        enabled: false,
        last_success_at: null,
        last_error: null,
        last_error_at: null,
      }),
    ).toBe(false);
    expect(
      dedupeNewsHeadlines([
        item(1, "2026-09-17T12:00:00.000Z"),
        { ...item(2, "2026-09-17T13:00:00.000Z"), title: "Headline 1" },
      ]),
    ).toHaveLength(1);
  });
});
