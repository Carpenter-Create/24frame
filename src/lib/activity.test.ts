import { describe, expect, it } from "vitest";

import {
  ACTIVITY,
  ACTIVITY_BELL_LIMIT,
  ACTIVITY_HREF,
  ACTIVITY_PERIOD_PRESETS,
  activityBellItems,
  activityBellPreview,
  activityBellPreviewFromNotifications,
  activityEmptyCopy,
  activityHistoryPeriodVisible,
  activityHref,
  activityItemFromNotification,
  activityItemsFromNotifications,
  activityOpenCount,
  activityPeriodPresetKey,
  filterActivityItems,
  isActivityOpen,
  parseActivityPeriod,
  parseActivityState,
  type ActivityNotificationRow,
} from "./activity";
import { NOTIFICATION_EMAIL } from "./notifications";

const TITLE_ID = "aaaaaaaa-1111-4111-8111-111111111111";

function row(
  overrides: Partial<ActivityNotificationRow> & Pick<ActivityNotificationRow, "id">,
): ActivityNotificationRow {
  return {
    kind: "delivery_update",
    title: "North Wind is live",
    body: "Delivery advanced.",
    source_refs: { title_id: TITLE_ID },
    created_at: "2026-09-18T12:00:00.000Z",
    unread: true,
    ...overrides,
  };
}

describe("Activity SoT", () => {
  it("keeps Open as unread and Done as read — one state", () => {
    expect(isActivityOpen(true)).toBe(true);
    expect(isActivityOpen(false)).toBe(false);
    expect(ACTIVITY.open).toBe("Open");
    expect(ACTIVITY.done).toBe("Done");
    expect(ACTIVITY.nav).toBe("Activity");
    expect(ACTIVITY.title).toBe("Activity");
    expect(ACTIVITY.markDone).toBe("Mark done");
    expect(ACTIVITY.viewAll).toBe("View all");
    expect(ACTIVITY_HREF).toBe("/activity");
    expect(ACTIVITY_BELL_LIMIT).toBe(5);
  });

  it("defaults the inbox to Open and treats History as Done or All", () => {
    expect(parseActivityState(undefined)).toBe("open");
    expect(parseActivityState("open")).toBe("open");
    expect(parseActivityState(["done"])).toBe("done");
    expect(parseActivityState("all")).toBe("all");
    expect(parseActivityState("nope")).toBe("open");
    expect(activityHistoryPeriodVisible("open")).toBe(false);
    expect(activityHistoryPeriodVisible("done")).toBe(true);
    expect(activityHistoryPeriodVisible("all")).toBe(true);
    expect(activityEmptyCopy("open")).toBe(ACTIVITY.emptyOpen);
    expect(activityEmptyCopy("done")).toBe(ACTIVITY.emptyDone);
    expect(activityEmptyCopy("all")).toBe(ACTIVITY.emptyAll);
  });

  it("builds /activity hrefs without inventing a second inbox", () => {
    expect(activityHref()).toBe("/activity");
    expect(activityHref({ state: "open" })).toBe("/activity");
    expect(activityHref({ state: "done" })).toBe("/activity?state=done");
    expect(activityHref({ state: "all", period: "ytd" })).toBe("/activity?state=all&period=ytd");
    expect(activityHref({ state: "done", period: "all" })).toBe("/activity?state=done");
  });

  it("maps durable notifications newest first and reuses notification deep-links", () => {
    const older = row({ id: "n1", created_at: "2026-09-01T00:00:00.000Z", unread: false });
    const newer = row({
      id: "n2",
      kind: "title_rejected",
      title: "North Wind was returned",
      created_at: "2026-09-18T15:00:00.000Z",
      unread: true,
    });
    const items = activityItemsFromNotifications([older, newer]);
    expect(items.map((item) => item.id)).toEqual(["n2", "n1"]);
    expect(items[0]?.open).toBe(true);
    expect(items[1]?.open).toBe(false);
    expect(items[0]?.href).toBe(NOTIFICATION_EMAIL.title_rejected.path({ titleId: TITLE_ID }));
    expect(items[1]?.href).toBe(NOTIFICATION_EMAIL.delivery_update.path({ titleId: TITLE_ID }));
    expect(activityItemFromNotification(row({ id: "n3", source_refs: {} })).href).toBe(
      NOTIFICATION_EMAIL.delivery_update.path({}),
    );
  });

  it("filters Open vs Done vs All and applies Reports period grammar", () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    const items = activityItemsFromNotifications([
      row({ id: "open-now", created_at: "2026-09-10T00:00:00.000Z", unread: true }),
      row({ id: "done-now", created_at: "2026-09-08T00:00:00.000Z", unread: false }),
      row({ id: "open-old", created_at: "2025-12-01T00:00:00.000Z", unread: true }),
    ]);
    const ytd = parseActivityPeriod("ytd", now);
    expect(filterActivityItems(items, { state: "open", period: parseActivityPeriod("all", now) }).map((item) => item.id)).toEqual([
      "open-now",
      "open-old",
    ]);
    expect(filterActivityItems(items, { state: "done", period: ytd }).map((item) => item.id)).toEqual([
      "done-now",
    ]);
    expect(filterActivityItems(items, { state: "all", period: ytd }).map((item) => item.id)).toEqual([
      "open-now",
      "done-now",
    ]);
  });

  it("caps the header bell at the last five open items and counts every open row", () => {
    const items = activityItemsFromNotifications(
      Array.from({ length: 7 }, (_, index) =>
        row({
          id: `n${index}`,
          created_at: `2026-09-${String(18 - index).padStart(2, "0")}T00:00:00.000Z`,
          unread: index !== 2,
        }),
      ),
    );
    expect(activityOpenCount(items)).toBe(6);
    expect(activityBellItems(items).map((item) => item.id)).toEqual([
      "n0",
      "n1",
      "n3",
      "n4",
      "n5",
    ]);
    expect(activityBellPreview(items, 9).openCount).toBe(9);
    expect(activityBellPreviewFromNotifications([row({ id: "n9", unread: false })]).items).toEqual([]);
  });

  it("reuses Reports period pills instead of inventing a second grain set", () => {
    const now = new Date("2026-09-18T12:00:00.000Z");
    expect(ACTIVITY_PERIOD_PRESETS.map((preset) => preset.grain)).toEqual([
      "all",
      "ytd",
      "year",
      "quarter",
      "month",
    ]);
    expect(activityPeriodPresetKey("all", now)).toBe("all");
    expect(activityPeriodPresetKey("ytd", now)).toBe("ytd");
    expect(activityPeriodPresetKey("month", now)).toBe("2026-09");
  });
});
