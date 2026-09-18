import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OverviewHome } from "@/components/overview/overview-home";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
} from "@/lib/dashboard-craft";
import { HOME_ACCESS_RAIL_INSET_PX, HOME_CONTENT_COLUMN_PX } from "@/lib/home-width-lock";
import { HOUSE_HOME_RAIL_COLUMN_CLASS } from "@/lib/house-shell";
import {
  OVERVIEW_HOME_COLUMN_GUTTER,
  OVERVIEW_HOME_LAYOUT_CLASS,
  OVERVIEW_NEWS_RAIL_WIDTH,
  OVERVIEW_PHONE_MODULE_ORDER,
  OVERVIEW_RAIL_OFF_WIDTH,
  overviewHidesRail,
} from "@/lib/overview";

const card = readFileSync("src/components/news/news-card.tsx", "utf8");
const rail = readFileSync("src/components/news/news-rail.tsx", "utf8");
const home = readFileSync("src/components/overview/overview-home.tsx", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");

function emptyHome(): string {
  return renderToStaticMarkup(
    createElement(OverviewHome, {
      revenueCents: null,
      topTitles: [],
      socialUnread: 0,
      socialChats: [],
      socialFaces: new Map(),
      courses: [],
      needsYou: [],
      weekPulse: [],
      aiNext: [],
      news: [],
      now: new Date("2026-09-18T18:00:00.000Z"),
    }),
  );
}

describe("Home News layout + register lock", () => {
  it("keeps two-column desktop News and a phone stack after Aggregation", () => {
    expect(HOME_ACCESS_RAIL_INSET_PX).toBe(220);
    expect(HOME_CONTENT_COLUMN_PX).toBe(1220);
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).toContain("--access-rail-width");
    expect(overviewHidesRail("/home")).toBe(true);
    expect(OVERVIEW_RAIL_OFF_WIDTH).toBe("0px");
    expect(OVERVIEW_NEWS_RAIL_WIDTH).toBe("20rem");
    expect(OVERVIEW_HOME_COLUMN_GUTTER).toBe("var(--chrome-gutter)");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("gap-x-[var(--chrome-gutter)]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("gap-y-[var(--space-6)]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("grid-cols-1");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).not.toContain("md:grid-cols");
    expect(OVERVIEW_PHONE_MODULE_ORDER).toEqual([
      "social",
      "education",
      "aggregation",
      "news",
      "needs-you",
      "ai-next",
    ]);
    expect(shell).toContain("HOUSE_HOME_RAIL_COLUMN_CLASS");
    expect(shell).toContain('data-home-chrome={homeChrome ? "" : undefined}');
    expect(home).toContain("OVERVIEW_HOME_LAYOUT_CLASS");
    expect(home).toContain("data-overview-news");
  });

  it("uses house card pad and section air — not a compressed News ticker", () => {
    expect(rail).toContain("DASHBOARD_SECTION_AIR_CLASS");
    expect(rail).not.toContain("DASHBOARD_ROW_LIST_CLASS");
    expect(card).toContain("DASHBOARD_CARD_PAD");
    expect(card).toContain("DASHBOARD_RELATED_GAP_CLASS");
    expect(card).not.toMatch(/py-\[var\(--space-[123]\)\]/);
    expect(card).not.toMatch(/\b(px|py|gap)-\[\d+(?:px|rem)\]/);
    expect(rail).not.toMatch(/\b(px|py|gap)-\[\d+(?:px|rem)\]/);
    expect(DASHBOARD_SECTION_AIR_CLASS).toBe("gap-[var(--space-6)]");
    expect(DASHBOARD_CARD_PAD).toBe("px-[var(--space-4)] py-[var(--space-4)]");
    expect(DASHBOARD_RELATED_GAP_CLASS).toBe("gap-[var(--space-2)]");
  });

  it("keeps the News column when the rail is empty", () => {
    const html = emptyHome();
    expect(html).toContain("data-overview-layout");
    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(html).toContain("gap-x-[var(--chrome-gutter)]");
    expect(html).toContain("data-overview-news");
    expect(html).toContain("No headlines from the last 30 days.");
    expect(html.indexOf("data-overview-aggregation")).toBeLessThan(html.indexOf("data-overview-news"));
    expect(html.indexOf("data-overview-news")).toBeLessThan(html.indexOf('data-overview-module="needs-you"'));
  });

  it("does not restore a Supabase News catalog or Vercel news cron", () => {
    expect(existsSync("src/app/api/cron/news-ingest/route.ts")).toBe(false);
    expect(existsSync("supabase/migrations/20260918180000_news_items.sql")).toBe(false);
    expect(readFileSync("vercel.json", "utf8")).not.toContain("/api/cron/news-ingest");
    expect(readFileSync("src/lib/supabase/database.types.ts", "utf8")).not.toContain("news_items");
  });
});
