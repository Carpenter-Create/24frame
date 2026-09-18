import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ASK_GLOBEE_TRY_PROMPTS } from "./ask-globee";
import { SOCIAL_ROUTES } from "./social";
import {
  OVERVIEW,
  OVERVIEW_AI_CHIPS,
  OVERVIEW_EDUCATION_LIMIT,
  OVERVIEW_HREF,
  OVERVIEW_SOCIAL_ABSENT,
  OVERVIEW_SOCIAL_AVATAR_LIMIT,
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
  it("keeps Home as a pulse door with deep-link copy only", () => {
    expect(OVERVIEW_HREF).toBe("/home");
    expect(OVERVIEW_HREF).not.toBe(SOCIAL_ROUTES.home);
    expect(OVERVIEW.title).toBe("Home");
    expect(OVERVIEW.nav).toBe("Home");
    const nextConfig = readFileSync(new URL("../../next.config.ts", import.meta.url), "utf8");
    expect(nextConfig).toContain('source: "/overview"');
    expect(nextConfig).toContain('destination: "/home"');
    expect(OVERVIEW.subtitle).toBe("Cross-workspace pulse · deep links only");
    expect(OVERVIEW.openDashboard).toBe("Open Dashboard →");
    expect(OVERVIEW.openSocial).toBe("Open Social →");
    expect(OVERVIEW.openEducation).toBe("Open Education →");
    expect(OVERVIEW_EDUCATION_LIMIT).toBe(5);
    expect(OVERVIEW.educationEmptyTitle).toBe("Education not entered yet");
    expect(OVERVIEW.enterEducation).toBe("Enter Education");
    expect(OVERVIEW_AI_CHIPS.map((chip) => chip.label)).toEqual([...ASK_GLOBEE_TRY_PROMPTS]);
    expect(OVERVIEW_AI_CHIPS.map((chip) => chip.href)).toEqual([
      "/messages",
      "/messages",
      "/messages",
    ]);
    expect(JSON.stringify(OVERVIEW)).not.toContain("Globee");
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
      { id: "1", name: "Jordan Kane", photoUrl: null },
    ]);
    expect(
      overviewSocialAvatars(
        Array.from({ length: 7 }, (_, index) => ({
          id: String(index),
          name: `Peer ${index}`,
          photoUrl: null,
        })),
      ),
    ).toHaveLength(OVERVIEW_SOCIAL_AVATAR_LIMIT);
    expect(OVERVIEW_SOCIAL_AVATAR_LIMIT).toBe(5);
    for (const absent of OVERVIEW_SOCIAL_ABSENT) {
      expect(JSON.stringify(OVERVIEW)).not.toContain(absent);
    }
    const loadSrc = readFileSync(new URL("./overview-load.ts", import.meta.url), "utf8");
    expect(loadSrc).toContain("signedAvatarUrls");
    expect(loadSrc).toContain("overviewSocialAvatars");
    expect(loadSrc).not.toContain("last_message");
    expect(loadSrc).not.toContain(".body");
    expect(loadSrc).not.toContain("socialDmHref");
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
