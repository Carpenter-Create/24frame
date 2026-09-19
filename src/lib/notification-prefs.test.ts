import { describe, expect, it } from "vitest";

import { NOTIFICATION_EMAIL } from "./notifications";
import {
  NOTIFICATION_PREF_CHANNELS,
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_PREF_EVENTS,
  NOTIFICATION_PREFS,
  isNotificationChannelOn,
  notificationPrefColumn,
  notificationPrefEventForKind,
  notificationPrefWriteSchema,
  notificationPrefsToRow,
  parseNotificationPrefsRow,
  withNotificationPref,
} from "./notification-prefs";

describe("notification prefs SoT", () => {
  it("locks the five v1 events and two channels", () => {
    expect(NOTIFICATION_PREF_EVENTS).toEqual([
      "title_queue",
      "delivery_review",
      "activity_mentions",
      "education",
      "team_invites",
    ]);
    expect(NOTIFICATION_PREF_CHANNELS).toEqual(["in_app", "email"]);
    expect(NOTIFICATION_PREFS.events.title_queue).toBe("Title and queue status");
    expect(NOTIFICATION_PREFS.events.delivery_review).toBe("Delivery and review");
    expect(NOTIFICATION_PREFS.events.activity_mentions).toBe("Activity and mentions");
    expect(NOTIFICATION_PREFS.events.education).toBe("Course updates");
    expect(NOTIFICATION_PREFS.events.team_invites).toBe("Team and org invites");
    expect(`${NOTIFICATION_PREFS.title} ${NOTIFICATION_PREFS.helper}`).not.toMatch(
      /seamless|frictionless|elevate|amplify|unleash|supercharge/i,
    );
  });

  it("defaults in-app on; email on for live ops + invites, off for the rest", () => {
    expect(NOTIFICATION_PREF_DEFAULTS.title_queue).toEqual({ in_app: true, email: true });
    expect(NOTIFICATION_PREF_DEFAULTS.delivery_review).toEqual({ in_app: true, email: true });
    expect(NOTIFICATION_PREF_DEFAULTS.activity_mentions).toEqual({ in_app: true, email: false });
    expect(NOTIFICATION_PREF_DEFAULTS.education).toEqual({ in_app: true, email: false });
    expect(NOTIFICATION_PREF_DEFAULTS.team_invites).toEqual({ in_app: true, email: true });
  });

  it("maps live notification kinds onto the matrix rows", () => {
    expect(notificationPrefEventForKind("title_rejected")).toBe("title_queue");
    expect(notificationPrefEventForKind("delivery_update")).toBe("delivery_review");
    expect(Object.keys(NOTIFICATION_EMAIL)).toEqual(["title_rejected", "delivery_update"]);
  });

  it("reads a partial row as defaults plus the written cells", () => {
    const prefs = parseNotificationPrefsRow({
      title_queue_email: false,
      education_email: true,
      leftover: "ignore",
    });
    expect(prefs.title_queue.email).toBe(false);
    expect(prefs.title_queue.in_app).toBe(true);
    expect(prefs.education.email).toBe(true);
    expect(prefs.activity_mentions.email).toBe(false);
    expect(parseNotificationPrefsRow(null)).toEqual(NOTIFICATION_PREF_DEFAULTS);
    expect(parseNotificationPrefsRow({ title_queue_email: "no" })).toEqual(
      NOTIFICATION_PREF_DEFAULTS,
    );
  });

  it("flips one cell and flattens the row for upsert", () => {
    const next = withNotificationPref(
      NOTIFICATION_PREF_DEFAULTS,
      "activity_mentions",
      "email",
      true,
    );
    expect(isNotificationChannelOn(next, "activity_mentions", "email")).toBe(true);
    expect(isNotificationChannelOn(NOTIFICATION_PREF_DEFAULTS, "activity_mentions", "email")).toBe(
      false,
    );
    expect(notificationPrefColumn("title_queue", "in_app")).toBe("title_queue_in_app");
    const row = notificationPrefsToRow("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", next);
    expect(row.user_id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(row.activity_mentions_email).toBe(true);
    expect(row.title_queue_email).toBe(true);
  });

  it("rejects invented events at the write edge", () => {
    expect(
      notificationPrefWriteSchema.safeParse({
        event: "title_queue",
        channel: "in_app",
        enabled: false,
      }).success,
    ).toBe(true);
    expect(
      notificationPrefWriteSchema.safeParse({
        event: "marketing",
        channel: "email",
        enabled: true,
      }).success,
    ).toBe(false);
  });
});
