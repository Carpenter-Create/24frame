"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialIcon } from "@/components/social/social-icon";
import { cn } from "@/lib/cn";
import {
  HOUSE_PHONE_DESTS_CLASS,
  housePhoneDestActive,
  housePhoneDestChipsLabel,
  housePhoneDestinations,
  housePhoneDestItemClass,
} from "@/lib/house-phone-shell";
import { SOCIAL_ICON_SIZE_SEARCH, socialNavIconName } from "@/lib/social-icons";
import type { WorkspaceMode } from "@/lib/workspace";
import { NavGlyph } from "./nav-glyph";

// One under-top dest chip row for Aggregation · Education · Social.
// Real dest lists from mobileNavDestinations — Ask 24Frame AI stays
// off the chips (avatar sheet / overlay; no Agg hop). Home has no row.
// Scroll-x when the list overflows. House filter selected, not a
// second bottom float and not a Meta skin. Desktop rail is unchanged.

export function HousePhoneDestChips({
  workspace,
  isGcStaff = false,
}: {
  workspace: WorkspaceMode;
  isGcStaff?: boolean;
}) {
  const pathname = usePathname();
  const items = housePhoneDestinations(isGcStaff, workspace);

  return (
    <nav
      data-house-phone-dest-chips=""
      data-house-phone-dest-workspace={workspace}
      aria-label={housePhoneDestChipsLabel(workspace)}
      className={HOUSE_PHONE_DESTS_CLASS}
    >
      {items.map((item) => {
        const active = housePhoneDestActive(pathname, item, workspace);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            data-house-phone-dest={item.label}
            className={cn(housePhoneDestItemClass(active))}
          >
            {workspace === "social" ? (
              <SocialIcon
                name={socialNavIconName(item.href)}
                active={active}
                size={SOCIAL_ICON_SIZE_SEARCH}
              />
            ) : (
              <NavGlyph item={item} active={active} />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
