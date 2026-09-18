import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OverviewHome } from "./overview-home";
import type { CourseRow } from "@/lib/courses";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { DASHBOARD_SECTION_TITLE_CLASS } from "@/lib/dashboard-craft";
import { NEWS_HREF, NEWS_PAGE } from "@/lib/news";
import {
  OVERVIEW_PHONE_MODULE_ORDER,
  OVERVIEW_PAGE,
} from "@/lib/overview";

function moduleLabelClass(html: string, testId: string): string {
  const chunk = moduleChunk(html, testId);
  const match = chunk.match(/data-overview-module-label="" class="([^"]+)"/);
  return match?.[1] ?? "";
}

function moduleChunk(html: string, testId: string): string {
  const start = html.indexOf(`data-overview-module="${testId}"`);
  if (start < 0) return "";
  const next = html.indexOf("data-overview-module=", start + 1);
  const aggregation = testId === "education" ? html.indexOf("data-overview-aggregation", start) : -1;
  const cuts = [next, aggregation, html.length].filter((at) => at >= 0);
  return html.slice(start, Math.min(...cuts));
}

function moduleOrder(html: string): string[] {
  const marks = [
    { id: "social", at: html.indexOf('data-overview-module="social"') },
    { id: "education", at: html.indexOf('data-overview-module="education"') },
    { id: "aggregation", at: html.indexOf("data-overview-aggregation") },
    { id: "news", at: html.indexOf('data-overview-module="news"') },
    { id: "needs-you", at: html.indexOf('data-overview-module="needs-you"') },
    { id: "ai-next", at: html.indexOf('data-overview-module="ai-next"') },
  ];
  return marks.filter((mark) => mark.at >= 0).sort((a, b) => a.at - b.at).map((mark) => mark.id);
}

const COURSE: CourseRow = {
  id: "c1",
  slug: "craft",
  title: "Craft",
  description: null,
  cover_key: "cover.jpg",
  is_flagship_free: true,
  price_cents: null,
  catalog_code: "EDU-1",
  status: "published",
  position: 1,
  instructor_id: null,
  created_at: "2026-09-01T12:00:00.000Z",
};

