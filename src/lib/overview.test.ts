import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ASSISTANT_NAME } from "@/lib/product";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { availableWorkspaceOptions } from "@/lib/workspace-menu";
import { NEWS_HREF, NEWS_LEGACY_HREF, NEWS_PAGE } from "./news";
import {
  OVERVIEW_AI_NEXT_CAP,
  OVERVIEW_EDUCATION_CAP,
  OVERVIEW_HREF,
  OVERVIEW_LEGACY_HREF,
  OVERVIEW_MODULE_ORDER,
  OVERVIEW_HOME_COLUMN_GUTTER,
  OVERVIEW_HOME_LAYOUT_CLASS,
  OVERVIEW_MODULE_NEST_CLASS,
  OVERVIEW_NEWS_CAP,
  OVERVIEW_NEWS_RAIL_WIDTH,
  OVERVIEW_PAGE,
  OVERVIEW_PHONE_MODULE_ORDER,
  OVERVIEW_RAIL_OFF_WIDTH,
  OVERVIEW_SOCIAL_DM_CAP,
  isHomeLandPath,
  overviewHref,
  isHomeOwnedPath,
  isNewsHistoryPath,
  isOverviewPath,
  overviewAiNextMoves,
  overviewModuleHeaderAction,
  overviewEducationCourses,
  overviewHidesRail,
  overviewLeadPills,
  overviewLeadSelected,
  overviewLeadShouldNavigate,
  overviewSocialChats,
  overviewSocialUnreadTotal,
  overviewTriggerLabel,
  overviewWeekPulse,
  overviewInWeek,
  overviewWeekSince,
} from "./overview";

