import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import {
  NOTIFICATION_EMAIL,
  NOTIFICATION_KIND_LABEL,
  type NotificationKind,
} from "@/lib/notifications";
import {
  isoInReportsPeriod,
  parseReportsPeriod,
  REPORTS_PERIOD_PRESETS,
  type ReportsPeriod,
  type ReportsPeriodKind,
} from "@/lib/reports";

// Activity feed SoT. Durable account alerts live on `notifications` +
// `notification_reads` — Open is unread, Done is read. One state.
// Newest first. Dashboard "Recent activity" is the glance lineage;
// this is the inbox. Not Messages (Messages = 24Frame AI).

export const ACTIVITY_HREF = "/activity";
export const ACTIVITY_BELL_LIMIT = 5;
export const ACTIVITY_BELL_FETCH = 40;

export const ACTIVITY_STATES = ["open", "done", "all"] as const;
export type ActivityState = (typeof ACTIVITY_STATES)[number];

export const ACTIVITY = {
  nav: "Activity",
  title: "Activity",
  subtitle: "Account alerts.",
  open: "Open",
  done: "Done",
  all: "All",
  markDone: "Mark done",
  markAllDone: "Mark all done",
  viewAll: "View all",
  bellLabel: "Activity",
  emptyOpen: "No open activity.",
  emptyDone: "No done activity for this period.",
  emptyAll: "No account activity for this period.",
  noOrg: "Choose an organization to read activity.",
  truncated: `Showing the first ${UNPAGINATED_MAX} alerts. More exist — this list is not complete.`,
} as const;

export type ActivityNotificationRow = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  source_refs: { title_id?: string } | null;
  created_at: string;
  unread: boolean;
};

export type ActivityItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  at: string;
  kind: NotificationKind;
  kindLabel: string;
  open: boolean;
};

export type ActivityBellPreview = {
  items: ActivityItem[];
  openCount: number;
};

export const EMPTY_ACTIVITY_BELL: ActivityBellPreview = { items: [], openCount: 0 };

export function isActivityOpen(unread: boolean): boolean {
  return unread;
}

export function activityEmptyCopy(state: ActivityState): string {
  if (state === "open") return ACTIVITY.emptyOpen;
  if (state === "done") return ACTIVITY.emptyDone;
  return ACTIVITY.emptyAll;
}

export function parseActivityState(raw: string | string[] | undefined): ActivityState {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "done" || value === "all") return value;
  return "open";
}

export function activityHref(input: {
  state?: ActivityState;
  period?: string;
} = {}): string {
  const params = new URLSearchParams();
  if (input.state && input.state !== "open") params.set("state", input.state);
  if (input.period && input.period !== "all") params.set("period", input.period);
  const query = params.toString();
  return query ? `${ACTIVITY_HREF}?${query}` : ACTIVITY_HREF;
}

export function activityItemFromNotification(row: ActivityNotificationRow): ActivityItem {
  const refs = row.source_refs ?? {};
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    href: NOTIFICATION_EMAIL[row.kind].path({ titleId: refs.title_id }),
    at: row.created_at,
    kind: row.kind,
    kindLabel: NOTIFICATION_KIND_LABEL[row.kind],
    open: isActivityOpen(row.unread),
  };
}

export function activityItemsFromNotifications(
  rows: readonly ActivityNotificationRow[],
): ActivityItem[] {
  return [...rows]
    .map(activityItemFromNotification)
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

export function filterActivityItems(
  items: readonly ActivityItem[],
  input: { state: ActivityState; period: ReportsPeriod },
): ActivityItem[] {
  return items.filter((item) => {
    if (input.state === "open" && !item.open) return false;
    if (input.state === "done" && item.open) return false;
    return isoInReportsPeriod(item.at, input.period);
  });
}

export function activityBellItems(
  items: readonly ActivityItem[],
  limit = ACTIVITY_BELL_LIMIT,
): ActivityItem[] {
  return items.filter((item) => item.open).slice(0, limit);
}

export function activityOpenCount(items: readonly ActivityItem[]): number {
  return items.filter((item) => item.open).length;
}

export function activityBellPreview(
  items: readonly ActivityItem[],
  openCount = activityOpenCount(items),
  limit = ACTIVITY_BELL_LIMIT,
): ActivityBellPreview {
  return { items: activityBellItems(items, limit), openCount };
}

export function activityBellPreviewFromNotifications(
  rows: readonly ActivityNotificationRow[],
  openCount?: number,
): ActivityBellPreview {
  const items = activityItemsFromNotifications(rows);
  return activityBellPreview(items, openCount ?? activityOpenCount(items));
}

export function parseActivityPeriod(
  raw: string | string[] | undefined,
  now: Date,
): ReportsPeriod {
  return parseReportsPeriod(raw, now);
}

export function activityHistoryPeriodVisible(state: ActivityState): boolean {
  return state !== "open";
}

export const ACTIVITY_PERIOD_PRESETS = REPORTS_PERIOD_PRESETS;

export function activityPeriodPresetKey(grain: ReportsPeriodKind, now: Date): string {
  return parseReportsPeriod(grain === "all" ? "all" : grain, now).key;
}
