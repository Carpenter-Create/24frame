import { describe, expect, it } from "vitest";

import { NOTIFICATION_EMAIL } from "./notifications";
import {
  NOTIFICATION_PREF_CHANNELS,
  NOTIFICATION_PREF_DEFAULTS,
  NOTIFICATION_PREF_EVENTS,
  NOTIFICATION_PREF_GROUPS,
  NOTIFICATION_PREF_TITLE_STATUS_EVENT,
  NOTIFICATION_PREFS,
  isNotificationChannelOn,
  notificationPrefEventForKind,
  notificationPrefWriteSchema,
  notificationPrefsToRow,
  parseNotificationPrefsRow,
  withNotificationPref,
} from "./notification-prefs";

describe("notification prefs SoT", () => {
  it("locks the 26 founder events in Aggregation / Social / Education / Account", () => {
    expect(NOTIFICATION_PREF_EVENTS).toHaveLength(26);
    expect(NOTIFICATION_PREF_CHANNELS).toEqual(["in_app", "email"]);
    expect(NOTIFICATION_PREF_GROUPS.map((group) => group.id)).toEqual([
      "aggregation",
      "social",
      "education",
      "account",
    ]);
    expect(NOTIFICATION_PREF_GROUPS.flatMap((group) => group.sections.flatMap((section) => [
      ...section.events,
    ]))).toEqual([...NOTIFICATION_PREF_EVENTS]);
    expect(NOTIFICATION_PREFS.events.title_returned).toBe("Title returned for revision");
    expect(NOTIFICATION_PREFS.events.dm_received).toBe("Direct message received");
    expect(NOTIFICATION_PREFS.events.course_available).toBe("New course available");
    expect(NOTIFICATION_PREFS.events.team_invite).toBe("Team invite received");
    expect(NOTIFICATION_PREFS.groups.reporting).toBe("Reporting");
    expect(`${NOTIFICATION_PREFS.title} ${NOTIFICATION_PREFS.helper}`).not.toMatch(
      /seamless|frictionless|elevate|amplify|unleash|supercharge/i,
    );
  });

  it("defaults in-app on; email on for live ops, money, reporting, DMs, and account", () => {
    expect(NOTIFICATION_PREF_DEFAULTS.title_returned).toEqual({ in_app: true, email: true });
    expect(NOTIFICATION_PREF_DEFAULTS.title_status).toEqual({ in_app: true, email: true });
    expect(NOTIFICATION_PREF_DEFAULTS.delivery_status).toEqual({ in_app: true, email: true });
    expect(NOTIFICATION_PREF_DEFAULTS.mention).toEqual({ in_app: true, email: false });
    expect(NOTIFICATION_PREF_DEFAULTS.course_updated).toEqual({ in_app: true, email: false });
    expect(NOTIFICATION_PREF_DEFAULTS.team_invite).toEqual({ in_app: true, email: true });
    expect(NOTIFICATION_PREF_DEFAULTS.security_signin).toEqual({ in_app: true, email: true });
  });

  it("maps live notification kinds onto the matrix rows", () => {
    expect(notificationPrefEventForKind("title_rejected")).toBe("title_returned");
    expect(notificationPrefEventForKind("delivery_update")).toBe("delivery_status");
    expect(NOTIFICATION_PREF_TITLE_STATUS_EVENT).toBe("title_status");
    expect(Object.keys(NOTIFICATION_EMAIL)).toEqual(["title_rejected", "delivery_update"]);
  });

  it("reads a partial jsonb row as defaults plus the written cells", () => {
    const prefs = parseNotificationPrefsRow({
      prefs: {
        title_returned: { email: false },
        leftover: "ignore",
      },
    });
    expect(prefs.title_returned.email).toBe(false);
    expect(prefs.title_returned.in_app).toBe(true);
    expect(prefs.delivery_status.email).toBe(true);
    expect(parseNotificationPrefsRow(null)).toEqual(NOTIFICATION_PREF_DEFAULTS);
    expect(parseNotificationPrefsRow({ prefs: { title_returned: { email: "no" } } })).toEqual(
      NOTIFICATION_PREF_DEFAULTS,
    );
  });

  it("flips one cell and stores the object for upsert", () => {
    const next = withNotificationPref(NOTIFICATION_PREF_DEFAULTS, "mention", "email", true);
    expect(isNotificationChannelOn(next, "mention", "email")).toBe(true);
    expect(isNotificationChannelOn(NOTIFICATION_PREF_DEFAULTS, "mention", "email")).toBe(false);
    const row = notificationPrefsToRow("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", next);
    expect(row.user_id).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(row.prefs.mention.email).toBe(true);
    expect(row.prefs.title_returned.email).toBe(true);
  });

  it("rejects invented events at the write edge", () => {
    expect(
      notificationPrefWriteSchema.safeParse({
        event: "title_returned",
        channel: "in_app",
        enabled: false,
      }).success,
    ).toBe(true);
    expect(
      notificationPrefWriteSchema.safeParse({
        event: "title_queue",
        channel: "email",
        enabled: true,
      }).success,
    ).toBe(false);
  });
});
