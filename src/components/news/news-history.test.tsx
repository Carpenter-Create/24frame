import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NewsHistory } from "./news-history";
import { NewsRail } from "./news-rail";
import {
  DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS,
  DASHBOARD_NEWS_HISTORY_LIST_CLASS,
  DASHBOARD_NEWS_HISTORY_THUMB_CLASS,
  DASHBOARD_NEWS_SOURCES_PHONE_CLASS,
  DASHBOARD_NEWS_SOURCES_RAIL_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
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
  it("uses a dense full-width list + far-right Sources rail, not a 2-col card grid", () => {
    const html = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY, DEADLINE],
        now: NOW,
        selected: [],
      }),
    );
    expect(html).toContain("data-news-history-layout");
    expect(html).toContain(DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS);
    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(html).toContain("data-news-history-main");
    expect(html).toContain(DASHBOARD_NEWS_HISTORY_LIST_CLASS);
    expect(html).not.toContain("lg:grid-cols-2");
    expect(html).toContain('data-news-card-density="history"');
    expect(html).toContain("items-start");
    expect(html).toContain(markupClass(DASHBOARD_NEWS_HISTORY_THUMB_CLASS));
    expect(html.indexOf("data-news-thumb")).toBeLessThan(html.indexOf("Harbor Cut lands a festival slot"));
    expect(html).toContain("data-news-sources-rail");
    expect(html).toContain(DASHBOARD_NEWS_SOURCES_RAIL_CLASS);
    expect(html).toContain('data-overview-module="news-sources"');
    expect(html).toContain(DASHBOARD_SECTION_TITLE_CLASS);
    expect(html).toContain(NEWS_PAGE.sources);
    expect(html).toContain(NEWS_PAGE.sourcesAll);
    for (const source of NEWS_SOURCES) {
      expect(html).toContain(source.label);
    }
    expect(html).toContain("data-news-sources-phone");
    expect(html).toContain(DASHBOARD_NEWS_SOURCES_PHONE_CLASS);
    expect(html).toContain('href="/home/news?source=variety"');
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

    const multi = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY, DEADLINE],
        now: NOW,
        selected: ["variety", "deadline"],
      }),
    );
    expect(multi).toContain("Harbor Cut lands a festival slot");
    expect(multi).toContain("North Wind books a limited run");

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
  });

  it("opens the phone Sources sheet without a second column", () => {
    const html = renderToStaticMarkup(
      createElement(NewsHistory, {
        items: [VARIETY],
        now: NOW,
        selected: [],
        defaultSheetOpen: true,
      }),
    );
    expect(html).toContain("data-news-sources-sheet");
    expect(html).toContain('aria-label="Sources"');
    expect(html).toContain(DASHBOARD_NEWS_SOURCES_PHONE_CLASS);
    expect(html).toContain("lg:hidden");
    expect(DASHBOARD_NEWS_SOURCES_RAIL_CLASS).toContain("hidden lg:block");
  });
});

describe("Home News rail stays stacked", () => {
  it("does not apply the history list + Sources filter to Home", () => {
    const html = renderToStaticMarkup(
      createElement(NewsRail, { items: [VARIETY], now: NOW, viewAll: true }),
    );
    expect(html).toContain('data-news-card-density="home"');
    expect(html).not.toContain("data-news-history-layout");
    expect(html).not.toContain("data-news-sources-rail");
    expect(html).not.toContain("data-news-sources-phone");
    expect(html).not.toContain(markupClass(DASHBOARD_NEWS_HISTORY_THUMB_CLASS));
    expect(html).not.toContain("lg:grid-cols-2");
  });
});
