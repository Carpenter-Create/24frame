import type { ActivityItem } from "@/lib/activity";
import {
  isNotificationChannelOn,
  notificationPrefEventForKind,
  notificationPrefFamilyForKind,
  type NotificationPrefs,
} from "@/lib/notification-prefs";
import {
  NOTIFICATION_KIND_LABEL,
  type NotificationKind,
} from "@/lib/notifications";

// One SoT for in-app Social notification Realtime.
// Subscribe to public.notifications INSERT filtered by
// recipient_user_id = auth.uid() — Mapping C / #555 follow alerts.
// Catalog kinds stay org-scoped with a null recipient and do not
// match this filter. The follow-alert writer already skips when
// in-app pref is off. This module does not send email.

export const NOTIFICATIONS_REALTIME_TABLE = "notifications";
export const NOTIFICATIONS_REALTIME_SCHEMA = "public";
export const NOTIFICATIONS_REALTIME_EVENT = "INSERT" as const;

const USER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NotificationsRealtimeInsertPayload = {
  new: Record<string, unknown>;
};

export type NotificationsRealtimeChannel = {
  on: (
    event: "postgres_changes",
    spec: {
      event: "INSERT";
      schema: "public";
      table: "notifications";
      filter: string;
    },
    callback: (payload: NotificationsRealtimeInsertPayload) => void,
  ) => NotificationsRealtimeChannel;
  subscribe: () => NotificationsRealtimeChannel;
};

export type NotificationsRealtimeClient = {
  channel: (name: string) => NotificationsRealtimeChannel;
  removeChannel: (channel: NotificationsRealtimeChannel) => unknown;
};

export function isNotificationsRealtimeUserId(value: string): boolean {
  return USER_ID_RE.test(value);
}

export function ownNotificationsRealtimeChannel(userId: string): string | null {
  if (!isNotificationsRealtimeUserId(userId)) return null;
  return `notifications:recipient:${userId}`;
}

export function ownNotificationsRealtimeFilter(userId: string): string | null {
  if (!isNotificationsRealtimeUserId(userId)) return null;
  return `recipient_user_id=eq.${userId}`;
}

export function isSocialInAppNotificationKind(kind: string): kind is NotificationKind {
  if (!(kind in NOTIFICATION_KIND_LABEL)) return false;
  return notificationPrefFamilyForKind(kind as NotificationKind) === "social";
}

export function inAppPrefAllowsKind(
  kind: NotificationKind,
  prefs?: NotificationPrefs | null,
): boolean {
  if (!prefs) return true;
  return isNotificationChannelOn(prefs, notificationPrefEventForKind(kind), "in_app");
}

function parseSourceRefs(value: unknown): ActivityItem["source_refs"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const rec = value as Record<string, unknown>;
  const title_id = typeof rec.title_id === "string" ? rec.title_id : undefined;
  const handle = typeof rec.handle === "string" ? rec.handle : undefined;
  if (!title_id && !handle) return {};
  return { title_id, handle };
}

export function acceptLiveNotificationRow(
  row: unknown,
  userId: string,
  prefs?: NotificationPrefs | null,
): ActivityItem | null {
  if (!isNotificationsRealtimeUserId(userId)) return null;
  if (!row || typeof row !== "object") return null;
  const rec = row as Record<string, unknown>;
  if (rec.recipient_user_id !== userId) return null;
  if (typeof rec.kind !== "string" || !isSocialInAppNotificationKind(rec.kind)) {
    return null;
  }
  if (!inAppPrefAllowsKind(rec.kind, prefs)) return null;
  if (typeof rec.id !== "string" || typeof rec.title !== "string" || typeof rec.body !== "string") {
    return null;
  }
  if (typeof rec.created_at !== "string") return null;
  return {
    id: rec.id,
    title: rec.title,
    body: rec.body,
    kind: rec.kind,
    created_at: rec.created_at,
    unread: true,
    source_refs: parseSourceRefs(rec.source_refs),
  };
}

export function mergeLiveActivityItems<T extends { id: string }>(
  seed: readonly T[],
  live: readonly T[],
): T[] {
  const seedIds = new Set(seed.map((row) => row.id));
  return [...live.filter((row) => !seedIds.has(row.id)), ...seed];
}

export function liveUnreadCount(
  seedCount: number,
  seedItems: readonly { id: string }[],
  liveItems: readonly { id: string; unread?: boolean }[],
): number {
  const known = new Set(seedItems.map((row) => row.id));
  let extra = 0;
  for (const row of liveItems) {
    if (row.unread === false) continue;
    if (!known.has(row.id)) extra += 1;
  }
  return seedCount + extra;
}

type LiveSession = {
  userId: string;
  client: NotificationsRealtimeClient;
  channel: NotificationsRealtimeChannel;
  items: ActivityItem[];
  listeners: Set<(items: readonly ActivityItem[]) => void>;
};

let session: LiveSession | null = null;

function emit(current: LiveSession) {
  const snapshot = current.items;
  for (const listener of current.listeners) listener(snapshot);
}

function teardown(current: LiveSession) {
  current.listeners.clear();
  current.client.removeChannel(current.channel);
}

function startSession(
  client: NotificationsRealtimeClient,
  userId: string,
  filter: string,
  channelName: string,
): LiveSession {
  const current: LiveSession = {
    userId,
    client,
    channel: client.channel(channelName),
    items: [],
    listeners: new Set(),
  };
  current.channel
    .on(
      "postgres_changes",
      {
        event: NOTIFICATIONS_REALTIME_EVENT,
        schema: NOTIFICATIONS_REALTIME_SCHEMA,
        table: NOTIFICATIONS_REALTIME_TABLE,
        filter,
      },
      (payload) => {
        const item = acceptLiveNotificationRow(payload.new, userId);
        if (!item || !session || session.userId !== userId) return;
        if (session.items.some((row) => row.id === item.id)) return;
        session.items = [item, ...session.items];
        emit(session);
      },
    )
    .subscribe();
  return current;
}

/** Ref-counted: peek + list share one recipient channel. */
export function retainOwnNotificationsRealtime(
  client: NotificationsRealtimeClient,
  userId: string,
  listener: (items: readonly ActivityItem[]) => void,
): () => void {
  const filter = ownNotificationsRealtimeFilter(userId);
  const channelName = ownNotificationsRealtimeChannel(userId);
  if (!filter || !channelName) return () => undefined;

  if (!session || session.userId !== userId) {
    if (session) teardown(session);
    session = startSession(client, userId, filter, channelName);
  }

  session.listeners.add(listener);
  listener(session.items);

  return () => {
    if (!session) return;
    session.listeners.delete(listener);
    if (session.listeners.size === 0) {
      teardown(session);
      session = null;
    }
  };
}

export function retireLiveNotification(id: string) {
  if (!session || !id) return;
  const next = session.items.filter((row) => row.id !== id);
  if (next.length === session.items.length) return;
  session.items = next;
  emit(session);
}

export function resetOwnNotificationsRealtimeForTests() {
  if (session) teardown(session);
  session = null;
}
