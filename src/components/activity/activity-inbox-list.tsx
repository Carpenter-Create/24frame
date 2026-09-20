"use client";

import { EmptyState } from "@/components/layout/empty-state";
import {
  ACTIVITY_PAGE,
  activityEmptyCopy,
  filterActivityItems,
  type ActivityFamily,
  type ActivityItem,
} from "@/lib/activity";
import { mergeLiveActivityItems } from "@/lib/notifications-realtime";

import { ActivityFeedRow } from "./activity-feed-row";
import { useOwnNotificationsRealtime } from "./use-own-notifications-realtime";

// Full Notifications list. Same Realtime SoT as the header peek.

export function ActivityInboxList({
  items,
  family,
}: {
  items: ActivityItem[];
  family: ActivityFamily;
}) {
  const live = useOwnNotificationsRealtime();
  const merged = filterActivityItems(mergeLiveActivityItems(items, live), family);

  if (merged.length === 0) {
    return (
      <div data-activity-empty="">
        <EmptyState title={activityEmptyCopy()} description={ACTIVITY_PAGE.emptyHint} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {merged.map((item) => (
        <ActivityFeedRow key={item.id} item={item} />
      ))}
    </div>
  );
}
