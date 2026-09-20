import { DASHBOARD_HREF } from "@/lib/dashboard-admin";
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
  SETTINGS,
  SETTINGS_EDIT_HELPER_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  SETTINGS_SECTION_CLASS,
} from "@/lib/settings";
import { socialRelativeTime } from "@/lib/social";

// Activity is the live uncleared-alert feed. One feed: notifications.
// Default: uncleared only, newest first. X clears a row. Cleared
// items leave this feed. No Open / Done / Cleared control. Category
// chips are the only filter (prefs families). Not Messages. Not Ask
// 24Frame AI. Not /attention catalog findings. Bell navigates here.
// Copy lives here, not JSX.
//
// Adam lock 2026-09-19: chrome-level /activity. Account alerts
// span Aggregation · Reporting · Social · Education · Account.
// Not an Aggregation destination. Bell is the door. Same family as
// Settings and Get Help (#539): account chrome, no workspace thumb,
// no product rail, Settings-measure canvas, page-lead SoT. Do not
// import SettingsPageLead or put this in Settings hub chrome.

export const ACTIVITY_HREF = "/activity";
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
  back: "Back",
  homeHref: DASHBOARD_HREF,
  all: "All",
  prefs: "Notification preferences",
  dismiss: "Mark done",
  empty: "You're all caught up.",
  emptyHint: "New alerts will show here.",
  viewAll: "View all activity",
  truncated: `Showing the first ${UNPAGINATED_MAX} alerts. More exist — this list is not complete.`,
  bellLabel: "Activity",
  bellEmpty: "Nothing open.",
  close: "Close activity",
  navAria: "Activity",
} as const;

export const ACTIVITY_PAGE_CLASS = SETTINGS_PANE_CLASS;
export const ACTIVITY_SECTION_CLASS = SETTINGS_SECTION_CLASS;
export const ACTIVITY_TITLE_CLASS = SETTINGS_PANE_TITLE_CLASS;
export const ACTIVITY_HELPER_CLASS = SETTINGS_EDIT_HELPER_CLASS;
// Phone stacks gear under the lead. Desktop keeps the prefs hit
// trailing. Never truncate the title to hug the icon.
export const ACTIVITY_LEAD_ROW_CLASS =
  "flex flex-col gap-[var(--space-4)] md:flex-row md:items-start md:justify-between";

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

export function isActivityPath(pathname: string): boolean {
  return pathname === ACTIVITY_HREF || pathname.startsWith(`${ACTIVITY_HREF}/`);
}

export function activityHeaderBack(pathname: string | null | undefined): {
  href: string;
  label: string;
} {
  if (!pathname || pathname === ACTIVITY_HREF) {
    return { href: ACTIVITY_PAGE.homeHref, label: ACTIVITY_PAGE.back };
  }
  return { href: ACTIVITY_HREF, label: ACTIVITY_PAGE.title };
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

export function activityHref(input: { family?: ActivityFamily } = {}): string {
  const params = new URLSearchParams();
  if (input.family && input.family !== ACTIVITY_FAMILY_ALL) {
    params.set("family", input.family);
  }
  const query = params.toString();
  return query ? `${ACTIVITY_HREF}?${query}` : ACTIVITY_HREF;
}

export function filterActivityItems<T extends Pick<ActivityItem, "unread" | "kind">>(
  items: readonly T[],
  family: ActivityFamily = ACTIVITY_FAMILY_ALL,
): T[] {
  return items.filter((item) => {
    if (!isActivityOpen(item)) return false;
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

export function activityEmptyCopy(): string {
  return ACTIVITY_PAGE.empty;
}