describe("Home lead pills", () => {
  it("inserts Home leftmost without inventing a fourth workspace product", () => {
    const pills = overviewLeadPills();
    expect(pills.map((pill) => pill.id)).toEqual([
      "home",
      "aggregation",
      "social",
      "education",
    ]);
    expect(pills[0]).toEqual({
      id: "home",
      label: OVERVIEW_PAGE.title,
      href: OVERVIEW_HREF,
    });
    expect(availableWorkspaceOptions().map((option) => option.mode)).toEqual([
      "aggregation",
      "social",
      "education",
    ]);
    expect(OVERVIEW_HREF).toBe("/home");
    expect(OVERVIEW_LEGACY_HREF).toBe("/overview");
    expect(OVERVIEW_PAGE.title).toBe("Home");
    expect(OVERVIEW_HREF).not.toBe(SOCIAL_ROUTES.home);
    expect(OVERVIEW_PAGE.title).not.toBe(SOCIAL.workspace);
    expect(OVERVIEW_PAGE.aiNext).toBe(ASSISTANT_NAME);
    expect(OVERVIEW_PAGE.aiNext).not.toBe("Globee");
  });

  it("selects Home on /home and leftover /overview, and leaves workspace pills idle there", () => {
    expect(isOverviewPath("/home")).toBe(true);
    expect(isOverviewPath("/home/x")).toBe(true);
    expect(isOverviewPath("/overview")).toBe(true);
    expect(isOverviewPath("/overview/x")).toBe(true);
    expect(isOverviewPath("/dashboard")).toBe(false);
    expect(isOverviewPath("/social")).toBe(false);
    expect(isOverviewPath(NEWS_LEGACY_HREF)).toBe(false);
    expect(isOverviewPath(NEWS_HREF)).toBe(true);
    expect(isHomeLandPath("/home")).toBe(true);
    expect(isHomeLandPath("/overview")).toBe(true);
    expect(isHomeLandPath(NEWS_HREF)).toBe(false);
    expect(isHomeLandPath(NEWS_LEGACY_HREF)).toBe(false);
    expect(overviewLeadSelected("home", "/home", "aggregation")).toBe(true);
    expect(overviewLeadSelected("home", "/overview", "aggregation")).toBe(true);
    expect(overviewLeadSelected("aggregation", "/home", "aggregation")).toBe(false);
    expect(overviewLeadSelected("aggregation", "/overview", "aggregation")).toBe(false);
    expect(overviewLeadSelected("aggregation", "/dashboard", "aggregation")).toBe(true);
    expect(overviewLeadSelected("social", "/social", "social")).toBe(true);
    expect(overviewTriggerLabel("/home", "Social")).toBe("Home");
    expect(overviewTriggerLabel("/overview", "Social")).toBe("Home");
    expect(overviewTriggerLabel("/social", "Social")).toBe("Social");
    expect(overviewLeadShouldNavigate("/home", "aggregation", { id: "aggregation" })).toBe(true);
    expect(overviewLeadShouldNavigate("/overview", "aggregation", { id: "aggregation" })).toBe(
      true,
    );
    expect(overviewLeadShouldNavigate("/home", "aggregation", { id: "home" })).toBe(false);
    expect(overviewLeadShouldNavigate("/dashboard", "aggregation", { id: "aggregation" })).toBe(
      false,
    );
  });

  it("keeps /home/news on Home chrome — Home pill still navigates to /home", () => {
    expect(NEWS_HREF).toBe("/home/news");
    expect(isNewsHistoryPath(NEWS_HREF)).toBe(true);
    expect(isNewsHistoryPath(`${NEWS_HREF}/x`)).toBe(true);
    expect(isNewsHistoryPath(NEWS_LEGACY_HREF)).toBe(true);
    expect(isNewsHistoryPath("/home")).toBe(false);
    expect(isHomeOwnedPath(NEWS_HREF)).toBe(true);
    expect(isHomeOwnedPath("/home")).toBe(true);
    expect(isHomeOwnedPath("/dashboard")).toBe(false);
    expect(isHomeOwnedPath("/social")).toBe(false);
    expect(overviewLeadSelected("home", NEWS_HREF, "aggregation")).toBe(true);
    expect(overviewLeadSelected("home", NEWS_HREF, "social")).toBe(true);
    expect(overviewLeadSelected("aggregation", NEWS_HREF, "aggregation")).toBe(false);
    expect(overviewLeadSelected("social", NEWS_HREF, "social")).toBe(false);
    expect(overviewLeadSelected("education", NEWS_HREF, "education")).toBe(false);
    expect(overviewTriggerLabel(NEWS_HREF, "Aggregation")).toBe("Home");
    expect(overviewLeadShouldNavigate(NEWS_HREF, "aggregation", { id: "home" })).toBe(true);
    expect(overviewLeadShouldNavigate(NEWS_LEGACY_HREF, "aggregation", { id: "home" })).toBe(true);
    expect(overviewLeadShouldNavigate("/home", "aggregation", { id: "home" })).toBe(false);
    expect(overviewLeadShouldNavigate(NEWS_HREF, "aggregation", { id: "aggregation" })).toBe(true);
    expect(overviewLeadPills().map((pill) => pill.id)).not.toContain("news");
    expect(overviewLeadPills()[0]?.href).toBe(OVERVIEW_HREF);
    expect(overviewLeadPills().some((pill) => pill.href === NEWS_HREF)).toBe(false);
    expect(overviewLeadPills().some((pill) => pill.href === NEWS_LEGACY_HREF)).toBe(false);
    const switcher = readFileSync("src/components/chrome/workspace-switcher.tsx", "utf8");
    expect(switcher).toContain("router.push(pill.href)");
    expect(switcher).toContain("overviewLeadShouldNavigate");
  });

  it("hides dest rails on Home and keeps them on workspace routes", () => {
    expect(overviewHidesRail("/home")).toBe(true);
    expect(overviewHidesRail("/home/x")).toBe(true);
    expect(overviewHidesRail("/overview")).toBe(true);
    expect(overviewHidesRail(NEWS_HREF)).toBe(true);
    expect(overviewHidesRail(NEWS_LEGACY_HREF)).toBe(true);
    expect(overviewHidesRail("/dashboard")).toBe(false);
    expect(overviewHidesRail("/social")).toBe(false);
    expect(overviewHidesRail("/social/courses")).toBe(false);
    expect(overviewHidesRail("/titles")).toBe(false);
    expect(overviewHidesRail("/settings")).toBe(false);
    expect(OVERVIEW_RAIL_OFF_WIDTH).toBe("0px");
  });
});

