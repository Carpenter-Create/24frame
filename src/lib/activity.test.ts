import { describe, expect, it } from "vitest";

import { HOUSE_HEADER_TRAILING_HIT_CLASS } from "@/lib/house-lead-chrome";
import {
  ACTIVITY_BELL_OPEN_CAP,
  ACTIVITY_BELL_OPEN_DOT_CLASS,
  ACTIVITY_BELL_TRIGGER_CLASS,
  ACTIVITY_BELL_TRIGGER_OPEN_CLASS,
  ACTIVITY_FAMILIES,
  ACTIVITY_FAMILY_ALL,
  ACTIVITY_HREF,
  ACTIVITY_KIND_ICON,
  ACTIVITY_PAGE,
  ACTIVITY_PREFS_HREF,
  isActivityPath,
  activityBellItems,
  activityEmptyCopy,
  activityFamilyForKind,
  activityFamilyLabel,
  activityHref,
  activityItemHref,
  activityKindIcon,
  activityRelativeTime,
  filterActivityItems,
  isActivityOpen,
  parseActivityFamily,
} from "./activity";

const OPEN_NEW = {
  id: "1",
  title: "North Wind was returned",
  body: "Chain of title is missing.",
  kind: "title_rejected" as const,
  created_at: "2026-09-12T12:00:00.000Z",
  unread: true,
};
const OPEN_OLD = {
  id: "2",
  title: "Harbor Cut delivery update",
  body: "Delivered to the channel.",
  kind: "delivery_update" as const,
  created_at: "2026-08-02T12:00:00.000Z",
  unread: true,
};
const DONE_NEW = {
  id: "3",
  title: "Winter Light was returned",
  body: "Runtime is required.",
  kind: "title_rejected" as const,
  created_at: "2026-09-15T12:00:00.000Z",
  unread: false,
};
const DONE_OLD = {
  id: "4",
  title: "Older done",
  body: "Taken down.",
  kind: "delivery_update" as const,
  created_at: "2025-12-02T12:00:00.000Z",
  unread: false,
};

const FEED = [DONE_NEW, OPEN_NEW, OPEN_OLD, DONE_OLD];
const NOW = new Date("2026-09-18T12:00:00.000Z");

describe("Activity live feed — uncleared only", () => {
  it("keeps unread items and drops cleared ones from the default feed", () => {
    expect(isActivityOpen(OPEN_NEW)).toBe(true);
    expect(isActivityOpen(DONE_NEW)).toBe(false);
    expect(filterActivityItems(FEED).map((row) => row.id)).toEqual(["1", "2"]);
    expect(filterActivityItems(FEED).every((row) => row.unread)).toBe(true);
    expect(activityEmptyCopy()).toBe(ACTIVITY_PAGE.empty);
    expect(ACTIVITY_PAGE.empty).toBe("You're all caught up.");
    expect(ACTIVITY_PAGE.emptyHint).toBe("New alerts will show here.");
    expect(ACTIVITY_PAGE).not.toHaveProperty("open");
    expect(ACTIVITY_PAGE).not.toHaveProperty("done");
    expect(ACTIVITY_PAGE).not.toHaveProperty("emptyOpen");
    expect(ACTIVITY_PAGE).not.toHaveProperty("emptyDone");
  });

  it("keeps newest→oldest order from the feed primitive", () => {
    expect(filterActivityItems(FEED).map((row) => row.created_at)).toEqual([
      "2026-09-12T12:00:00.000Z",
      "2026-08-02T12:00:00.000Z",
    ]);
  });
});

describe("Activity chrome href", () => {
  it("keeps one chrome-level SoT and does not nest under Aggregation", () => {
    expect(ACTIVITY_HREF).toBe("/activity");
    expect(ACTIVITY_HREF).not.toContain("/aggregation/");
    expect(isActivityPath("/activity")).toBe(true);
    expect(isActivityPath("/activity/x")).toBe(true);
    expect(isActivityPath("/aggregation/activity")).toBe(false);
    expect(isActivityPath("/settings")).toBe(false);
    expect(isActivityPath("/help")).toBe(false);
  });
});

