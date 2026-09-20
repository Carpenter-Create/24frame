"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialIcon } from "@/components/social/social-icon";
import { SegmentedTrack } from "@/components/ui/segmented-track";
import {
  HOUSE_PHONE_DESTS_CLASS,
  housePhoneDestActive,
  housePhoneDestActiveIndex,
  housePhoneDestChipsLabel,
  housePhoneDestinations,
  housePhoneDestItemClass,
  housePhoneDestPersistKey,
} from "@/lib/house-phone-shell";
import {
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";
import { segmentedItemOn } from "@/lib/segmented-track";
import { SOCIAL_ICON_SIZE_SEARCH, socialNavIconName } from "@/lib/social-icons";
import type { WorkspaceMode } from "@/lib/workspace";
import { NavGlyph } from "./nav-glyph";

// One under-top dest SegmentedTrack for Aggregation · Education · Social.
// Same house track / thumb / ink as desktop workspace pills. Real dest
// lists from mobileNavDestinations. Ask 24Frame AI stays off the
// chips (header / overlay; no Agg hop). Home has no row. Scroll-x
// when the track overflows; thumb measures against the full track.
// Not a second bottom float and not a Meta skin. Desktop rail is
// unchanged.

export function HousePhoneDestChips({
  workspace,
  isGcStaff = false,
}: {
  workspace: WorkspaceMode;
  isGcStaff?: boolean;
}) {
  const pathname = usePathname();
  const items = housePhoneDestinations(isGcStaff, workspace);
  const routeIndex = housePhoneDestActiveIndex(pathname, items, workspace);

  return (
    <nav
      data-house-phone-dest-chips=""
      data-house-phone-dest-workspace={workspace}
      aria-label={housePhoneDestChipsLabel(workspace)}
      className={HOUSE_PHONE_DESTS_CLASS}
    >
      <SegmentedTrack
        activeIndex={routeIndex}
        persistKey={housePhoneDestPersistKey(workspace)}
        trackClass={HOUSE_SEGMENTED_TRACK_CLASS}
        thumbClass={HOUSE_SEGMENTED_THUMB_CLASS}
      >
        {({ selectedIndex }) =>
          items.map((item, index) => {
            const selected = segmentedItemOn(index, selectedIndex);
            const routeActive = housePhoneDestActive(pathname, item, workspace);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={routeActive ? "page" : undefined}
                data-segmented-item=""
                data-house-phone-dest={item.label}
                className={housePhoneDestItemClass(selected)}
              >
                {workspace === "social" ? (
                  <SocialIcon
                    name={socialNavIconName(item.href)}
                    active={selected}
                    size={SOCIAL_ICON_SIZE_SEARCH}
                  />
                ) : (
                  <NavGlyph item={item} active={selected} />
                )}
                {item.label}
              </Link>
            );
          })
        }
      </SegmentedTrack>
    </nav>
  );
}
