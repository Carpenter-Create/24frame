// Per-user notification preference SoT. Copy, keys, and defaults
// live here, not in JSX. Emitters check isNotificationChannelOn later.
//
// Founder lock 2026-09-19: 26 concrete event rows, not coarse buckets.
// Groups: Aggregation (Reporting under Aggregation) · Social ·
// Education · Account.
//
// Defaults (missing row = these values):
//   in-app on for every event
//   email on for live ops, money, reporting, DMs, invites, role,
//     security, and billing
//   email off for social engagement, title notes, license, and
//     education (no emitters yet)
//
// Persistence: public.user_notification_preferences.prefs jsonb.
// Theme stays gc-theme localStorage — do not store appearance here.

import { z } from "zod";

import { HOUSE_CARD_PAD, HOUSE_MODULE_CLASS, HOUSE_SECTION_AIR_CLASS } from "@/lib/house-shell";
import type { NotificationKind } from "@/lib/notifications";
import { SETTINGS_PREF_TITLE_CLASS } from "@/lib/settings";

export const NOTIFICATION_PREF_EVENTS = [
  "title_returned",
  "title_status",
  "delivery_status",
  "title_assigned",
  "title_comment",
  "license_status",
  "payout_statement",
  "reporting_ready",
  "reporting_anomaly",
  "reporting_deadline",
  "dm_received",
  "mention",
  "post_liked",
  "post_commented",
  "new_follower",
  "post_shared",
  "story_reply",
  "course_available",
  "course_updated",
  "lesson_due",
  "course_completed",
  "course_announcement",
  "team_invite",
  "role_changed",
  "security_signin",
  "billing_change",
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
  groups: {
    aggregation: "Aggregation",
    reporting: "Reporting",
    social: "Social",
    education: "Education",
    account: "Account",
  },
  events: {
    title_returned: "Title returned for revision",
    title_status: "Title status change",
    delivery_status: "Delivery status change",
    title_assigned: "Title assigned to you / needs your action",
    title_comment: "Comment or note on a title you’re on",
    license_status: "License / deal status change on your title",
    payout_statement: "Payout / statement ready",
    reporting_ready: "Report ready / new reporting data available",
    reporting_anomaly: "Reporting anomaly or threshold breach",
    reporting_deadline: "Reporting deadline / submission reminder",
    dm_received: "Direct message received",
    mention: "Someone mentioned you",
    post_liked: "Someone liked your post",
    post_commented: "Someone commented on your post",
    new_follower: "New follower",
    post_shared: "Someone shared your post",
    story_reply: "Story reply",
    course_available: "New course available",
    course_updated: "Course you’re in was updated",
    lesson_due: "Assignment / lesson due reminder",
    course_completed: "Course completed / certificate ready",
    course_announcement: "Instructor announcement on an enrolled course",
    team_invite: "Team invite received",
    role_changed: "Your role changed",
    security_signin: "Security: new sign-in / password change",
    billing_change: "Billing / plan change on your org",
  },
} as const;

const EMAIL_ON = { in_app: true, email: true } as const;
const EMAIL_OFF = { in_app: true, email: false } as const;

export const NOTIFICATION_PREF_DEFAULTS: NotificationPrefs = {
  title_returned: EMAIL_ON,
  title_status: EMAIL_ON,
  delivery_status: EMAIL_ON,
  title_assigned: EMAIL_ON,
  title_comment: EMAIL_OFF,
  license_status: EMAIL_OFF,
  payout_statement: EMAIL_ON,
  reporting_ready: EMAIL_ON,
  reporting_anomaly: EMAIL_ON,
  reporting_deadline: EMAIL_ON,
  dm_received: EMAIL_ON,
  mention: EMAIL_OFF,
  post_liked: EMAIL_OFF,
  post_commented: EMAIL_OFF,
  new_follower: EMAIL_OFF,
  post_shared: EMAIL_OFF,
  story_reply: EMAIL_OFF,
  course_available: EMAIL_OFF,
  course_updated: EMAIL_OFF,
  lesson_due: EMAIL_OFF,
  course_completed: EMAIL_OFF,
  course_announcement: EMAIL_OFF,
  team_invite: EMAIL_ON,
  role_changed: EMAIL_ON,
  security_signin: EMAIL_ON,
  billing_change: EMAIL_ON,
};

export type NotificationPrefGroupId = "aggregation" | "social" | "education" | "account";

export type NotificationPrefSection = {
  id: string;
  label: string;
  events: readonly NotificationPrefEvent[];
};