describe("Activity family chips", () => {
  it("reuses prefs families and defaults to All", () => {
    expect(ACTIVITY_FAMILIES).toEqual([
      "all",
      "aggregation",
      "reporting",
      "social",
      "education",
      "account",
    ]);
    expect(parseActivityFamily(undefined)).toBe(ACTIVITY_FAMILY_ALL);
    expect(parseActivityFamily("social")).toBe("social");
    expect(parseActivityFamily(["social"])).toBe("all");
    expect(parseActivityFamily("nope")).toBe("all");
    expect(activityFamilyLabel("all")).toBe(ACTIVITY_PAGE.all);
    expect(activityFamilyLabel("aggregation")).toBe("Aggregation");
    expect(activityFamilyForKind("title_rejected")).toBe("aggregation");
    expect(activityFamilyForKind("delivery_update")).toBe("aggregation");
    expect(ACTIVITY_PREFS_HREF).toBe("/settings/preferences/notifications");
  });

  it("filters the live feed by the selected prefs family", () => {
    expect(filterActivityItems(FEED, "aggregation").map((row) => row.id)).toEqual(["1", "2"]);
    expect(filterActivityItems(FEED, "social")).toEqual([]);
    expect(filterActivityItems(FEED, "reporting")).toEqual([]);
    expect(filterActivityItems(FEED, "all").every((row) => row.unread)).toBe(true);
  });

  it("builds family hrefs without status or period chrome", () => {
    expect(activityHref()).toBe(ACTIVITY_HREF);
    expect(activityHref({})).toBe(ACTIVITY_HREF);
    expect(activityHref({ family: "all" })).toBe(ACTIVITY_HREF);
    expect(activityHref({ family: "social" })).toBe(`${ACTIVITY_HREF}?family=social`);
    expect(activityHref({ family: "reporting" })).toBe(`${ACTIVITY_HREF}?family=reporting`);
  });
});

describe("Activity bell cap", () => {
  it("caps the last 5 open items", () => {
    expect(ACTIVITY_BELL_OPEN_CAP).toBe(5);
    const open = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      unread: true,
    }));
    expect(activityBellItems(open).map((row) => row.id)).toEqual(["0", "1", "2", "3", "4"]);
    expect(activityBellItems([...open, { id: "done", unread: false }]).map((row) => row.id)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(activityBellItems([{ id: "done", unread: false }])).toEqual([]);
  });

  it("maps house type icons and reuses Social relative time", () => {
    expect(activityKindIcon("title_rejected")).toBe("film-slate");
    expect(activityKindIcon("delivery_update")).toBe("paper-plane-tilt");
    expect(ACTIVITY_KIND_ICON.title_rejected).toBe("film-slate");
    expect(activityItemHref(OPEN_NEW)).toBe(ACTIVITY_HREF);
    expect(activityRelativeTime("2026-09-18T11:00:00.000Z", NOW.getTime())).toBe("1h");
    expect(ACTIVITY_PAGE.viewAll).toBe("View all activity");
    expect(ACTIVITY_PAGE.dismiss).toBe("Mark done");
    expect(ACTIVITY_PAGE.close).toBe("Close activity");
    expect(ACTIVITY_PAGE).not.toHaveProperty("view");
    expect(ACTIVITY_PAGE).not.toHaveProperty("markAllDone");
    expect(ACTIVITY_BELL_TRIGGER_CLASS).toContain(HOUSE_HEADER_TRAILING_HIT_CLASS);
    expect(ACTIVITY_BELL_TRIGGER_CLASS).toContain("hover:bg-surface-muted");
    expect(ACTIVITY_BELL_TRIGGER_CLASS).toContain("rounded-full");
    expect(ACTIVITY_BELL_TRIGGER_OPEN_CLASS).toBe("bg-surface-muted");
    expect(ACTIVITY_BELL_OPEN_DOT_CLASS).toContain("bg-accent");
  });
});
