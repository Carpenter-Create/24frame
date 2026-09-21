"use client";

import Link from "next/link";

import { SegmentedTrack } from "@/components/ui/segmented-track";
import { cn } from "@/lib/cn";
import {
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
  HOUSE_SEGMENTED_ITEM_OFF_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_TRACK_SCROLL_CLASS,
} from "@/lib/house-shell";
import {
  SOCIAL_ACTIVITY_PILLS,
  socialActivityPillLabel,
  socialProfileActivityHref,
  type SocialActivityPill,
} from "@/lib/social-activity";
import { SOCIAL_ACTIVITY_PILLS_CLASS } from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";
import { SEGMENTED_TRACK_PERSIST, segmentedItemOn } from "@/lib/segmented-track";

export function SocialActivityPills({
  baseHref,
  active,
}: {
  baseHref: string;
  active: SocialActivityPill;
}) {
  const activeIndex = SOCIAL_ACTIVITY_PILLS.indexOf(active);
  return (
    <div
      role="group"
      aria-label={SOCIAL.profile.activityTab}
      data-social-activity-pills=""
      className={SOCIAL_ACTIVITY_PILLS_CLASS}
    >
      <SegmentedTrack
        activeIndex={activeIndex < 0 ? 0 : activeIndex}
        persistKey={SEGMENTED_TRACK_PERSIST.socialActivity}
        trackClass={HOUSE_SEGMENTED_TRACK_SCROLL_CLASS}
        thumbClass={HOUSE_SEGMENTED_THUMB_CLASS}
      >
        {({ selectedIndex }) =>
          SOCIAL_ACTIVITY_PILLS.map((pill, index) => {
            const on = segmentedItemOn(index, selectedIndex);
            return (
              <Link
                key={pill}
                href={socialProfileActivityHref(baseHref, pill)}
                scroll={false}
                data-segmented-item=""
                data-social-activity-pill={pill}
                aria-pressed={on}
                className={cn(
                  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
                  on ? HOUSE_SEGMENTED_ITEM_ON_CLASS : HOUSE_SEGMENTED_ITEM_OFF_CLASS,
                )}
              >
                {socialActivityPillLabel(pill)}
              </Link>
            );
          })
        }
      </SegmentedTrack>
    </div>
  );
}
