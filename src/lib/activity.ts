import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import { NOTIFICATION_EMAIL, type NotificationKind } from "@/lib/notifications";
import {
  NOTIFICATION_PREFS,
  notificationPrefFamilyForKind,
  type NotificationPrefFamilyId,
} from "@/lib/notification-prefs";
import { PRODUCT_NAME } from "@/lib/product";
import {
  REPORTS_PERIOD_ALL,
  isoInReportsPeriod,
  parseReportsPeriod,
  type ReportsPeriod,
} from "@/lib/reports";
import { SETTINGS } from "@/lib/settings";
import { socialRelativeTime } from "@/lib/social";
import { aggregationPath } from "@/lib/workspace";

// Activity is the durable account-alert log. One feed: notifications.
// Open = unread. Done = read. Complete = Done = read — one state.
// Not Messages. Not Ask 24Frame AI. Not /attention catalog findings.
// Bell navigates here (phone + desktop). Category chips are the prefs
// families. Row body links to the item. X marks done. No View / Done
// / Mark all. Copy lives here, not JSX.

export const ACTIVITY_HREF = aggregationPath("activity");
export const ACTIVITY_PREFS_HREF = SETTINGS.notificationsHref;
export const ACTIVITY_BELL_OPEN_CAP = 5;

export const ACTIVITY_FAMILY_ALL = "all" as const;

export const ACTIVITY_FAMILIES = [
  ACTIVITY_FAMILY_ALL,
  ...(Object.keys(NOTIFICATION_PREFS.groups) as NotificationPrefFamilyId[]),
] as const;

export type ActivityFamily = (typeof ACTIVITY_FAMILIES)[number];

export const ACTIVITY_PAGE = {
  title: "Activity",
  subtitle: `Account alerts from ${PRODUCT_NAME}.`,
  open: "Open",
  done: "Done",
  all: "All",
  prefs: "Notification preferences",
  dismiss: "Mark done",
  viewAll: "View all activity",
  emptyOpen: "Nothing open.",
  emptyDone: "Nothing done yet.",
  truncated: `Showing the first ${UNPAGINATED_MAX} alerts. More exist — this list is not complete.`,
  bellLabel: "Activity",
  bellEmpty: "Nothing open.",
  close: "Close activity",
  navAria: "Activity",
} as const;

// Family chips share house segmented SoT. Phone may scroll the row
// so labels stay whole. Never ellipsis.
export const ACTIVITY_FAMILY_SCROLL_CLASS = "no-scrollbar overflow-x-auto";

// House circular icon hit + soft ghost wash on hover / open.
// Phone hug lives on HOUSE_HEADER_TRAILING_HIT_CLASS (via theme
// toggle) so the bell is a flex sibling of Ask and the avatar.
// That hug is the size-4 box — not padding cancelled with -mx.
// Sporty Blue stays off the trigger — accent is the open-row dot.
export const ACTIVITY_BELL_TRIGGER_CLASS =
  `${HOUSE_THEME_TOGGLE_CLASS} relative hover:bg-surface-muted`;
export const ACTIVITY_BELL_TRIGGER_OPEN_CLASS = "bg-surface-muted";
export const ACTIVITY_BELL_OPEN_DOT_CLASS = "size-2 shrink-0 rounded-full bg-accent";

// House nouns — Titles FilmSlate, Deliveries PaperPlaneTilt.
export const ACTIVITY_KIND_ICON = {
  title_rejected: "film-slate",
  delivery_update: "paper-plane-tilt",
} as const satisfies Record<NotificationKind, "film-slate" | "paper-plane-tilt">;

export type ActivityStatus = "open" | "done";

export type ActivityItem = {
  id: string;
  title: string;
  body: string;
  kind: "title_rejected" | "delivery_update";
  created_at: string;
  unread: boolean;
  source_refs?: { title_id?: string } | null;
};

export function isActivityOpen(item: Pick<ActivityItem, "unread">): boolean {
  return item.unread;
}

export function parseActivityStatus(raw: string | string[] | undefined): ActivityStatus {
  const value = typeof raw === "string" ? raw : undefined;
  return value === "done" ? "done" : "open";
}

export function parseActivityFamily(raw: string | string[] | undefined): ActivityFamily {
  const value = typeof raw === "string" ? raw : undefined;
  if (value && value !== ACTIVITY_FAMILY_ALL && value in NOTIFICATION_PREFS.groups) {
    return value as ActivityFamily;
  }
  return ACTIVITY_FAMILY_ALL;
}

export function activityFamilyForKind(kind: NotificationKind): NotificationPrefFamilyId {
  return notificationPrefFamilyForKind(kind);
}

export function activityFamilyLabel(family: ActivityFamily): string {
  if (family === ACTIVITY_FAMILY_ALL) return ACTIVITY_PAGE.all;
  return NOTIFICATION_PREFS.groups[family];
}

export function activityHref(input: {
  status?: ActivityStatus;
  period?: string | null;
  family?: ActivityFamily;
}): string {
  const params = new URLSearchParams();
  if (input.status === "done") params.set("status", "done");
  if (input.period && input.period !== REPORTS_PERIOD_ALL) {
    params.set("period", input.period);
  }
  if (input.family && input.family !== ACTIVITY_FAMILY_ALL) {
    params.set("family", input.family);
  }
  const query = params.toString();
  return query ? `${ACTIVITY_HREF}?${query}` : ACTIVITY_HREF;
}

export function filterActivityItems<
  T extends Pick<ActivityItem, "unread" | "created_at" | "kind">,
>(
  items: readonly T[],
  status: ActivityStatus,
  period: ReportsPeriod,
  family: ActivityFamily = ACTIVITY_FAMILY_ALL,
): T[] {
  const open = status === "open";
  return items.filter((item) => {
    if (isActivityOpen(item) !== open) return false;
    if (!isoInReportsPeriod(item.created_at, period)) return false;
    if (family !== ACTIVITY_FAMILY_ALL && activityFamilyForKind(item.kind) !== family) {
      return false;
    }
    return true;
  });
}

export function activityBellItems<T extends Pick<ActivityItem, "unread">>(
  items: readonly T[],
  cap = ACTIVITY_BELL_OPEN_CAP,
): T[] {
  return items.filter(isActivityOpen).slice(0, cap);
}

export function activityKindIcon(kind: NotificationKind): "film-slate" | "paper-plane-tilt" {
  return ACTIVITY_KIND_ICON[kind];
}

export function activityItemHref(item: Pick<ActivityItem, "kind" | "source_refs">): string {
  return NOTIFICATION_EMAIL[item.kind].path({ titleId: item.source_refs?.title_id });
}

export function activityRelativeTime(iso: string, now = Date.now()): string {
  return socialRelativeTime(iso, now);
}

export function activityEmptyCopy(status: ActivityStatus): string {
  return status === "done" ? ACTIVITY_PAGE.emptyDone : ACTIVITY_PAGE.emptyOpen;
}

export function parseActivityPeriod(
  raw: string | string[] | undefined,
  now: Date,
): ReportsPeriod {
  return parseReportsPeriod(raw, now);
}
