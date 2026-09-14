"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isSocialTabActive, SOCIAL_NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";
import {
  SOCIAL_TAB_BAR_CLASS,
  SOCIAL_TAB_BAR_ROW_CLASS,
  SOCIAL_TAB_ITEM_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_TAB, socialNavIconName } from "@/lib/social-icons";
import { SocialIcon } from "./social-icon";

// Flush sticky tab bar — Figma 133:1078 / 129:615 / 135:1037 / 138:889.
// Five jobs, icons only, hairline top, no FAB, no floating pill.

export function SocialMobileTabBar() {
  const pathname = usePathname();

  return (
    <nav data-social-tab-bar="" className={SOCIAL_TAB_BAR_CLASS} aria-label="Social">
      <div className={SOCIAL_TAB_BAR_ROW_CLASS}>
        {SOCIAL_NAV.map((item) => {
          const active = isSocialTabActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              data-social-tab-item={item.label}
              className={cn(SOCIAL_TAB_ITEM_CLASS, active ? "text-ink" : "text-ink-2")}
            >
              <SocialIcon
                name={socialNavIconName(item.href)}
                active={active}
                size={SOCIAL_ICON_SIZE_TAB}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