export const NOTIFICATION_PREF_GROUPS: readonly {
  id: NotificationPrefGroupId;
  label: string;
  sections: readonly NotificationPrefSection[];
}[] = [
  {
    id: "aggregation",
    label: NOTIFICATION_PREFS.groups.aggregation,
    sections: [
      {
        id: "aggregation",
        label: NOTIFICATION_PREFS.groups.aggregation,
        events: [
          "title_returned",
          "title_status",
          "delivery_status",
          "title_assigned",
          "title_comment",
          "license_status",
          "payout_statement",
        ],
      },
      {
        id: "reporting",
        label: NOTIFICATION_PREFS.groups.reporting,
        events: ["reporting_ready", "reporting_anomaly", "reporting_deadline"],
      },
    ],
  },
  {
    id: "social",
    label: NOTIFICATION_PREFS.groups.social,
    sections: [
      {
        id: "social",
        label: NOTIFICATION_PREFS.groups.social,
        events: [
          "dm_received",
          "mention",
          "post_liked",
          "post_commented",
          "new_follower",
          "post_shared",
          "story_reply",
        ],
      },
    ],
  },
  {
    id: "education",
    label: NOTIFICATION_PREFS.groups.education,
    sections: [
      {
        id: "education",
        label: NOTIFICATION_PREFS.groups.education,
        events: [
          "course_available",
          "course_updated",
          "lesson_due",
          "course_completed",
          "course_announcement",
        ],
      },
    ],
  },
  {
    id: "account",
    label: NOTIFICATION_PREFS.groups.account,
    sections: [
      {
        id: "account",
        label: NOTIFICATION_PREFS.groups.account,
        events: ["team_invite", "role_changed", "security_signin", "billing_change"],
      },
    ],
  },
];

// One soft plate around Notifications. Groups inside are titles +
// hairline + air — not a muted card per group (Adam lock).
export const NOTIFICATION_PREF_WRAP_CLASS =
  `${HOUSE_MODULE_CLASS} ${HOUSE_CARD_PAD} flex flex-col ${HOUSE_SECTION_AIR_CLASS}`;
export const NOTIFICATION_PREF_INTRO_CLASS = "flex flex-col gap-[var(--space-2)]";
export const NOTIFICATION_PREF_MATRIX_CLASS = "flex flex-col divide-y divide-hairline";
export const NOTIFICATION_PREF_SECTION_CLASS =
  "flex flex-col gap-[var(--space-3)] py-[var(--space-8)] first:pt-0 last:pb-0";
export const NOTIFICATION_PREF_TITLE_CLASS = SETTINGS_PREF_TITLE_CLASS;
export const NOTIFICATION_PREF_HEAD_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-[var(--space-4)]";
export const NOTIFICATION_PREF_CHANNEL_HEAD_CLASS = "t-body-sm text-ink-3";
export const NOTIFICATION_PREF_LIST_CLASS = "flex flex-col";
export const NOTIFICATION_PREF_ROW_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-[var(--space-4)] py-[var(--space-3)] t-body text-ink";
export const NOTIFICATION_PREF_CHANNEL_CLASS = "flex w-12 justify-center";
// Compact house switch. Track 20×36, thumb 16. Off inset 2 → on
// translate 36 − 16 − 2 = 18. Accent on. Off wash reads on the
// one muted plate. No second Switch.
export const NOTIFICATION_PREF_SWITCH_TRACK_CLASS =
  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors";
export const NOTIFICATION_PREF_SWITCH_ON_CLASS = "bg-accent";
export const NOTIFICATION_PREF_SWITCH_OFF_CLASS = "bg-ink-3/40";
export const NOTIFICATION_PREF_SWITCH_THUMB_CLASS =
  "inline-block size-4 rounded-full bg-surface transition-transform";
export const NOTIFICATION_PREF_SWITCH_THUMB_ON_CLASS = "translate-x-[18px]";
export const NOTIFICATION_PREF_SWITCH_THUMB_OFF_CLASS = "translate-x-0.5";

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
  if (kind === "delivery_update") return "delivery_status";
  return "title_returned";
}

export const NOTIFICATION_PREF_TITLE_STATUS_EVENT = "title_status" satisfies NotificationPrefEvent;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readChannelPrefs(value: unknown, fallback: NotificationChannelPrefs): NotificationChannelPrefs {
  if (!isRecord(value)) return fallback;
  return {
    in_app: readBoolean(value.in_app, fallback.in_app),
    email: readBoolean(value.email, fallback.email),
  };
}

/** Missing or partial rows wash to defaults. Unknown keys are ignored. */
export function parseNotificationPrefsRow(row: unknown): NotificationPrefs {
  const source = isRecord(row) ? row : {};
  const nested = isRecord(source.prefs) ? source.prefs : source;
  const prefs = { ...NOTIFICATION_PREF_DEFAULTS };
  for (const event of NOTIFICATION_PREF_EVENTS) {
    prefs[event] = readChannelPrefs(nested[event], prefs[event]);
  }
  return prefs;
}

export function notificationPrefsToRow(
  userId: string,
  prefs: NotificationPrefs,
): { user_id: string; prefs: NotificationPrefs } {
  return { user_id: userId, prefs };
}

export const notificationPrefWriteSchema = z.object({
  event: z.enum(NOTIFICATION_PREF_EVENTS),
  channel: z.enum(NOTIFICATION_PREF_CHANNELS),
  enabled: z.boolean(),
});

export type NotificationPrefWrite = z.infer<typeof notificationPrefWriteSchema>;
