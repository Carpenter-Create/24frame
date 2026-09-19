import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NewsHistory } from "./news-history";
import { NewsRail } from "./news-rail";
import {
  DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS,
  DASHBOARD_NEWS_HISTORY_LIST_CLASS,
  DASHBOARD_NEWS_HISTORY_THUMB_CLASS,
  DASHBOARD_NEWS_THUMB_CLASS,
  DASHBOARD_NEWS_SOURCE_CHIP_CLASS,
  DASHBOARD_NEWS_SOURCE_CHIP_OFF_CLASS,
  DASHBOARD_NEWS_SOURCE_CHIP_ON_CLASS,
  DASHBOARD_NEWS_SOURCE_CHIPS_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_ON_CLASS,
} from "@/lib/dashboard-craft";
import { HOUSE_FILTER_OFF_CLASS, HOUSE_FILTER_ON_CLASS } from "@/lib/house-shell";
import { NEWS_PAGE, NEWS_SOURCES, type NewsItem } from "@/lib/news";

const NOW = new Date("2026-09-18T18:00:00.000Z");

const VARIETY: NewsItem = {
  id: "n1",
  title: "Harbor Cut lands a festival slot",
  url: "https://variety.com/harbor-cut",
  source: "variety",
  published_at: "2026-09-17T12:00:00.000Z",
  image_url: "https://variety.com/thumbs/harbor.jpg",
};

const DEADLINE: NewsItem = {
  ...VARIETY,
  id: "n2",
  title: "North Wind books a limited run",
  url: "https://deadline.com/north-wind",
  source: "deadline",
  image_url: null,
};

function markupClass(value: string): string {
  return value.replaceAll("&", "&amp;");
}

