"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialIcon } from "@/components/social/social-icon";
import { cn } from "@/lib/cn";
import {
  HOUSE_PHONE_DEST_ITEM_CLASS,
  HOUSE_PHONE_DESTS_CLASS,
  SOCIAL_PHONE_DESTS,
} from "@/lib/house-phone-shell";
import { isSocialTabActive } from "@/lib/nav";
import { SOCIAL_ICON_SIZE_SEARCH, socialNavIconName } from "@/lib/social-icons";

// Phone Social local dests — Explore · Create · Messages · Profile.
// Existing routes only. In-page house pills, not a second float.
// Desktop dest rail is unchanged.

export function SocialPhoneDests() {
  const pathname = usePathname();

  return (
    <nav
      data-social-phone-dests=""
      aria-label="Social"
      className={HOUSE_PHONE_DESTS_CLASS}
    >
      {SOCIAL_PHONE_DESTS.map((item) => {
        const active = isSocialTabActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={active ? "page" : undefined}
            data-social-phone-dest={item.label}
            className={cn(
              HOUSE_PHONE_DEST_ITEM_CLASS,
              active ? "bg-accent-wash font-medium text-accent" : "text-ink",
            )}
          >
            <SocialIcon
              name={socialNavIconName(item.href)}
              active={active}
              size={SOCIAL_ICON_SIZE_SEARCH}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
