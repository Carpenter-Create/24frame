import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import { NOTIFICATION_EMAIL, type NotificationKind } from "@/lib/notifications";
import { PRODUCT_NAME } from "@/lib/product";
import {
  REPORTS_PERIOD_ALL,
  isoInReportsPeriod,
  parseReportsPeriod,
  type ReportsPeriod,
} from "@/lib/reports";
import { socialRelativeTime } from "@/lib/social";

// Activity is the durable account-alert log. One feed: notifications.
// Open = unread. Done = read. Complete = Done = read — one state.
// Not Messages. Not Ask 24Frame AI. Not /attention catalog findings.
// Bell popover is Open only — no All / Unread / Resolved tabs.
// Copy lives here, not JSX.

export const ACTIVITY_HREF = "/activity";
export const ACTIVITY_BELL_OPEN_CAP = 5;

export const ACTIVITY_PAGE = {
  title: "Activity",
  subtitle: `Account alerts from ${PRODUCT_NAME}.`,
  open: "Open",
  done: "Done",
  view: "View",
  viewAll: "View all activity",
  markAllDone: "Mark all done",
  emptyOpen: "Nothing open.",
  emptyDone: "Nothing done yet.",
  truncated: `Showing the first ${UNPAGINATED_MAX} alerts. More exist — this list is not complete.`,
  bellLabel: "Activity",
  bellEmpty: "Nothing open.",
  navAria: "Activity",
} as const;

// House circular icon hit + soft ghost wash on hover / open.
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

export function activityHref(input: {
  status?: ActivityStatus;
  period?: string | null;
}): string {
  const params = new URLSearchParams();
  if (input.status === "done") params.set("status", "done");
  if (input.period && input.period !== REPORTS_PERIOD_ALL) {
    params.set("period", input.period);
  }
  const query = params.toString();
  return query ? `${ACTIVITY_HREF}?${query}` : ACTIVITY_HREF;
}

export function filterActivityItems<T extends Pick<ActivityItem, "unread" | "created_at">>(
  items: readonly T[],
  status: ActivityStatus,
  period: ReportsPeriod,
): T[] {
  const open = status === "open";
  return items.filter((item) => {
    if (isActivityOpen(item) !== open) return false;
    return isoInReportsPeriod(item.created_at, period);
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

export function activityBellOpenIds(items: readonly Pick<ActivityItem, "id">[]): string[] {
  return items.map((item) => item.id);
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