describe("NewsHistory layout", () => {
  it("uses house chips under the title and a dense list — no Sources rail", () => {
    const html = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY, DEADLINE],
        now: NOW,
        selected: [],
      }),
    );
    expect(html).toContain("data-news-history-layout");
    expect(html).toContain(DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS);
    expect(html).not.toContain("lg:grid-cols-[minmax(0,1fr)_22rem]");
    expect(html).toContain("data-news-history-main");
    expect(html).toContain(DASHBOARD_NEWS_HISTORY_LIST_CLASS);
    expect(html).not.toContain("lg:grid-cols-2");
    expect(html).toContain('data-news-card-density="history"');
    expect(html).toContain("flex-col");
    expect(html).toContain("md:flex-row");
    expect(html).toContain("md:items-stretch");
    expect(html).toContain("w-full");
    expect(html).not.toContain("w-40");
    expect(html).toContain("md:w-80");
    expect(html).toContain(markupClass(DASHBOARD_NEWS_THUMB_CLASS));
    expect(html).toContain(markupClass(DASHBOARD_NEWS_HISTORY_THUMB_CLASS));
    expect(html).toContain("data-news-outbound");
    expect(html).toContain("data-house-action-arrow");
    expect(html).toContain("text-accent");
    expect(html).not.toMatch(/\b(Read|Open|Visit)\b/);
    expect(html.indexOf("data-news-thumb")).toBeLessThan(html.indexOf("Harbor Cut lands a festival slot"));
    expect(html).toContain("data-news-source-chips");
    expect(html).toContain(DASHBOARD_NEWS_SOURCE_CHIPS_CLASS);
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("no-scrollbar");
    expect(html).toContain(DASHBOARD_NEWS_SOURCE_CHIP_CLASS);
    expect(html).toContain(DASHBOARD_NEWS_SOURCE_CHIP_ON_CLASS);
    expect(html).toContain(DASHBOARD_NEWS_SOURCE_CHIP_OFF_CLASS);
    expect(DASHBOARD_NEWS_SOURCE_CHIP_CLASS).toContain(DASHBOARD_TOP_PILL_BUTTON_CLASS);
    expect(DASHBOARD_NEWS_SOURCE_CHIP_ON_CLASS).toBe(DASHBOARD_TOP_PILL_BUTTON_ON_CLASS);
    expect(DASHBOARD_NEWS_SOURCE_CHIP_OFF_CLASS).toBe(DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS);
    expect(DASHBOARD_NEWS_SOURCE_CHIP_ON_CLASS).toBe(HOUSE_FILTER_ON_CLASS);
    expect(DASHBOARD_NEWS_SOURCE_CHIP_OFF_CLASS).toBe(HOUSE_FILTER_OFF_CLASS);
    expect(html).toContain(NEWS_PAGE.sourcesAll);
    expect(html.indexOf('data-news-source-option="all"')).toBeLessThan(
      html.indexOf('data-news-source-option="indiewire"'),
    );
    for (const source of NEWS_SOURCES) {
      expect(html).toContain(source.label);
    }
    expect(html).toContain('href="/home/news?source=variety"');
    expect(html).not.toContain("data-news-sources-rail");
    expect(html).not.toContain("data-news-sources-phone");
    expect(html).not.toContain("data-news-sources-sheet");
    expect(html).not.toContain("data-news-sources-trigger");
    expect(html).not.toContain('data-overview-module="news-sources"');
    expect(html).not.toContain("type=\"checkbox\"");
    expect(html).not.toContain("AppearanceCheck");
  });

  it("filters All / one / multi and shows empty copy in the list column", () => {
    const all = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY, DEADLINE],
        now: NOW,
        selected: [],
      }),
    );
    expect(all).toContain("Harbor Cut lands a festival slot");
    expect(all).toContain("North Wind books a limited run");
    expect(all).toContain('data-news-source-option="all"');
    expect(all).toContain('aria-pressed="true"');
    expect(all).toMatch(
      /data-news-source-option="all"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-news-source-option="all"/,
    );

    const one = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY, DEADLINE],
        now: NOW,
        selected: ["variety"],
      }),
    );
    expect(one).toContain("Harbor Cut lands a festival slot");
    expect(one).not.toContain("North Wind books a limited run");
    expect(one).toContain('href="/home/news?source=variety,deadline"');
    expect(one).toContain('href="/home/news"');
    expect(one).toMatch(
      /data-news-source-option="variety"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-news-source-option="variety"/,
    );
    expect(one).not.toMatch(
      /data-news-source-option="all"[^>]*aria-pressed="true"|aria-pressed="true"[^>]*data-news-source-option="all"/,
    );

    const multi = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY, DEADLINE],
        now: NOW,
        selected: ["variety", "deadline"],
      }),
    );
    expect(multi).toContain("Harbor Cut lands a festival slot");
    expect(multi).toContain("North Wind books a limited run");
    expect(multi).toContain('href="/home/news?source=variety"');
    expect(multi).toContain('href="/home/news?source=deadline"');

    const empty = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY, DEADLINE],
        now: NOW,
        selected: ["joblo"],
      }),
    );
    expect(empty).toContain(NEWS_PAGE.filterEmpty);
    expect(empty).not.toContain("Harbor Cut lands a festival slot");
    expect(empty).toContain("data-news-history-main");
    expect(empty).toContain("data-news-source-chips");
  });
});

describe("Home News rail stays stacked", () => {
  it("does not apply the history list + Sources filter to Home", () => {
    const html = renderToStaticMarkup(
      createElement(NewsRail, { items: [VARIETY], now: NOW, viewAll: true }),
    );
    expect(html).toContain('data-news-card-density="home"');
    expect(html).not.toContain("data-news-history-layout");
    expect(html).not.toContain("data-news-source-chips");
    expect(html).not.toContain("data-news-sources-rail");
    expect(html).not.toContain("data-news-sources-phone");
    expect(html).not.toContain(markupClass(DASHBOARD_NEWS_HISTORY_THUMB_CLASS));
    expect(html).not.toContain("lg:grid-cols-2");
  });
});
