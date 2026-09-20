"use client";

import Link from "next/link";

import { SegmentedTrack } from "@/components/ui/segmented-track";
import { cn } from "@/lib/cn";
import {
  ACTIVITY_FAMILIES,
  ACTIVITY_FAMILY_SCROLL_CLASS,
  activityFamilyLabel,
  activityHref,
  type ActivityFamily,
} from "@/lib/activity";
import {
  DASHBOARD_TOP_PILL_BUTTON_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_ON_CLASS,
  DASHBOARD_TOP_PILL_CLUSTER_CLASS,
  DASHBOARD_TOP_PILL_THUMB_CLASS,
} from "@/lib/dashboard-craft";
import { SEGMENTED_TRACK_PERSIST, segmentedItemOn } from "@/lib/segmented-track";

export function ActivityFamilyChips({ family }: { family: ActivityFamily }) {
  return (
    <div data-activity-family-scroll="" className={ACTIVITY_FAMILY_SCROLL_CLASS}>
      <SegmentedTrack
        activeIndex={ACTIVITY_FAMILIES.indexOf(family)}
        persistKey={SEGMENTED_TRACK_PERSIST.activityFamily}
        trackClass={DASHBOARD_TOP_PILL_CLUSTER_CLASS}
        thumbClass={DASHBOARD_TOP_PILL_THUMB_CLASS}
        data-activity-family=""
      >
        {({ selectedIndex }) =>
          ACTIVITY_FAMILIES.map((key, index) => {
            const on = segmentedItemOn(index, selectedIndex);
            return (
              <Link
                key={key}
                href={activityHref({ family: key })}
                aria-pressed={on}
                data-segmented-item=""
                data-activity-family-chip={key}
                className={cn(
                  DASHBOARD_TOP_PILL_BUTTON_CLASS,
                  on
                    ? DASHBOARD_TOP_PILL_BUTTON_ON_CLASS
                    : DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
                )}
              >
                {activityFamilyLabel(key)}
              </Link>
            );
          })
        }
      </SegmentedTrack>
    </div>
  );
}
