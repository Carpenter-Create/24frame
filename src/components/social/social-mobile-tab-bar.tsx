"use client";

import Link from "next/link";

import { isSocialTabActive, SOCIAL_NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";
import {
  SOCIAL_TAB_BAR_CLASS,
  SOCIAL_TAB_BAR_ROW_CLASS,
  SOCIAL_TAB_ITEM_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_TAB, socialNavIconName } from "@/lib/social-icons";
import { SocialIcon } from "./social-icon";
import { SocialNavPendingProbe, useSocialNavPending } from "./use-social-nav-pending";

// Flush sticky tab bar — Figma 133:1078 / 129:615 / 135:1037 / 138:889.
// Five jobs, icons only, hairline top, no FAB, no floating pill.
// Prefetch on: five destinations + local Social loading.tsx.

export function SocialMobileTabBar() {
  const { activePath, markPending, pendingHref } = useSocialNavPending();

  return (
    <nav data-social-tab-bar="" className={SOCIAL_TAB_BAR_CLASS} aria-label="Social">
      <div className={SOCIAL_TAB_BAR_ROW_CLASS}>
        {SOCIAL_NAV.map((item) => {
          const active = isSocialTabActive(activePath, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              data-social-tab-item={item.label}
              data-social-tab-pending={pendingHref === item.href ? "" : undefined}
              onClick={(event) => markPending(item.href, event)}
              className={cn(SOCIAL_TAB_ITEM_CLASS, active ? "text-ink" : "text-ink-2")}
            >
              <SocialNavPendingProbe href={item.href} onPending={markPending} />
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
