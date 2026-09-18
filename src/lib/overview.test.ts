import { describe, expect, it } from "vitest";

import { ASSISTANT_NAME } from "@/lib/product";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { availableWorkspaceOptions } from "@/lib/workspace-menu";
import {
  OVERVIEW_AI_NEXT_CAP,
  OVERVIEW_EDUCATION_CAP,
  OVERVIEW_HREF,
  OVERVIEW_LEGACY_HREF,
  OVERVIEW_MODULE_ORDER,
  OVERVIEW_PAGE,
  OVERVIEW_RAIL_OFF_WIDTH,
  OVERVIEW_SOCIAL_DM_CAP,
  isOverviewPath,
  overviewAiNextMoves,
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

  it("hides dest rails on Home and keeps them on workspace routes", () => {
    expect(overviewHidesRail("/home")).toBe(true);
    expect(overviewHidesRail("/home/x")).toBe(true);
    expect(overviewHidesRail("/overview")).toBe(true);
    expect(overviewHidesRail("/dashboard")).toBe(false);
    expect(overviewHidesRail("/social")).toBe(false);
    expect(overviewHidesRail("/social/courses")).toBe(false);
    expect(overviewHidesRail("/titles")).toBe(false);
    expect(overviewHidesRail("/settings")).toBe(false);
    expect(OVERVIEW_RAIL_OFF_WIDTH).toBe("0px");
  });
});

describe("Home module caps", () => {
  it("locks positive-first Home modules and folds This week into Aggregation", () => {
    expect(OVERVIEW_MODULE_ORDER).toEqual([
      "social",
      "education",
      "aggregation",
      "needs-you",
      "ai-next",
    ]);
    expect(OVERVIEW_PAGE.thisWeek).toBe("This week");
  });

  it("caps Social DMs at 5, Education covers at 5, and 24Frame AI next-moves at 3", () => {
    expect(OVERVIEW_SOCIAL_DM_CAP).toBe(5);
    expect(OVERVIEW_EDUCATION_CAP).toBe(5);
    expect(OVERVIEW_AI_NEXT_CAP).toBe(3);
    expect(overviewSocialChats([0, 1, 2, 3, 4, 5, 6])).toEqual([0, 1, 2, 3, 4]);
    expect(overviewEducationCourses(["a", "b", "c", "d", "e", "f"])).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
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
  });
});
