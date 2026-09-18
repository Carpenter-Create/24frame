import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { NewsCard } from "./news-card";
import { NewsRail } from "./news-rail";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_SECTION_AIR_CLASS,
} from "@/lib/dashboard-craft";
import { NEWS_HREF, NEWS_PAGE, type NewsItem } from "@/lib/news";

const NOW = new Date("2026-09-18T18:00:00.000Z");

const ITEM: NewsItem = {
  id: "n1",
  title: "Harbor Cut lands a festival slot",
  url: "https://variety.com/harbor-cut",
  source: "variety",
  published_at: "2026-09-17T12:00:00.000Z",
  image_url: "https://variety.com/thumbs/harbor.jpg",
};

describe("NewsCard", () => {
  it("is a link-out card with title, thumb, source badge, and relative time", () => {
    const html = renderToStaticMarkup(createElement(NewsCard, { item: ITEM, now: NOW }));
    expect(html).toContain("Harbor Cut lands a festival slot");
    expect(html).toContain("Variety");
    expect(html).toContain("https://variety.com/harbor-cut");
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
    expect(html).toContain("https://variety.com/thumbs/harbor.jpg");
    expect(html).toContain("data-news-time");
    expect(html).toContain(DASHBOARD_CARD_PAD);
    expect(html).not.toMatch(/summary|rewrite|republish/i);
  });
});

describe("NewsRail", () => {
  it("shows View all on Home and no summary copy", () => {
    const html = renderToStaticMarkup(
      createElement(NewsRail, { items: [ITEM], now: NOW, viewAll: true }),
    );
    expect(html).toContain(NEWS_PAGE.title);
    expect(html).toContain(NEWS_PAGE.viewAll);
    expect(html).toContain(`href="${NEWS_HREF}"`);
    expect(html).toContain('data-overview-module="news"');
    expect(html).toContain("Harbor Cut lands a festival slot");
    expect(html).toContain(DASHBOARD_SECTION_AIR_CLASS);
    expect(html).not.toContain("divide-y");
    expect(html).not.toMatch(/summary|rewrite|republish/i);
  });

  it("uses the same empty door on Home and /news", () => {
    const html = renderToStaticMarkup(createElement(NewsRail, { items: [], now: NOW }));
    expect(html).toContain(NEWS_PAGE.empty);
    expect(html).not.toContain(NEWS_PAGE.viewAll);
  });
});

describe("news UI source", () => {
  it("does not render a summary field", () => {
    const card = readFileSync(new URL("./news-card.tsx", import.meta.url), "utf8");
    const rail = readFileSync(new URL("./news-rail.tsx", import.meta.url), "utf8");
    expect(card).not.toMatch(/\b(item\.(summary|description|body)|content:encoded)\b/);
    expect(rail).not.toMatch(/\b(item\.(summary|description|body)|content:encoded)\b/);
  });
});
