import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { NEWS_INGEST_FUNCTION, NEWS_INGEST_SCHEDULE } from "./news-aws";
import {
  NEWS_HOME_CAP,
  NEWS_HOME_HREF,
  NEWS_HREF,
  NEWS_INGEST_PATH,
  NEWS_PAGE,
  newsHistoryBackLink,
  NEWS_READ_REVALIDATE_SECONDS,
  NEWS_SOURCE_IDS,
  NEWS_SOURCES,
  NEWS_WINDOW_DAYS,
  NEWS_WINDOW_MS,
  compareNewsSourceLabel,
  dedupeNewsHeadlines,
  newsInWindow,
  newsItemTtlEpoch,
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
  it("locks the name, Home cap, 90-day window, EventBridge ingest, and allowlist", () => {
    expect(NEWS_PAGE.title).toBe("Industry news");
    expect(NEWS_PAGE.title).not.toBe("News");
    expect(NEWS_HOME_HREF).toBe("/home");
    expect(NEWS_HREF).toBe("/home/news");
    expect(NEWS_HREF.startsWith(`${NEWS_HOME_HREF}/`)).toBe(true);
    expect(NEWS_PAGE.back).toBe("Home");
    expect(NEWS_PAGE.backHref).toBe(NEWS_HOME_HREF);
    expect(newsHistoryBackLink()).toEqual({ href: "/home", label: "Home" });
    expect(NEWS_PAGE.viewAll).toBe("View all");
    expect(NEWS_PAGE.sources).toBe("Sources");
    expect(NEWS_PAGE.sourcesAll).toBe("All");
    expect(NEWS_PAGE.filterEmpty).toBe("No headlines from the selected sources.");
    expect(NEWS_HOME_CAP).toBe(15);
    expect(NEWS_WINDOW_DAYS).toBe(90);
    expect(NEWS_WINDOW_MS).toBe(90 * 24 * 60 * 60 * 1000);
    expect(NEWS_READ_REVALIDATE_SECONDS).toBe(60);
    expect(NEWS_INGEST_PATH).toBe(NEWS_INGEST_FUNCTION);
    expect(NEWS_INGEST_SCHEDULE).toBe("rate(30 minutes)");
    expect(NEWS_SOURCES.map((source) => source.label)).toEqual([
      "Deadline",
      "Film Threat",
      "Filmmaker Magazine",
      "Hollywood Reporter",
      "IndieWire",
      "JoBlo",
      "MovieMaker",
      "No Film School",
      "Screen Daily",
      "TVLine",
      "Variety",
    ]);
    expect(NEWS_SOURCE_IDS).toEqual(NEWS_SOURCES.map((source) => source.id));
    expect(compareNewsSourceLabel("tvline", "TVLine")).toBe(0);
    expect(compareNewsSourceLabel("Deadline", "filmmaker magazine")).toBeLessThan(0);
    expect(NEWS_SOURCES.every((source) => source.enabled)).toBe(true);
    expect(newsSourceLabel("variety")).toBe("Variety");
    expect(JSON.stringify(NEWS_PAGE)).not.toMatch(/summary|rewrite|republish/i);
    const card = readFileSync("src/components/news/news-card.tsx", "utf8");
    const rail = readFileSync("src/components/news/news-rail.tsx", "utf8");
    const history = readFileSync("src/components/news/news-history.tsx", "utf8");
    expect(card).not.toContain("socialRelativeTime");
    expect(card).not.toContain("data-news-time");
    expect(card).not.toContain("DashboardHomeStatusPill");
    expect(card).not.toContain("data-dashboard-status-pill");
    expect(card).toContain("DASHBOARD_NEWS_OUTLET_CLASS");
    expect(card).not.toMatch(/\bago\b/);
    expect(rail).not.toContain("socialRelativeTime");
    expect(history).not.toContain("socialRelativeTime");
    expect(readFileSync("vercel.json", "utf8")).not.toContain("news-ingest");
    expect(readFileSync("docs/infra/news-aws-setup.md", "utf8")).toContain(NEWS_INGEST_FUNCTION);
    expect(readFileSync("docs/infra/news-aws-setup.md", "utf8")).toContain(NEWS_INGEST_SCHEDULE);
  });

  it("caps Home at 15, hides items outside 90 days, and stamps TTL", () => {
    const rows = Array.from({ length: 18 }, (_, i) =>
      item(i + 1, "2026-09-17T12:00:00.000Z"),
    );
    expect(overviewNewsHeadlines(rows)).toHaveLength(15);
    expect(overviewNewsHeadlines(rows).map((row) => row.id)).toEqual(
      rows.slice(0, 15).map((row) => row.id),
    );
    expect(newsWindowStart(NOW).toISOString()).toBe("2026-06-20T18:00:00.000Z");
    expect(newsInWindow("2026-09-01T00:00:00.000Z", NOW)).toBe(true);
    expect(newsInWindow("2026-06-20T18:00:00.000Z", NOW)).toBe(true);
    expect(newsInWindow("2026-06-19T17:59:59.000Z", NOW)).toBe(false);
    expect(newsInWindow("2026-09-19T00:00:00.000Z", NOW)).toBe(false);
    expect(newsItemTtlEpoch("2026-09-17T12:00:00.000Z")).toBe(
      Math.floor((Date.parse("2026-09-17T12:00:00.000Z") + NEWS_WINDOW_MS) / 1000),
    );
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
