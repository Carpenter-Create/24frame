"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { isSocialTabActive, SOCIAL_NAV } from "@/lib/nav";
import { cn } from "@/lib/cn";
import {
  SOCIAL_TAB_BAR_CLASS,
  SOCIAL_TAB_BAR_ROW_CLASS,
  SOCIAL_TAB_ITEM_CLASS,
  SOCIAL_TAB_PILL_CLASS,
  SOCIAL_TAB_PILL_HIDDEN_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_TAB, socialNavIconName } from "@/lib/social-icons";
import {
  createSocialTabBarScrollTracker,
  stepSocialTabBarScroll,
} from "@/lib/social-tab-bar-scroll";
import { SocialIcon } from "./social-icon";
import { SocialNavPendingProbe, useSocialNavPending } from "./use-social-nav-pending";

// Floating pill — Figma 169:1519 visible / 160:1129 hidden on scroll-down.
// Five jobs, icons only, no FAB. Prefetch on: five destinations + local Social loading.tsx.
// Mercury floating dock stays gone.

function useSocialTabBarHidden() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let tracker = createSocialTabBarScrollTracker(window.scrollY);

    const onScroll = () => {
      const next = stepSocialTabBarScroll(tracker, window.scrollY);
      const changed = next.state !== tracker.state;
      tracker = next;
      if (changed) setHidden(next.state === "hidden");
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

export function SocialMobileTabBar() {
  const { activePath, markPending, pendingHref } = useSocialNavPending();
  const hidden = useSocialTabBarHidden();

  return (
    <nav
      data-social-tab-bar=""
      data-social-tab-pill=""
      data-social-tab-bar-hidden={hidden ? "" : undefined}
      className={cn(SOCIAL_TAB_BAR_CLASS, hidden && SOCIAL_TAB_PILL_HIDDEN_CLASS)}
      aria-label="Social"
      aria-hidden={hidden || undefined}
    >
      <div className={SOCIAL_TAB_PILL_CLASS}>
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
                tabIndex={hidden ? -1 : undefined}
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
      </div>
    </nav>
  );
}
