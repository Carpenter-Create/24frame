import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NewsCard } from "./news-card";
import { NewsRail } from "./news-rail";
import {
  DASHBOARD_ADMIN_PAIR_CLASS,
  DASHBOARD_CARD_PAD,
  DASHBOARD_LICENSING_THUMB_CLASS,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_NEWS_HISTORY_LIST_CLASS,
  DASHBOARD_NEWS_THUMB_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import { NEWS_HREF, NEWS_PAGE, type NewsItem } from "@/lib/news";
import { OVERVIEW_MODULE_NEST_CLASS } from "@/lib/overview";

const NOW = new Date("2026-09-18T18:00:00.000Z");

const ITEM: NewsItem = {
  id: "n1",
  title: "Harbor Cut lands a festival slot",
  url: "https://variety.com/harbor-cut",
  source: "variety",
  published_at: "2026-09-17T12:00:00.000Z",
  image_url: "https://variety.com/thumbs/harbor.jpg",
};

const SECOND: NewsItem = {
  ...ITEM,
  id: "n2",
  title: "North Wind books a limited run",
  url: "https://deadline.com/north-wind",
};

function markupClass(value: string): string {
  return value.replaceAll("&", "&amp;");
}

describe("NewsCard", () => {
  it("stacks media, headline, then source and time on a discrete house card", () => {
    const html = renderToStaticMarkup(createElement(NewsCard, { item: ITEM, now: NOW }));
    expect(html).toContain("Harbor Cut lands a festival slot");
    expect(html).toContain("Variety");
    expect(html).toContain("https://variety.com/harbor-cut");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
    expect(html).toContain("https://variety.com/thumbs/harbor.jpg");
    expect(html).toContain("data-news-time");
    expect(html).toContain(DASHBOARD_CARD_PAD);
    expect(html).toContain(DASHBOARD_MODULE_CARD_CLASS);
    expect(html).toContain(markupClass(DASHBOARD_NEWS_THUMB_CLASS));
    expect(html).not.toContain(markupClass(DASHBOARD_LICENSING_THUMB_CLASS));
    expect(html.indexOf("data-news-thumb")).toBeLessThan(html.indexOf("Harbor Cut lands a festival slot"));
    expect(html.indexOf("Harbor Cut lands a festival slot")).toBeLessThan(html.indexOf("data-news-time"));
    expect(html).toContain("flex flex-col");
    expect(html).not.toContain("items-start");
    expect(html).not.toMatch(/summary|rewrite|republish/i);
  });
});

describe("NewsRail", () => {
  it("puts News + View all inside the shared Home module shell", () => {
    const html = renderToStaticMarkup(
      createElement(NewsRail, { items: [ITEM], now: NOW, viewAll: true }),
    );
    expect(html).toContain("dashboard-home-panel");
    expect(html).toContain('data-overview-module="news"');
    expect(html).toContain(NEWS_PAGE.title);
    expect(html).toContain(DASHBOARD_SECTION_TITLE_CLASS);
    expect(html).toContain(NEWS_PAGE.viewAll);
    expect(html).toContain(`href="${NEWS_HREF}"`);
    expect(html.indexOf("dashboard-home-panel")).toBeLessThan(html.indexOf(NEWS_PAGE.title));
    expect(html.indexOf(NEWS_PAGE.title)).toBeLessThan(html.indexOf("Harbor Cut lands a festival slot"));
    expect(html).toContain('data-news-card-density="home"');
    expect(html).toContain(OVERVIEW_MODULE_NEST_CLASS);
    expect(html).toContain("Harbor Cut lands a festival slot");
    expect(html).toContain(markupClass(DASHBOARD_NEWS_THUMB_CLASS));
    expect(html).not.toContain("lg:grid-cols-2");
    expect(html).not.toContain("divide-y");
    expect(html).not.toMatch(/summary|rewrite|republish/i);
  });

  it("nests Home articles inside the shell — no second grey card", () => {
    const html = renderToStaticMarkup(
      createElement(NewsRail, { items: [ITEM, SECOND], now: NOW, viewAll: true }),
    );
    expect(html).toContain("dashboard-home-panel");
    expect(html).toContain('data-news-card="n1"');
    expect(html).toContain('data-news-card="n2"');
    expect(html).toContain('data-news-card-density="home"');
    expect(html.split(DASHBOARD_MODULE_CARD_CLASS).length - 1).toBe(0);
    expect(html).not.toContain("divide-y");
  });

  it("uses the house pair grid on /home/news history — same stacked cards, no inner title", () => {
    const html = renderToStaticMarkup(
      createElement(NewsRail, { items: [ITEM, SECOND], now: NOW, history: true }),
    );
    expect(html).toContain(DASHBOARD_NEWS_HISTORY_LIST_CLASS);
    expect(html).toContain("lg:grid-cols-2");
    expect(html).toContain(markupClass(DASHBOARD_NEWS_THUMB_CLASS));
    expect(html.indexOf("data-news-thumb")).toBeLessThan(html.indexOf("Harbor Cut lands a festival slot"));
    expect(html).not.toContain("items-start");
    expect(html).not.toContain(DASHBOARD_SECTION_TITLE_CLASS);
    expect(html).not.toContain(NEWS_PAGE.title);
  });

  it("keeps Home empty copy inside the same shell + header", () => {
    const html = renderToStaticMarkup(
      createElement(NewsRail, { items: [], now: NOW, viewAll: true }),
    );
    expect(html).toContain("dashboard-home-panel");
    expect(html).toContain(NEWS_PAGE.title);
    expect(html).toContain(NEWS_PAGE.viewAll);
    expect(html).toContain(NEWS_PAGE.empty);
    expect(html.indexOf("dashboard-home-panel")).toBeLessThan(html.indexOf(NEWS_PAGE.title));
    expect(html.indexOf(NEWS_PAGE.title)).toBeLessThan(html.indexOf(NEWS_PAGE.empty));
  });
});

describe("news UI source", () => {
  it("does not render a summary field", () => {
    const card = readFileSync(new URL("./news-card.tsx", import.meta.url), "utf8");
    const rail = readFileSync(new URL("./news-rail.tsx", import.meta.url), "utf8");
    expect(card).not.toMatch(/\b(item\.(summary|description|body)|content:encoded)\b/);
    expect(rail).not.toMatch(/\b(item\.(summary|description|body)|content:encoded)\b/);
    expect(card).toContain("DASHBOARD_NEWS_THUMB_CLASS");
    expect(card).toContain("DASHBOARD_MODULE_CARD_CLASS");
    expect(card).toContain("flex flex-col");
    expect(card).not.toContain("items-start");
    expect(card).not.toContain("DASHBOARD_LICENSING_THUMB_CLASS");
    expect(rail).toContain("OverviewModule");
    expect(rail).toContain("DASHBOARD_NEWS_HISTORY_LIST_CLASS");
    expect(DASHBOARD_NEWS_HISTORY_LIST_CLASS).toBe(DASHBOARD_ADMIN_PAIR_CLASS);
  });
});
