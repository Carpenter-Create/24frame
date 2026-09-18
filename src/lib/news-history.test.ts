import { describe, expect, it } from "vitest";

import {
  NEWS_HREF,
  NEWS_PAGE,
  NEWS_SOURCE_IDS,
  NEWS_SOURCE_PARAM,
  NEWS_WINDOW_DAYS,
  NEWS_WINDOW_MS,
  canonicalizeNewsSourceFilter,
  filterNewsBySources,
  newsHistoryEmptyCopy,
  newsHistoryHref,
  newsSourceFilterIsAll,
  newsSourceFilterLabel,
  parseNewsSourceFilter,
  toggleNewsSourceFilter,
  type NewsItem,
} from "./news";

function item(id: string, source: NewsItem["source"]): NewsItem {
  return {
    id,
    title: id,
    url: `https://example.com/${id}`,
    source,
    published_at: "2026-09-17T12:00:00.000Z",
    image_url: null,
  };
}

describe("news history source filter URL", () => {
  it("treats absent, empty, all, and invalid-only as All", () => {
    expect(parseNewsSourceFilter(undefined)).toEqual([]);
    expect(parseNewsSourceFilter(null)).toEqual([]);
    expect(parseNewsSourceFilter("")).toEqual([]);
    expect(parseNewsSourceFilter("all")).toEqual([]);
    expect(parseNewsSourceFilter("not-a-source")).toEqual([]);
    expect(newsSourceFilterIsAll([])).toBe(true);
    expect(newsHistoryHref([])).toBe(NEWS_HREF);
    expect(NEWS_SOURCE_PARAM).toBe("source");
  });

  it("parses one source and writes a single ?source= id", () => {
    expect(parseNewsSourceFilter("variety")).toEqual(["variety"]);
    expect(newsHistoryHref(["variety"])).toBe(`${NEWS_HREF}?source=variety`);
    expect(newsSourceFilterIsAll(["variety"])).toBe(false);
    expect(newsSourceFilterLabel(["variety"])).toBe("Variety");
  });

  it("parses multi via comma-separated or repeated params and canonicalizes order", () => {
    expect(parseNewsSourceFilter("deadline,variety")).toEqual(["variety", "deadline"]);
    expect(parseNewsSourceFilter(["deadline", "variety"])).toEqual(["variety", "deadline"]);
    expect(parseNewsSourceFilter("variety,deadline,not-a-source")).toEqual([
      "variety",
      "deadline",
    ]);
    expect(newsHistoryHref(["deadline", "variety"])).toBe(
      `${NEWS_HREF}?source=variety,deadline`,
    );
    expect(newsSourceFilterLabel(["variety", "deadline"])).toBe("Variety, Deadline");
  });

  it("toggles All → one → multi → All", () => {
    expect(toggleNewsSourceFilter([], "variety")).toEqual(["variety"]);
    expect(toggleNewsSourceFilter(["variety"], "deadline")).toEqual(["variety", "deadline"]);
    expect(toggleNewsSourceFilter(["variety", "deadline"], "variety")).toEqual(["deadline"]);
    expect(toggleNewsSourceFilter(["deadline"], "deadline")).toEqual([]);
    expect(canonicalizeNewsSourceFilter([...NEWS_SOURCE_IDS])).toEqual([]);
  });
});

describe("news history source filter rows", () => {
  const rows = [
    item("v", "variety"),
    item("d", "deadline"),
    item("i", "indiewire"),
  ];

  it("keeps every row for All and filters one / multi / empty", () => {
    expect(filterNewsBySources(rows, []).map((row) => row.id)).toEqual(["v", "d", "i"]);
    expect(filterNewsBySources(rows, ["variety"]).map((row) => row.id)).toEqual(["v"]);
    expect(filterNewsBySources(rows, ["variety", "deadline"]).map((row) => row.id)).toEqual([
      "v",
      "d",
    ]);
    expect(filterNewsBySources(rows, ["joblo"])).toEqual([]);
    expect(newsHistoryEmptyCopy([], [])).toBe(NEWS_PAGE.empty);
    expect(newsHistoryEmptyCopy(rows, [])).toBe(NEWS_PAGE.filterEmpty);
  });
});

describe("news history retention window", () => {
  it("locks 90 days for history / TTL / query — not the Home cap", () => {
    expect(NEWS_WINDOW_DAYS).toBe(90);
    expect(NEWS_WINDOW_MS).toBe(90 * 24 * 60 * 60 * 1000);
    expect(NEWS_PAGE.empty).toContain("90 days");
    expect(NEWS_PAGE.subtitle).toContain("90 days");
    expect(NEWS_PAGE.empty).not.toContain("30 days");
  });
});
