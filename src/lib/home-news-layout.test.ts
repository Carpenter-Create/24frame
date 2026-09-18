import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/home",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

import { OverviewHome } from "@/components/overview/overview-home";
import { parseDashboardPeriod } from "@/lib/dashboard-admin";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_LICENSING_THUMB_CLASS,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_NEWS_HISTORY_COLUMN_CLASS,
  DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS,
  DASHBOARD_NEWS_HISTORY_LIST_CLASS,
  DASHBOARD_NEWS_HISTORY_ROW_CLASS,
  DASHBOARD_NEWS_HISTORY_THUMB_CLASS,
  DASHBOARD_NEWS_THUMB_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
} from "@/lib/dashboard-craft";
import {
  HOME_CONTENT_COLUMN_PX,
  HOME_LEFT_INSET_PX,
  HOME_RIGHT_INSET_PX,
} from "@/lib/home-width-lock";
import { HOUSE_HOME_RAIL_COLUMN_CLASS } from "@/lib/house-shell";
import {
  OVERVIEW_HOME_COLUMN_GUTTER,
  OVERVIEW_HOME_LAYOUT_CLASS,
  OVERVIEW_NEWS_RAIL_WIDTH,
  OVERVIEW_PHONE_MODULE_ORDER,
  OVERVIEW_RAIL_OFF_WIDTH,
  isHomeOwnedPath,
  overviewHidesRail,
  overviewLeadPills,
  overviewLeadSelected,
} from "@/lib/overview";

