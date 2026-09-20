import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NOTIFICATION_PREF_DEFAULTS, withNotificationPref } from "@/lib/notification-prefs";
import {
  acceptLiveNotificationRow,
  inAppPrefAllowsKind,
  isSocialInAppNotificationKind,
  liveUnreadCount,
  mergeLiveActivityItems,
  NOTIFICATIONS_REALTIME_EVENT,
  NOTIFICATIONS_REALTIME_SCHEMA,
  NOTIFICATIONS_REALTIME_TABLE,
  ownNotificationsRealtimeChannel,
  ownNotificationsRealtimeFilter,
  resetOwnNotificationsRealtimeForTests,
  retainOwnNotificationsRealtime,
  retireLiveNotification,
  type NotificationsRealtimeChannel,
  type NotificationsRealtimeClient,
  type NotificationsRealtimeInsertPayload,
} from "./notifications-realtime";

const USER = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2";

const FOLLOW_ROW = {
  id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
  kind: "new_follower",
  title: "New follower",
  body: "@ada followed you",
  created_at: "2026-09-20T16:00:00.000Z",
  recipient_user_id: USER,
  org_id: null,
  source_refs: { handle: "ada" },
};

function fakeClient() {
  let handler: ((payload: NotificationsRealtimeInsertPayload) => void) | null = null;
  const channel: NotificationsRealtimeChannel = {
    on: (_event, spec, callback) => {
      capturedSpec = spec;
      handler = callback;
      return channel;
    },
    subscribe: () => channel,
  };
  const client: NotificationsRealtimeClient = {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
  };
  return {
    client,
    push: (row: Record<string, unknown>) => handler?.({ new: row }),
  };
}

let capturedSpec: {
  event: "INSERT";
  schema: "public";
  table: "notifications";
  filter: string;
} | null = null;

function filesContaining(dir: string, needle: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.endsWith(".test.ts") || name.endsWith(".test.tsx")) {
      continue;
    }
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      filesContaining(path, needle, acc);
      continue;
    }
    if (/\.(ts|tsx)$/.test(name) && readFileSync(path, "utf8").includes(needle)) {
      acc.push(path);
    }
  }
  return acc.sort();
}

afterEach(() => {
  resetOwnNotificationsRealtimeForTests();
  capturedSpec = null;
});

describe("own-notifications Realtime filter", () => {
  it("pins the channel and filter to recipient_user_id = auth.uid()", () => {
    expect(ownNotificationsRealtimeFilter(USER)).toBe(`recipient_user_id=eq.${USER}`);
    expect(ownNotificationsRealtimeChannel(USER)).toBe(`notifications:recipient:${USER}`);
    expect(NOTIFICATIONS_REALTIME_TABLE).toBe("notifications");
    expect(NOTIFICATIONS_REALTIME_SCHEMA).toBe("public");
    expect(NOTIFICATIONS_REALTIME_EVENT).toBe("INSERT");
  });

  it("refuses a missing or non-UUID user id so the filter cannot go open", () => {
    expect(ownNotificationsRealtimeFilter("")).toBeNull();
    expect(ownNotificationsRealtimeFilter("auth.uid()")).toBeNull();
    expect(ownNotificationsRealtimeFilter("../admin")).toBeNull();
    expect(ownNotificationsRealtimeChannel("not-a-uuid")).toBeNull();
  });
});

describe("acceptLiveNotificationRow", () => {
  it("accepts a recipient-targeted new_follower row", () => {
    expect(acceptLiveNotificationRow(FOLLOW_ROW, USER)).toEqual({
      id: FOLLOW_ROW.id,
      title: FOLLOW_ROW.title,
      body: FOLLOW_ROW.body,
      kind: "new_follower",
      created_at: FOLLOW_ROW.created_at,
      unread: true,
      source_refs: { handle: "ada" },
    });
  });

  it("drops catalog kinds, foreign recipients, and in-app-off prefs", () => {
    expect(
      acceptLiveNotificationRow({ ...FOLLOW_ROW, kind: "title_rejected", org_id: "org" }, USER),
    ).toBeNull();
    expect(acceptLiveNotificationRow({ ...FOLLOW_ROW, recipient_user_id: OTHER }, USER)).toBeNull();
    expect(acceptLiveNotificationRow({ ...FOLLOW_ROW, recipient_user_id: null }, USER)).toBeNull();
    expect(isSocialInAppNotificationKind("new_follower")).toBe(true);
    expect(isSocialInAppNotificationKind("title_rejected")).toBe(false);
    expect(isSocialInAppNotificationKind("delivery_update")).toBe(false);
    expect(inAppPrefAllowsKind("new_follower")).toBe(true);
    expect(inAppPrefAllowsKind("new_follower", NOTIFICATION_PREF_DEFAULTS)).toBe(true);
    expect(
      inAppPrefAllowsKind(
        "new_follower",
        withNotificationPref(NOTIFICATION_PREF_DEFAULTS, "new_follower", "in_app", false),
      ),
    ).toBe(false);
    expect(
      acceptLiveNotificationRow(
        FOLLOW_ROW,
        USER,
        withNotificationPref(NOTIFICATION_PREF_DEFAULTS, "new_follower", "in_app", false),
      ),
    ).toBeNull();
  });
});