describe("Home module caps", () => {
  it("locks Net revenue first, then Social · Education · Needs you", () => {
    expect(OVERVIEW_MODULE_ORDER).toEqual([
      "revenue",
      "social",
      "education",
      "needs-you",
      "ai-next",
    ]);
    expect(OVERVIEW_PHONE_MODULE_ORDER).toEqual([
      "revenue",
      "social",
      "education",
      "needs-you",
      "ai-next",
      "news",
    ]);
    expect(OVERVIEW_PAGE.news).toBe("Industry news");
    expect(OVERVIEW_PAGE.news).toBe(NEWS_PAGE.title);
    expect(OVERVIEW_PAGE.newsHref).toBe(NEWS_HREF);
    expect(OVERVIEW_PAGE.newsViewAll).toBe("View all");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("'revenue'_'social'_'education'_'needs'_'ai'_'news'");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).not.toContain("aggregation");
    expect(OVERVIEW_PAGE).not.toHaveProperty("topPerforming");
    expect(overviewHref()).toBe(OVERVIEW_HREF);
    expect(overviewHref({ period: "all" })).toBe(OVERVIEW_HREF);
    expect(overviewHref({ period: "ytd" })).toBe(`${OVERVIEW_HREF}?period=ytd`);
    expect(OVERVIEW_NEWS_RAIL_WIDTH).toBe("20rem");
    expect(OVERVIEW_HOME_COLUMN_GUTTER).toBe("var(--chrome-gutter)");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("lg:grid-cols-[minmax(0,1fr)_20rem]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("gap-x-[var(--chrome-gutter)]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("gap-y-[var(--space-6)]");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).not.toMatch(/(?:^| )gap-\[var\(--space-6\)\]/);
    expect(OVERVIEW_HOME_LAYOUT_CLASS).not.toContain("md:grid-cols");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).not.toContain("auto-cols");
    expect(OVERVIEW_HOME_LAYOUT_CLASS).toContain("grid-cols-1");
    expect(OVERVIEW_PAGE.thisWeek).toBe("This week");
    expect(OVERVIEW_PAGE.aiNext).toBe("24Frame AI");
    expect(OVERVIEW_PAGE.aiAsk).toBe("Ask 24Frame AI");
    expect(OVERVIEW_PAGE.aiNextHref).toBe("?ai=1");
    expect(OVERVIEW_PAGE.aiNextHref).not.toContain("/messages");
    expect(readFileSync("src/lib/overview.ts", "utf8")).toContain(
      "quiet overlay opener",
    );
  });

  it("caps Social DMs at 5, Education covers at 3, and 24Frame AI next-moves at 3", () => {
    expect(OVERVIEW_SOCIAL_DM_CAP).toBe(5);
    expect(OVERVIEW_EDUCATION_CAP).toBe(3);
    expect(OVERVIEW_AI_NEXT_CAP).toBe(3);
    expect(OVERVIEW_NEWS_CAP).toBe(15);
    expect(overviewSocialChats([0, 1, 2, 3, 4, 5, 6])).toEqual([0, 1, 2, 3, 4]);
    expect(overviewEducationCourses(["a", "b", "c", "d", "e", "f"])).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(
      overviewAiNextMoves(
        [1, 2, 3, 4, 5].map((n) => ({
          id: String(n),
          title: `Title ${n}`,
          reason: null,
          status: "draft",
        })),
      ).map((row) => row.id),
    ).toEqual(["1", "2", "3"]);
    expect(overviewSocialUnreadTotal([{ unread_count: 2 }, { unread_count: 3 }])).toBe(5);
  });

  it("reuses What-changed nouns for the week pulse and does not invent course percent", () => {
    const now = Date.parse("2026-09-18T12:00:00.000Z");
    const since = overviewWeekSince(now);
    expect(overviewInWeek("2026-09-15T12:00:00.000Z", since)).toBe(true);
    expect(overviewInWeek("2026-09-01T12:00:00.000Z", since)).toBe(false);
    expect(
      overviewWeekPulse({ titlesAdded: 1, deliveriesUpdated: 2, findingsOpened: 0 }).map(
        (row) => row.label,
      ),
    ).toEqual(["1 title added", "2 deliveries updated"]);
    expect(OVERVIEW_PAGE.educationEmpty).toBeTruthy();
    expect(JSON.stringify(OVERVIEW_PAGE)).not.toMatch(/lesson_progress/);
    expect(OVERVIEW_MODULE_NEST_CLASS).toBe(
      "gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-4)]",
    );
    expect(readFileSync("src/lib/overview.ts", "utf8")).not.toContain(
      "OVERVIEW_EDUCATION_LABEL_CLASS",
    );
    expect(readFileSync("src/components/overview/overview-module.tsx", "utf8")).toContain(
      "DASHBOARD_SECTION_TITLE_CLASS",
    );
    expect(readFileSync("src/components/overview/overview-module.tsx", "utf8")).not.toContain(
      "titleClass",
    );
    expect(readFileSync("src/components/overview/overview-home.tsx", "utf8")).not.toContain(
      "titleClass",
    );
  });
});

describe("overviewModuleHeaderAction", () => {
  it("drops a trailing label that matches or echoes the module title", () => {
    expect(overviewModuleHeaderAction("Social", "/social/dms")).toBeNull();
    expect(overviewModuleHeaderAction("Education", "/social/courses")).toBeNull();
    expect(overviewModuleHeaderAction("Needs you", "/attention")).toBeNull();
    expect(overviewModuleHeaderAction(" Social ", "/social/dms", "social")).toBeNull();
    expect(overviewModuleHeaderAction("24Frame AI", undefined, "Ask 24Frame AI")).toBeNull();
  });

  it("keeps a distinct destination CTA", () => {
    expect(
      overviewModuleHeaderAction("24Frame AI", "?ai=1", "Ask 24Frame AI"),
    ).toEqual({ href: "?ai=1", label: "Ask 24Frame AI" });
    expect(
      overviewModuleHeaderAction("Net revenue", "/reports", "Aggregation"),
    ).toEqual({ href: "/reports", label: "Aggregation" });
    expect(overviewModuleHeaderAction(NEWS_PAGE.title, NEWS_HREF, "View all")).toEqual({
      href: NEWS_HREF,
      label: "View all",
    });
  });
});
