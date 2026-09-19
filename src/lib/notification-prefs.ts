// Per-user notification preference SoT. Copy and defaults live here,
// not in JSX. Emitters check isNotificationChannelOn later.
//
// Defaults (missing row = these values):
//   in-app on for every event
//   email on for title/queue, delivery/review, and team invites
//     (matches the live GC-Support email fan-out for title_rejected
//     and delivery_update; invites are email-first)
//   email off for activity/mentions and course updates (no emitters yet)
//
// Persistence: public.user_notification_preferences (one row / user).
// Theme stays gc-theme localStorage — do not store appearance here.

import { z } from "zod";

import type { NotificationKind } from "@/lib/notifications";

export const NOTIFICATION_PREF_EVENTS = [
  "title_queue",
  "delivery_review",
  "activity_mentions",
  "education",
  "team_invites",
] as const;

export type NotificationPrefEvent = (typeof NOTIFICATION_PREF_EVENTS)[number];

export const NOTIFICATION_PREF_CHANNELS = ["in_app", "email"] as const;

export type NotificationPrefChannel = (typeof NOTIFICATION_PREF_CHANNELS)[number];

export type NotificationChannelPrefs = {
  in_app: boolean;
  email: boolean;
};

export type NotificationPrefs = Record<NotificationPrefEvent, NotificationChannelPrefs>;

export const NOTIFICATION_PREFS = {
  title: "Notifications",
  inApp: "In-app",
  email: "Email",
  helper: "In-app and email can both be on.",
  signedOut: "Sign in to change notification preferences.",
  invalid: "That preference could not be saved.",
  saveFailed: "Notification preferences could not be saved.",
  events: {
    title_queue: "Title and queue status",
    delivery_review: "Delivery and review",
    activity_mentions: "Activity and mentions",
    education: "Course updates",
    team_invites: "Team and org invites",
  },
} as const;

export const NOTIFICATION_PREF_DEFAULTS: NotificationPrefs = {
  title_queue: { in_app: true, email: true },
  delivery_review: { in_app: true, email: true },
  activity_mentions: { in_app: true, email: false },
  education: { in_app: true, email: false },
  team_invites: { in_app: true, email: true },
};

export const NOTIFICATION_PREF_MATRIX_CLASS = "flex flex-col gap-[var(--space-2)]";
export const NOTIFICATION_PREF_HEAD_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-[var(--space-4)] t-body-sm text-ink-3";
export const NOTIFICATION_PREF_ROW_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-[var(--space-4)] t-body text-ink";
export const NOTIFICATION_PREF_CHANNEL_CLASS = "flex w-14 justify-center";
export const NOTIFICATION_PREF_SWITCH_TRACK_CLASS =
  "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors";
export const NOTIFICATION_PREF_SWITCH_ON_CLASS = "bg-accent";
export const NOTIFICATION_PREF_SWITCH_OFF_CLASS = "bg-surface-muted";
export const NOTIFICATION_PREF_SWITCH_THUMB_CLASS =
  "inline-block size-5 rounded-full bg-surface transition-transform";
export const NOTIFICATION_PREF_SWITCH_THUMB_ON_CLASS = "translate-x-[18px]";
export const NOTIFICATION_PREF_SWITCH_THUMB_OFF_CLASS = "translate-x-0.5";

export function notificationPrefColumn(
  event: NotificationPrefEvent,
  channel: NotificationPrefChannel,
): `${NotificationPrefEvent}_${NotificationPrefChannel}` {
  return `${event}_${channel}`;
}

export function isNotificationChannelOn(
  prefs: NotificationPrefs,
  event: NotificationPrefEvent,
  channel: NotificationPrefChannel,
): boolean {
  return prefs[event][channel] === true;
}

export function withNotificationPref(
  prefs: NotificationPrefs,
  event: NotificationPrefEvent,
  channel: NotificationPrefChannel,
  enabled: boolean,
): NotificationPrefs {
  return {
    ...prefs,
    [event]: {
      ...prefs[event],
      [channel]: enabled,
    },
  };
}

export function notificationPrefEventForKind(kind: NotificationKind): NotificationPrefEvent {
  if (kind === "delivery_update") return "delivery_review";
  return "title_queue";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** Missing or partial rows wash to defaults. Unknown keys are ignored. */
export function parseNotificationPrefsRow(row: unknown): NotificationPrefs {
  const source = isRecord(row) ? row : {};
  const prefs = { ...NOTIFICATION_PREF_DEFAULTS };
  for (const event of NOTIFICATION_PREF_EVENTS) {
    prefs[event] = {
      in_app: readBoolean(source[notificationPrefColumn(event, "in_app")], prefs[event].in_app),
      email: readBoolean(source[notificationPrefColumn(event, "email")], prefs[event].email),
    };
  }
  return prefs;
}

export function notificationPrefsToRow(
  userId: string,
  prefs: NotificationPrefs,
): {
  user_id: string;
  title_queue_in_app: boolean;
  title_queue_email: boolean;
  delivery_review_in_app: boolean;
  delivery_review_email: boolean;
  activity_mentions_in_app: boolean;
  activity_mentions_email: boolean;
  education_in_app: boolean;
  education_email: boolean;
  team_invites_in_app: boolean;
  team_invites_email: boolean;
} {
  return {
    user_id: userId,
    title_queue_in_app: prefs.title_queue.in_app,
    title_queue_email: prefs.title_queue.email,
    delivery_review_in_app: prefs.delivery_review.in_app,
    delivery_review_email: prefs.delivery_review.email,
    activity_mentions_in_app: prefs.activity_mentions.in_app,
    activity_mentions_email: prefs.activity_mentions.email,
    education_in_app: prefs.education.in_app,
    education_email: prefs.education.email,
    team_invites_in_app: prefs.team_invites.in_app,
    team_invites_email: prefs.team_invites.email,
  };
}

export const notificationPrefWriteSchema = z.object({
  event: z.enum(NOTIFICATION_PREF_EVENTS),
  channel: z.enum(NOTIFICATION_PREF_CHANNELS),
  enabled: z.boolean(),
});

export type NotificationPrefWrite = z.infer<typeof notificationPrefWriteSchema>;