describe("retainOwnNotificationsRealtime", () => {
  it("opens one INSERT channel and fans inserts to every listener", () => {
    const { client, push } = fakeClient();
    const a = vi.fn();
    const b = vi.fn();
    const releaseA = retainOwnNotificationsRealtime(client, USER, a);
    const releaseB = retainOwnNotificationsRealtime(client, USER, b);
    expect(client.channel).toHaveBeenCalledTimes(1);
    expect(client.channel).toHaveBeenCalledWith(`notifications:recipient:${USER}`);
    expect(capturedSpec).toEqual({
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `recipient_user_id=eq.${USER}`,
    });
    push(FOLLOW_ROW);
    expect(a).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: FOLLOW_ROW.id, kind: "new_follower", unread: true }),
    ]);
    expect(b).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: FOLLOW_ROW.id }),
    ]);
    releaseA();
    expect(client.removeChannel).not.toHaveBeenCalled();
    releaseB();
    expect(client.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("does not subscribe without a recipient filter and unsubscribes on last release", () => {
    const { client, push } = fakeClient();
    const listener = vi.fn();
    const release = retainOwnNotificationsRealtime(client, "nope", listener);
    expect(client.channel).not.toHaveBeenCalled();
    release();
    const keep = retainOwnNotificationsRealtime(client, USER, listener);
    push({ ...FOLLOW_ROW, kind: "title_rejected" });
    expect(listener).toHaveBeenLastCalledWith([]);
    keep();
    expect(client.removeChannel).toHaveBeenCalledTimes(1);
  });

  it("retires a live row so Mark done cannot resurrect it after refresh", () => {
    const { client, push } = fakeClient();
    const listener = vi.fn();
    retainOwnNotificationsRealtime(client, USER, listener);
    push(FOLLOW_ROW);
    retireLiveNotification(FOLLOW_ROW.id);
    expect(listener).toHaveBeenLastCalledWith([]);
  });
});

describe("mergeLiveActivityItems", () => {
  it("prepends unseen live rows and does not double a seed id", () => {
    const seed = [{ id: "1", unread: true }];
    const live = [
      { id: "2", unread: true },
      { id: "1", unread: true },
    ];
    expect(mergeLiveActivityItems(seed, live).map((row) => row.id)).toEqual(["2", "1"]);
    expect(liveUnreadCount(3, seed, live)).toBe(4);
    expect(liveUnreadCount(0, [], [{ id: "2", unread: true }])).toBe(1);
  });

  it("does not treat an older live row as an extra after the peek refreshed", () => {
    const peek = [
      { id: "c1", unread: true, created_at: "2026-09-20T17:00:00.000Z" },
      { id: "c2", unread: true, created_at: "2026-09-20T16:50:00.000Z" },
      { id: "c3", unread: true, created_at: "2026-09-20T16:40:00.000Z" },
      { id: "c4", unread: true, created_at: "2026-09-20T16:30:00.000Z" },
      { id: "c5", unread: true, created_at: "2026-09-20T16:20:00.000Z" },
    ];
    const absorbed = {
      id: FOLLOW_ROW.id,
      unread: true,
      created_at: "2026-09-20T16:00:00.000Z",
    };
    expect(mergeLiveActivityItems(peek, [absorbed]).map((row) => row.id)).toEqual(
      peek.map((row) => row.id),
    );
    expect(liveUnreadCount(6, peek, [absorbed])).toBe(6);
    expect(
      liveUnreadCount(5, peek, [
        { id: "new", unread: true, created_at: "2026-09-20T17:10:00.000Z" },
      ]),
    ).toBe(6);
  });
});

describe("Realtime hygiene", () => {
  it("keeps one SoT helper and does not revive the deleted generic client", () => {
    const src = readFileSync("src/lib/notifications-realtime.ts", "utf8");
    expect(src).toContain("recipient_user_id=eq.");
    expect(src).toContain("postgres_changes");
    expect(src).toContain("retainOwnNotificationsRealtime");
    expect(src).not.toContain("create_notification");
    expect(src).not.toMatch(/\bnotify_new_follower\s*\(/);
    expect(src).not.toMatch(/from ["']@\/lib\/email["']/);
    expect(src).not.toMatch(/\bresend\b/i);
    expect(existsSync("src/lib/supabase/client.ts")).toBe(false);
    expect(existsSync("src/lib/supabase/browser.ts")).toBe(true);
    const browser = readFileSync("src/lib/supabase/browser.ts", "utf8");
    expect(browser).toContain("createBrowserClient");
    expect(browser).toContain("Realtime channels only");
    expect(browser).not.toContain(".from(");
    const hook = readFileSync("src/components/activity/use-own-notifications-realtime.ts", "utf8");
    expect(hook).toContain("retainOwnNotificationsRealtime");
    expect(hook).toContain("getSession");
    expect(hook.match(/retainOwnNotificationsRealtime\(/g)).toHaveLength(1);
    expect(filesContaining("src", "postgres_changes")).toEqual([
      "src/lib/notifications-realtime.ts",
    ]);
  });

  it("fails if the recipient filter is gutted", () => {
    const src = readFileSync("src/lib/notifications-realtime.ts", "utf8");
    expect(src).toMatch(/recipient_user_id=eq\.\$\{userId\}/);
    expect(ownNotificationsRealtimeFilter(USER)).toContain("recipient_user_id");
  });
});
