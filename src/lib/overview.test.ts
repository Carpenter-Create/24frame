import { describe, expect, it } from "vitest";

import {
  OVERVIEW,
  OVERVIEW_AI_CHIPS,
  OVERVIEW_EDUCATION_LIMIT,
  OVERVIEW_HREF,
  isoInPastDays,
  overviewCoursePercentLabel,
  overviewEducationItems,
  overviewInitials,
  overviewNeedRowsFromDoNext,
  overviewRevenueLabel,
  overviewSocialAvatars,
  overviewSocialUnreadLabel,
  overviewThisWeekLine,
  overviewTopPerformersLine,
  overviewTopTitleNames,
} from "./overview";

describe("Overview pulse SoT", () => {
  it("keeps Overview as a pulse door with deep-link copy only", () => {
    expect(OVERVIEW_HREF).toBe("/overview");
    expect(OVERVIEW.title).toBe("Overview");
    expect(OVERVIEW.subtitle).toBe("Cross-workspace pulse · deep links only");
    expect(OVERVIEW.openDashboard).toBe("Open Dashboard →");
    expect(OVERVIEW.openSocial).toBe("Open Social →");
    expect(OVERVIEW.openEducation).toBe("Open Education →");
    expect(OVERVIEW_EDUCATION_LIMIT).toBe(5);
    expect(OVERVIEW_AI_CHIPS.map((chip) => chip.href)).toEqual([
      "/messages",
      "/messages",
      "/messages",
    ]);
  });

  it("does not invent revenue, unread, or course percent", () => {
    expect(overviewRevenueLabel(null)).toBeNull();
    expect(overviewRevenueLabel(12844000)).toBe("$128,440.00");
    expect(overviewTopPerformersLine([])).toBeNull();
    expect(overviewTopPerformersLine(["Horizon", "Night Drive"])).toBe("Horizon · Night Drive");
    expect(overviewCoursePercentLabel(null)).toBeNull();
    expect(overviewCoursePercentLabel(62.2)).toBe("62% complete");
    expect(overviewCoursePercentLabel(140)).toBeNull();
    expect(overviewEducationItems([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4, 5]);
    expect(OVERVIEW).not.toHaveProperty("sampleRevenue");
  });

  it("formats Social unread and initials from real names only", () => {
    expect(overviewSocialUnreadLabel(0)).toBe("0 messages");
    expect(overviewSocialUnreadLabel(1)).toBe("1 message");
    expect(overviewSocialUnreadLabel(7)).toBe("7 messages");
    expect(overviewInitials("Jordan Kane")).toBe("JK");
    expect(overviewInitials("Ada")).toBe("AD");
    expect(overviewInitials("  ")).toBe("");
    expect(overviewSocialAvatars([{ id: "1", name: "Jordan Kane" }, { id: "1", name: "Dup" }])).toEqual([
      { id: "1", initials: "JK" },
    ]);
  });

  it("maps Needs you from Do next and builds This week from real counts", () => {
    const rows = overviewNeedRowsFromDoNext([
      { id: "t1", title: "Horizon EP", reason: "Clear delivery hold on Horizon EP", status: "live" },
    ]);
    expect(rows[0]?.title).toBe("Clear delivery hold on Horizon EP");
    expect(rows[0]?.detail).toBe("Titles · Aggregation");
    expect(rows[0]?.href).toBe("/titles/t1");
    expect(overviewThisWeekLine({ deliveriesUpdated: 0, attentionOpen: 0, socialUnread: 0 })).toBeNull();
    expect(
      overviewThisWeekLine({ deliveriesUpdated: 12, attentionOpen: 4, socialUnread: 0 }),
    ).toBe("12 deliveries updated · 4 attention items open");
    expect(isoInPastDays("2026-09-17T12:00:00.000Z", 7, new Date("2026-09-18T12:00:00.000Z"))).toBe(
      true,
    );
    expect(isoInPastDays("2026-08-01T12:00:00.000Z", 7, new Date("2026-09-18T12:00:00.000Z"))).toBe(
      false,
    );
    expect(
      overviewTopTitleNames([
        { id: "a", title: "Horizon", status: "live", created_at: "2026-09-01T00:00:00.000Z", count: 3 },
        { id: "b", title: "Night Drive", status: "live", created_at: "2026-09-02T00:00:00.000Z", count: 2 },
      ]),
    ).toEqual(["Horizon", "Night Drive"]);
  });
});
