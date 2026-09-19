"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import {
  HOUSE_PHONE_BOTTOM_NAV,
  HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_HIDDEN_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT,
  HOUSE_PHONE_BOTTOM_NAV_ITEM_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ITEM_ON_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ROW_CLASS,
  HOUSE_PHONE_WORKSPACE_TABS,
  housePhoneWorkspaceSelected,
  persistHousePhoneWorkspace,
} from "@/lib/house-phone-shell";
import {
  createSocialTabBarScrollTracker,
  stepSocialTabBarScroll,
} from "@/lib/social-tab-bar-scroll";
import { resolveWorkspaceMode } from "@/lib/workspace";

// Prior Social float: hide on scroll-down, show on scroll-up.
// G9 page scroll lives on main (`[data-house-lead-scroll]`), not window.
// Shared across every workspace that mounts this bar.

function useHousePhoneBottomNavHidden(pathname: string) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(false);
    const scroller = document.querySelector<HTMLElement>("[data-house-lead-scroll]");
    const readY = () => (scroller ? scroller.scrollTop : window.scrollY);
    const target: EventTarget = scroller ?? window;
    let tracker = createSocialTabBarScrollTracker(readY());

    const onScroll = () => {
      const next = stepSocialTabBarScroll(tracker, readY());
      const changed = next.state !== tracker.state;
      tracker = next;
      if (changed) setHidden(next.state === "hidden");
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return hidden;
}

export function HousePhoneBottomNav({
  workspace,
}: {
  workspace: ReturnType<typeof resolveWorkspaceMode>;
}) {
  const pathname = usePathname();
  const hidden = useHousePhoneBottomNavHidden(pathname);

  return (
    <nav
      data-house-phone-bottom-nav=""
      data-house-phone-bottom-nav-hidden={hidden ? "" : undefined}
      aria-label={HOUSE_PHONE_BOTTOM_NAV.label}
      aria-hidden={hidden || undefined}
      className={cn(HOUSE_PHONE_BOTTOM_NAV_CLASS, hidden && HOUSE_PHONE_BOTTOM_NAV_HIDDEN_CLASS)}
    >
      <div data-house-phone-bottom-nav-pill="" className={HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS}>
        <div className={HOUSE_PHONE_BOTTOM_NAV_ROW_CLASS}>
          {HOUSE_PHONE_WORKSPACE_TABS.map((tab) => {
            const active = housePhoneWorkspaceSelected(tab.id, pathname, workspace);
            const Glyph = tab.icon;
            const glyph = (
              <Glyph
                className={HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS}
                weight={HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT}
              />
            );
            return (
              <Link
                key={tab.id}
                href={tab.href}
                prefetch
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                tabIndex={hidden ? -1 : undefined}
                data-house-phone-bottom-nav-item={tab.id}
                data-house-phone-bottom-nav-item-active={active ? "" : undefined}
                onClick={() => persistHousePhoneWorkspace(tab.id)}
                className={cn(
                  HOUSE_PHONE_BOTTOM_NAV_ITEM_CLASS,
                  active
                    ? HOUSE_PHONE_BOTTOM_NAV_ITEM_ON_CLASS
                    : HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS,
                )}
              >
                {active ? (
                  <span
                    data-house-phone-bottom-nav-chip=""
                    className={HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS}
                  >
                    {glyph}
                  </span>
                ) : (
                  glyph
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
