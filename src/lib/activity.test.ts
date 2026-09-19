import { describe, expect, it } from "vitest";

import { HOUSE_HEADER_TRAILING_HIT_CLASS } from "@/lib/house-lead-chrome";
import {
  ACTIVITY_BELL_OPEN_CAP,
  ACTIVITY_BELL_OPEN_DOT_CLASS,
  ACTIVITY_BELL_TRIGGER_CLASS,
  ACTIVITY_BELL_TRIGGER_OPEN_CLASS,
  ACTIVITY_HREF,
  ACTIVITY_KIND_ICON,
  ACTIVITY_PAGE,
  activityBellItems,
  activityEmptyCopy,
  activityHref,
  activityItemHref,
  activityKindIcon,
  activityRelativeTime,
  filterActivityItems,
  isActivityOpen,
  parseActivityPeriod,
  parseActivityStatus,
} from "./activity";
import { parseReportsPeriod } from "./reports";

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

describe("Activity inbox — Open / Done is one read state", () => {
  it("treats unread as Open and read as Done", () => {
    expect(isActivityOpen(OPEN_NEW)).toBe(true);
    expect(isActivityOpen(DONE_NEW)).toBe(false);
    expect(parseActivityStatus(undefined)).toBe("open");
    expect(parseActivityStatus("open")).toBe("open");
    expect(parseActivityStatus("done")).toBe("done");
    expect(parseActivityStatus(["done"])).toBe("open");
    expect(parseActivityStatus("nope")).toBe("open");
  });

  it("defaults to the Open inbox and leaves Done in history", () => {
    const all = parseReportsPeriod("all", NOW);
    expect(filterActivityItems(FEED, "open", all).map((row) => row.id)).toEqual(["1", "2"]);
    expect(filterActivityItems(FEED, "done", all).map((row) => row.id)).toEqual(["3", "4"]);
    expect(filterActivityItems(FEED, "open", all).every((row) => row.unread)).toBe(true);
    expect(filterActivityItems(FEED, "done", all).every((row) => !row.unread)).toBe(true);
    expect(activityEmptyCopy("open")).toBe(ACTIVITY_PAGE.emptyOpen);
    expect(activityEmptyCopy("done")).toBe(ACTIVITY_PAGE.emptyDone);
  });

  it("keeps newest→oldest order from the feed primitive", () => {
    const all = parseReportsPeriod("all", NOW);
    expect(filterActivityItems(FEED, "open", all).map((row) => row.created_at)).toEqual([
      "2026-09-12T12:00:00.000Z",
      "2026-08-02T12:00:00.000Z",
    ]);
  });
});

describe("Activity period chips", () => {
  it("reuses Reports YTD / year / quarter / month", () => {
    expect(parseActivityPeriod("ytd", NOW)).toMatchObject({ kind: "ytd", year: 2026 });
    expect(parseActivityPeriod("year", NOW)).toMatchObject({ kind: "year", year: 2026 });
    expect(parseActivityPeriod("quarter", NOW)).toMatchObject({
      kind: "quarter",
      year: 2026,
      quarter: 3,
    });
    expect(parseActivityPeriod("month", NOW)).toMatchObject({
      kind: "month",
      year: 2026,
      month: 9,
    });
    expect(parseActivityPeriod(undefined, NOW).kind).toBe("all");
  });

  it("filters Open and Done by the selected period", () => {
    const september = parseReportsPeriod("2026-09", NOW);
    expect(filterActivityItems(FEED, "open", september).map((row) => row.id)).toEqual(["1"]);
    expect(filterActivityItems(FEED, "done", september).map((row) => row.id)).toEqual(["3"]);
    expect(filterActivityItems(FEED, "open", parseReportsPeriod("ytd", NOW)).map((row) => row.id)).toEqual(
      ["1", "2"],
    );
    expect(filterActivityItems(FEED, "done", parseReportsPeriod("ytd", NOW)).map((row) => row.id)).toEqual(
      ["3"],
    );
  });

  it("builds status + period hrefs without inventing a second feed", () => {
    expect(activityHref({})).toBe(ACTIVITY_HREF);
    expect(activityHref({ status: "open" })).toBe(ACTIVITY_HREF);
    expect(activityHref({ status: "done" })).toBe(`${ACTIVITY_HREF}?status=done`);
    expect(activityHref({ status: "open", period: "ytd" })).toBe(`${ACTIVITY_HREF}?period=ytd`);
    expect(activityHref({ status: "done", period: "2026-09" })).toBe(
      `${ACTIVITY_HREF}?status=done&period=2026-09`,
    );
    expect(activityHref({ period: "all" })).toBe(ACTIVITY_HREF);
  });
});

describe("Activity bell cap", () => {
  it("caps the popover at the last 5 open items", () => {
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
    expect(activityItemHref(OPEN_NEW)).toBe("/aggregation/activity");
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
