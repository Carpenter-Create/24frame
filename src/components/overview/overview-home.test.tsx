import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OverviewHome } from "./overview-home";
import { OVERVIEW_MODULE_ORDER, OVERVIEW_PAGE } from "@/lib/overview";
import type { CourseRow } from "@/lib/courses";

function moduleOrder(html: string): string[] {
  const marks = [
    { id: "social", at: html.indexOf('data-overview-module="social"') },
    { id: "education", at: html.indexOf('data-overview-module="education"') },
    { id: "aggregation", at: html.indexOf("data-overview-aggregation") },
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
        courseCovers: new Map(),
        courseMeta: new Map(),
        needsYou: [],
        weekPulse: [],
        aiNext: [],
      }),
    );
    expect(html).toContain("data-overview");
    expect(html).toContain(OVERVIEW_PAGE.title);
    expect(html).toContain("Home");
    expect(html).not.toContain("Overview");
    expect(moduleOrder(html)).toEqual([...OVERVIEW_MODULE_ORDER]);
    expect(html).not.toContain('data-overview-module="week"');
    expect(html).toContain("data-overview-aggregation");
    expect(html).toContain("data-overview-revenue");
    expect(html).toContain('data-overview-module="social"');
    expect(html).toContain('data-overview-module="education"');
    expect(html).toContain('data-overview-module="needs-you"');
    expect(html).toContain('data-overview-module="ai-next"');
    expect(html).toContain(OVERVIEW_PAGE.needsYou);
    expect(html).toContain(OVERVIEW_PAGE.revenue);
    expect(html).toContain(OVERVIEW_PAGE.topPerforming);
    expect(html).toContain(OVERVIEW_PAGE.social);
    expect(html).toContain(OVERVIEW_PAGE.education);
    expect(html).toContain(OVERVIEW_PAGE.aiNext);
    expect(html).toContain(OVERVIEW_PAGE.aiAsk);
    expect(html).toContain(OVERVIEW_PAGE.needsYouEmpty);
    expect(html).toContain(OVERVIEW_PAGE.revenueEmpty);
    expect(html).toContain(OVERVIEW_PAGE.socialEmpty);
    expect(html).toContain(OVERVIEW_PAGE.educationEmpty);
    expect(html).toContain(OVERVIEW_PAGE.aiNextEmpty);
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
        courseCovers: new Map([["c1", "https://cover"]]),
        courseMeta: new Map([["c1", "3 lessons"]]),
        needsYou: [{ id: "n1", what: "Synopsis is required.", href: "/titles/t1" }],
        weekPulse: [{ key: "titles", label: "1 title added", count: 1 }],
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
    expect(moduleOrder(html)).toEqual([...OVERVIEW_MODULE_ORDER]);
    expect(html.indexOf("data-overview-aggregation")).toBeLessThan(html.indexOf("data-overview-pulse"));
    expect(html.indexOf("data-overview-revenue")).toBeLessThan(html.indexOf("data-overview-pulse"));
    expect(html).toContain("data-overview-education-covers");
    expect(html).toContain("Craft");
    expect(html).toContain("3 lessons");
    expect(html).toContain("Synopsis is required.");
    expect(html).toContain('data-overview-week-row="titles"');
    expect(html).toContain('data-overview-ai-next="a1"');
    expect(html).toContain('data-overview-ai-next="a2"');
    expect(html).toContain('data-overview-ai-next="a3"');
    expect(html).toContain("Ask 24Frame AI");
    expect(html).not.toContain("%");
    expect(html).not.toContain("Globee");
  });
});