const card = readFileSync("src/components/news/news-card.tsx", "utf8");
const rail = readFileSync("src/components/news/news-rail.tsx", "utf8");
const home = readFileSync("src/components/overview/overview-home.tsx", "utf8");
const newsPage = readFileSync("src/app/(app)/home/news/page.tsx", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");

function emptyHome(): string {
  const now = new Date("2026-09-18T18:00:00.000Z");
  return renderToStaticMarkup(
    createElement(OverviewHome, {
      revenueCents: null,
      period: parseDashboardPeriod("all", now),
      socialUnread: 0,
      socialChats: [],
      socialFaces: new Map(),
      courses: [],
      needsYou: [],
      weekPulse: [],
      aiNext: [],
      news: [],
      now,
    }),
  );
}

describe("Home News layout + register lock", () => {
  it("keeps two-column desktop News and a phone stack after Aggregation", () => {
    expect(HOME_LEFT_INSET_PX).toBe(48);
    expect(HOME_RIGHT_INSET_PX).toBe(16);
    expect(HOME_CONTENT_COLUMN_PX).toBe(1376);
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).toContain("--content-inset");
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).toContain("--chrome-gutter");
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).not.toContain("--access-rail-width");
    expect(overviewHidesRail("/home")).toBe(true);
    expect(overviewHidesRail("/home/news")).toBe(true);
    expect(isHomeOwnedPath("/home/news")).toBe(true);
    expect(overviewLeadSelected("home", "/home/news", "aggregation")).toBe(true);
    expect(overviewLeadSelected("aggregation", "/home/news", "aggregation")).toBe(false);
    expect(overviewLeadPills().map((pill) => pill.id)).not.toContain("news");
    expect(OVERVIEW_RAIL_OFF_WIDTH).toBe("0px");
    expect(OVERVIEW_NEWS_RAIL_WIDTH).toBe("20rem");
    expect(OVERVIEW_HOME_COLUMN_GUTTER).toBe("var(--chrome-gutter)");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(readFileSync("src/lib/overview.ts", "utf8")).toContain(
      "lg:grid-cols-[minmax(0,1fr)_20rem]",
    );
    expect(readFileSync("src/lib/overview.ts", "utf8")).not.toContain(
      "${OVERVIEW_NEWS_RAIL_WIDTH}",
    );
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("gap-x-[var(--chrome-gutter)]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("gap-y-[var(--space-6)]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("grid-cols-1");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).not.toContain("md:grid-cols");
    expect(OVERVIEW_PHONE_MODULE_ORDER).toEqual([
      "revenue",
      "social",
      "education",
      "needs-you",
      "ai-next",
      "news",
    ]);
    expect(shell).toContain("HOUSE_HOME_RAIL_COLUMN_CLASS");
    expect(shell).toContain('data-home-chrome={homeChrome ? "" : undefined}');
    expect(home).toContain("OVERVIEW_HOME_LAYOUT_CLASS");
    expect(home).toContain("data-overview-news");
  });

  it("uses house card pad and section air — not a compressed News ticker", () => {
    expect(rail).toContain("OverviewModule");
    expect(rail).toContain("OVERVIEW_MODULE_NEST_CLASS");
    expect(rail).not.toContain("DASHBOARD_ROW_LIST_CLASS");
    expect(card).toContain("DASHBOARD_CARD_PAD");
    expect(card).toContain("DASHBOARD_RELATED_GAP_CLASS");
    expect(card).toContain("DASHBOARD_MODULE_CARD_CLASS");
    expect(card).toContain("DASHBOARD_NEWS_THUMB_CLASS");
    expect(card).toContain("DASHBOARD_NEWS_HISTORY_THUMB_CLASS");
    expect(card).toContain("flex flex-col");
    expect(card).toContain("DASHBOARD_NEWS_HISTORY_ROW_CLASS");
    expect(card).not.toContain("items-start");
    expect(card).not.toContain("DASHBOARD_LICENSING_THUMB_CLASS");
    expect(rail).toContain("DASHBOARD_NEWS_HISTORY_LIST_CLASS");
    expect(card).not.toMatch(/py-\[var\(--space-[123]\)\]/);
    expect(card).not.toMatch(/\b(px|py|gap)-\[\d+(?:px|rem)\]/);
    expect(rail).not.toMatch(/\b(px|py|gap)-\[\d+(?:px|rem)\]/);
    expect(DASHBOARD_SECTION_AIR_CLASS).toBe("gap-[var(--space-6)]");
    expect(DASHBOARD_CARD_PAD).toBe("px-[var(--space-4)] py-[var(--space-4)]");
    expect(DASHBOARD_RELATED_GAP_CLASS).toBe("gap-[var(--space-2)]");
  });

  it("locks a full-width News media plate and keeps licensing at w-16", () => {
    expect(DASHBOARD_NEWS_THUMB_CLASS).toContain("aspect-[16/9]");
    expect(DASHBOARD_NEWS_THUMB_CLASS).toMatch(/(?:^|\s)w-full(?:\s|$)/);
    expect(DASHBOARD_NEWS_THUMB_CLASS).not.toContain("w-16");
    expect(DASHBOARD_NEWS_THUMB_CLASS).not.toContain("w-28");
    expect(DASHBOARD_NEWS_THUMB_CLASS).not.toContain("md:w-32");
    expect(DASHBOARD_NEWS_HISTORY_THUMB_CLASS).toContain("aspect-[16/9]");
    expect(DASHBOARD_NEWS_HISTORY_THUMB_CLASS).toContain("w-40");
    expect(DASHBOARD_NEWS_HISTORY_THUMB_CLASS).toContain("md:w-80");
    expect(DASHBOARD_NEWS_HISTORY_THUMB_CLASS).not.toContain("w-16");
    expect(DASHBOARD_NEWS_HISTORY_THUMB_CLASS).not.toContain("w-28");
    expect(DASHBOARD_NEWS_HISTORY_ROW_CLASS).toContain("items-stretch");
    expect(DASHBOARD_LICENSING_THUMB_CLASS).toContain("w-16");
    expect(DASHBOARD_LICENSING_THUMB_CLASS).not.toMatch(/(?:^|\s)w-full(?:\s|$)/);
    expect(DASHBOARD_MODULE_CARD_CLASS).toContain("bg-surface-muted");
    expect(DASHBOARD_MODULE_CARD_CLASS).toContain("rounded-[var(--radius-lg)]");
    expect(DASHBOARD_NEWS_HISTORY_LIST_CLASS).toContain("flex flex-col");
    expect(DASHBOARD_NEWS_HISTORY_LIST_CLASS).not.toContain("lg:grid-cols-2");
    expect(DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS).toContain("flex w-full flex-col");
    expect(DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS).not.toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS).not.toContain("lg:grid-cols-2");
    expect(DASHBOARD_NEWS_HISTORY_COLUMN_CLASS).toBe("mx-auto w-full max-w-[840px]");
    expect(DASHBOARD_NEWS_HISTORY_COLUMN_CLASS).not.toContain("1376");
    expect(newsPage).toContain("DASHBOARD_NEWS_HISTORY_COLUMN_CLASS");
  });

  it("keeps the News column when the rail is empty", () => {
    const html = emptyHome();
    expect(html).toContain("data-overview-layout");
    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(html).toContain("gap-x-[var(--chrome-gutter)]");
    expect(html).toContain("data-overview-news");
    expect(html).toContain('data-overview-module="news"');
    expect(html).toContain("dashboard-home-panel");
    expect(html).toContain("No headlines from the last 90 days.");
    expect(html.indexOf("data-overview-revenue")).toBeLessThan(
      html.indexOf('data-overview-module="social"'),
    );
    expect(html.indexOf('data-overview-module="social"')).toBeLessThan(
      html.indexOf('data-overview-module="education"'),
    );
    expect(html.indexOf('data-overview-module="education"')).toBeLessThan(
      html.indexOf('data-overview-module="needs-you"'),
    );
    expect(html.indexOf('data-overview-module="needs-you"')).toBeLessThan(
      html.indexOf('data-overview-module="ai-next"'),
    );
    expect(html.indexOf('data-overview-module="ai-next"')).toBeLessThan(html.indexOf("data-overview-news"));
  });

  it("does not restore a Supabase News catalog or Vercel news cron", () => {
    expect(existsSync("src/app/api/cron/news-ingest/route.ts")).toBe(false);
    expect(existsSync("supabase/migrations/20260918180000_news_items.sql")).toBe(false);
    expect(readFileSync("vercel.json", "utf8")).not.toContain("/api/cron/news-ingest");
    expect(readFileSync("src/lib/supabase/database.types.ts", "utf8")).not.toContain("news_items");
  });
});