describe("OverviewHome", () => {
  it("renders locked modules with empty doors and 24Frame AI, not Globee", () => {
    const html = renderToStaticMarkup(
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
    expect(html).toContain("data-overview");
    expect(html).toContain(OVERVIEW_PAGE.title);
    expect(html).toContain("Home");
    expect(html).not.toContain("Overview");
    expect(moduleOrder(html)).toEqual([...OVERVIEW_PHONE_MODULE_ORDER]);
    expect(html).not.toContain('data-overview-module="week"');
    expect(html).toContain("data-overview-aggregation");
    expect(html).toContain("data-overview-revenue");
    expect(html).toContain("data-overview-news");
    expect(html).toContain("data-overview-layout");
    expect(html).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(html).toContain("gap-x-[var(--chrome-gutter)]");
    expect(html).toContain("gap-y-[var(--space-6)]");
    expect(html).toContain('data-overview-module="social"');
    expect(html).toContain('data-overview-module="education"');
    expect(html).toContain('data-overview-module="news"');
    expect(html).toContain('data-overview-module="needs-you"');
    expect(html).toContain('data-overview-module="ai-next"');
    expect(html).toContain(OVERVIEW_PAGE.needsYou);
    expect(html).toContain(OVERVIEW_PAGE.revenue);
    expect(html).toContain(OVERVIEW_PAGE.topPerforming);
    expect(html).toContain(OVERVIEW_PAGE.social);
    expect(html).toContain(OVERVIEW_PAGE.education);
    expect(html).toContain(OVERVIEW_PAGE.news);
    expect(html).toContain(OVERVIEW_PAGE.aiNext);
    expect(html).toContain(OVERVIEW_PAGE.aiAsk);
    expect(html).toContain(`href="${OVERVIEW_PAGE.revenueHref}"`);
    expect(html).toContain(`href="${OVERVIEW_PAGE.aiNextHref}"`);
    expect(html).not.toContain(`href="${OVERVIEW_PAGE.socialHref}"`);
    expect(html).not.toContain(`href="${OVERVIEW_PAGE.educationHref}"`);
    expect(html).not.toContain(`href="${OVERVIEW_PAGE.needsYouHref}"`);
    expect(moduleChunk(html, "social")).not.toContain(TEXT_ACTION_CLASS);
    expect(moduleChunk(html, "education")).not.toContain(TEXT_ACTION_CLASS);
    expect(moduleLabelClass(html, "education")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleLabelClass(html, "social")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleLabelClass(html, "news")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleLabelClass(html, "needs-you")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleLabelClass(html, "ai-next")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleChunk(html, "needs-you")).not.toContain(TEXT_ACTION_CLASS);
    expect(moduleChunk(html, "ai-next")).toContain(TEXT_ACTION_CLASS);
    expect(moduleChunk(html, "news")).toContain(TEXT_ACTION_CLASS);
    expect(moduleChunk(html, "news")).toContain("dashboard-home-panel");
    expect(html).toContain(OVERVIEW_PAGE.needsYouEmpty);
    expect(html).toContain(OVERVIEW_PAGE.revenueEmpty);
    expect(html).toContain(OVERVIEW_PAGE.socialEmpty);
    expect(html).toContain(OVERVIEW_PAGE.educationEmpty);
    expect(html).toContain(OVERVIEW_PAGE.newsEmpty);
    expect(html).toContain(OVERVIEW_PAGE.aiNextEmpty);
    expect(html).toContain(`href="${NEWS_HREF}"`);
    expect(html).toContain(NEWS_PAGE.viewAll);
    expect(html).not.toMatch(/summary|rewrite|republish/i);
    expect(html).not.toContain("Globee");
    expect(html).not.toContain("lesson_progress");
  });

  it("shows Social unread + faces, Education covers, week pulse, and three AI next-moves", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewHome, {
        revenueCents: 100_000,
        topTitles: [
          {
            id: "t1",
            title: "Harbor Cut",
            status: "live",
            created_at: "2026-09-12T12:00:00.000Z",
          },
        ],
        socialUnread: 4,
        socialChats: [
          {
            conversationId: "dm1",
            label: "Ada",
            preview: "2 unread",
            peerIds: ["u1"],
          },
        ],
        socialFaces: new Map(),
        courses: [COURSE],
        needsYou: [{ id: "n1", what: "Synopsis is required.", href: "/titles/t1" }],
        weekPulse: [{ key: "titles", label: "1 title added", count: 1 }],
        news: [
          {
            id: "n1",
            title: "Harbor Cut lands a festival slot",
            url: "https://variety.com/harbor-cut",
            source: "variety",
            published_at: "2026-09-17T12:00:00.000Z",
            image_url: null,
          },
        ],
        now: new Date("2026-09-18T18:00:00.000Z"),
        aiNext: [
          { id: "a1", title: "North Wind", reason: "Chain of title is missing.", status: "draft" },
          { id: "a2", title: "Winter Light", reason: null, status: "draft" },
          { id: "a3", title: "Harbor Cut", reason: null, status: "draft" },
        ],
      }),
    );
    expect(html).toContain("data-overview-revenue-value");
    expect(html).toContain("Harbor Cut");
    expect(html).toContain("data-overview-social-unread");
    expect(html).toContain("4");
    expect(html).toContain('data-overview-social-face="dm1"');
    expect(html).not.toContain("2 unread");
    expect(html).not.toContain("Overview");
    expect(html).not.toContain('data-overview-module="week"');
    expect(moduleOrder(html)).toEqual([...OVERVIEW_PHONE_MODULE_ORDER]);
    expect(html.indexOf("data-overview-aggregation")).toBeLessThan(html.indexOf("data-overview-pulse"));
    expect(html.indexOf("data-overview-aggregation")).toBeLessThan(
      html.indexOf('data-overview-module="needs-you"'),
    );
    expect(html.indexOf('data-overview-module="needs-you"')).toBeLessThan(
      html.indexOf('data-overview-module="ai-next"'),
    );
    expect(html.indexOf('data-overview-module="ai-next"')).toBeLessThan(html.indexOf("data-overview-news"));
    expect(html).toContain("Harbor Cut lands a festival slot");
    expect(html).toContain(`href="${NEWS_HREF}"`);
    expect(html).not.toMatch(/summary|rewrite|republish/i);
    expect(html.indexOf("data-overview-revenue")).toBeLessThan(html.indexOf("data-overview-pulse"));
    expect(html).toContain("data-overview-education-covers");
    expect(html).toContain("lg:grid-cols-3");
    expect(html).not.toContain("lg:grid-cols-4");
    expect(html).not.toContain("lg:grid-cols-5");
    expect(html).toContain("Craft");
    expect(html).toContain('data-course-card-density="home"');
    expect(html).toContain("data-course-cover-title");
    expect(html).toContain('data-course-cover-tone="plate"');
    expect(html).toContain("data-course-progress");
    expect(html).toContain("data-course-progress-track");
    expect(html).toContain("data-course-progress-fill");
    expect(html).toContain("data-course-progress-caption");
    expect(html).toContain("0% complete");
    expect(html).toContain("width:0%");
    expect(html).toContain("bg-accent");
    expect(html).not.toContain("3 lessons");
    expect(html).not.toContain("https://cover.example");
    expect(html).toContain("Synopsis is required.");
    expect(html).toContain('data-overview-week-row="titles"');
    expect(html).toContain('data-overview-ai-next="a1"');
    expect(html).toContain('data-overview-ai-next="a2"');
    expect(html).toContain('data-overview-ai-next="a3"');
    expect(html).toContain("Ask 24Frame AI");
    expect(html).toContain(`href="${OVERVIEW_PAGE.revenueHref}"`);
    expect(html).toContain(`href="${OVERVIEW_PAGE.aiNextHref}"`);
    expect(html).not.toContain(`href="${OVERVIEW_PAGE.socialHref}"`);
    expect(html).not.toContain(`href="${OVERVIEW_PAGE.educationHref}"`);
    expect(html).not.toContain(`href="${OVERVIEW_PAGE.needsYouHref}"`);
    expect(moduleChunk(html, "social")).not.toContain(TEXT_ACTION_CLASS);
    expect(moduleChunk(html, "education")).not.toContain(TEXT_ACTION_CLASS);
    expect(moduleLabelClass(html, "education")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleLabelClass(html, "social")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleLabelClass(html, "news")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(moduleChunk(html, "needs-you")).not.toContain(TEXT_ACTION_CLASS);
    expect(html).not.toContain("62%");
    expect(html).not.toContain("Globee");
  });

  it("renders the Figma progress bar from real course percent and does not invent 62%", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewHome, {
        revenueCents: null,
        topTitles: [],
        socialUnread: 0,
        socialChats: [],
        socialFaces: new Map(),
        courses: [COURSE],
        courseProgress: new Map([["c1", 40]]),
        needsYou: [],
        weekPulse: [],
        aiNext: [],
        news: [],
        now: new Date("2026-09-18T18:00:00.000Z"),
      }),
    );
    const education = moduleChunk(html, "education");
    const coverAt = education.indexOf("data-course-cover=");
    const titleAt = education.indexOf("data-course-cover-title");
    const coverCloseAt = education.indexOf("</div>", coverAt);
    const trackAt = education.indexOf("data-course-progress-track");
    const labelAt = education.indexOf("data-overview-module-label");
    expect(education).toContain('data-course-card-density="home"');
    expect(education).toContain('data-course-cover-tone="plate"');
    expect(education).toContain("data-course-cover-band");
    expect(education).toContain("data-course-cover-orb");
    expect(education).not.toContain("<img");
    expect(education).not.toContain('data-course-cover-tone="photo"');
    expect(titleAt).toBeGreaterThan(coverAt);
    expect(titleAt).toBeLessThan(coverCloseAt);
    expect(education).toContain("text-accent-contrast");
    expect(trackAt).toBeGreaterThan(coverCloseAt);
    expect(education).toContain("40% complete");
    expect(education).toContain("width:40%");
    expect(education).toContain("bg-accent");
    expect(education).toContain("bg-hairline");
    expect(education).not.toContain("t-body font-medium text-ink");
    expect(education).not.toContain("62%");
    expect(education).not.toContain("3 lessons");
    expect(education).not.toContain("lesson");
    expect(moduleLabelClass(html, "education")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(education).not.toContain(TEXT_ACTION_CLASS);
    expect(labelAt).toBeGreaterThan(-1);
    expect(labelAt).toBeLessThan(coverAt);
  });

  it("uses the signed Education cover on Home and keeps the title below the photo", () => {
    const html = renderToStaticMarkup(
      createElement(OverviewHome, {
        revenueCents: null,
        topTitles: [],
        socialUnread: 0,
        socialChats: [],
        socialFaces: new Map(),
        courses: [COURSE],
        courseCovers: new Map([["c1", "https://cover.example/photo.jpg"]]),
        courseProgress: new Map([["c1", 40]]),
        needsYou: [],
        weekPulse: [],
        aiNext: [],
        news: [],
        now: new Date("2026-09-18T18:00:00.000Z"),
      }),
    );
    const education = moduleChunk(html, "education");
    const coverAt = education.indexOf("data-course-cover=");
    const coverCloseAt = education.indexOf("</div>", coverAt);
    const belowTitleAt = education.indexOf("t-body font-medium text-ink");
    const trackAt = education.indexOf("data-course-progress-track");
    expect(education).toContain('data-course-card-density="home"');
    expect(education).toContain('data-course-cover-tone="photo"');
    expect(education).toContain("https://cover.example/photo.jpg");
    expect(education).toContain("<img");
    expect(education).not.toContain('data-course-cover-tone="plate"');
    expect(education).not.toContain("data-course-cover-title");
    expect(education).not.toContain("data-course-cover-orb");
    expect(education).not.toContain("data-course-cover-band");
    expect(belowTitleAt).toBeGreaterThan(coverCloseAt);
    expect(trackAt).toBeGreaterThan(belowTitleAt);
    expect(education).toContain("40% complete");
    expect(education).toContain("width:40%");
    expect(education).not.toContain("3 lessons");
    expect(education).not.toContain("lesson");
    expect(moduleLabelClass(html, "education")).toBe(DASHBOARD_SECTION_TITLE_CLASS);
    expect(education).not.toContain(TEXT_ACTION_CLASS);
  });
});
