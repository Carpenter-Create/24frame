"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SocialCreateMenu } from "@/components/social/social-create-menu";
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
  housePhoneDestActive,
  housePhoneDestGlyph,
  housePhoneDestIsCreate,
  housePhoneDockDestinations,
  housePhoneDockLabel,
  housePhoneShowsBottomDests,
} from "@/lib/house-phone-shell";
import {
  createSocialTabBarScrollTracker,
  stepSocialTabBarScroll,
} from "@/lib/social-tab-bar-scroll";
import type { WorkspaceMode } from "@/lib/workspace";

// Prior Social float: hide on scroll-down, show on scroll-up.
// G9 page scroll lives on main (`[data-house-lead-scroll]`), not window.
// Shared across every workspace that mounts this bar.
// IA A: dests inside the current workspace only. No workspace item.

function useHousePhoneBottomNavHidden(pathname: string) {
  const [nav, setNav] = useState({ path: pathname, hidden: false });
  if (nav.path !== pathname) {
    setNav({ path: pathname, hidden: false });
  }

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("[data-house-lead-scroll]");
    const readY = () => (scroller ? scroller.scrollTop : window.scrollY);
    const target: EventTarget = scroller ?? window;
    let tracker = createSocialTabBarScrollTracker(readY());

    const onScroll = () => {
      const next = stepSocialTabBarScroll(tracker, readY());
      const changed = next.state !== tracker.state;
      tracker = next;
      if (changed) {
        setNav((current) =>
          current.path !== pathname
            ? current
            : { path: pathname, hidden: next.state === "hidden" },
        );
      }
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return nav.path === pathname ? nav.hidden : false;
}

export function HousePhoneBottomNav({
  workspace,
  isGcStaff = false,
  homeOwned = false,
  accountChrome = false,
  coProductions = false,
}: {
  workspace: WorkspaceMode;
  isGcStaff?: boolean;
  homeOwned?: boolean;
  accountChrome?: boolean;
  coProductions?: boolean;
}) {
  const pathname = usePathname();
  const hidden = useHousePhoneBottomNavHidden(pathname);
  const visible = housePhoneShowsBottomDests({
    workspace,
    homeOwned,
    accountChrome,
    coProductions,
  });
  const items = housePhoneDockDestinations({ isGcStaff, workspace, homeOwned });
  const destWorkspace = homeOwned ? "aggregation" : workspace;

  if (!visible) return null;

  return (
    <nav
      data-house-phone-bottom-nav=""
      data-house-phone-bottom-nav-hidden={hidden ? "" : undefined}
      aria-label={housePhoneDockLabel({ workspace, homeOwned }) || HOUSE_PHONE_BOTTOM_NAV.label}
      aria-hidden={hidden || undefined}
      className={cn(HOUSE_PHONE_BOTTOM_NAV_CLASS, hidden && HOUSE_PHONE_BOTTOM_NAV_HIDDEN_CLASS)}
    >
      <div data-house-phone-bottom-nav-pill="" className={HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS}>
        <div className={HOUSE_PHONE_BOTTOM_NAV_ROW_CLASS}>
          {items.map((item) => {
            const active = housePhoneDestActive(pathname, item, destWorkspace);
            const Glyph = housePhoneDestGlyph(item);
            const glyph = (
              <Glyph
                className={HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS}
                weight={HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT}
              />
            );
            const chip = active ? (
              <span
                data-house-phone-bottom-nav-chip=""
                className={HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS}
              >
                {glyph}
              </span>
            ) : (
              glyph
            );
            const destClass = cn(
              HOUSE_PHONE_BOTTOM_NAV_ITEM_CLASS,
              active
                ? HOUSE_PHONE_BOTTOM_NAV_ITEM_ON_CLASS
                : HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS,
            );
            if (housePhoneDestIsCreate(item)) {
              return (
                <SocialCreateMenu
                  key={item.href}
                  align="center"
                  trigger={
                    <button
                      type="button"
                      aria-label={item.label}
                      aria-current={active ? "page" : undefined}
                      tabIndex={hidden ? -1 : undefined}
                      data-house-phone-bottom-nav-item={item.href}
                      data-house-phone-bottom-nav-item-active={active ? "" : undefined}
                      data-house-phone-dest={item.label}
                      data-house-phone-dest-create=""
                      data-social-create-menu="dest"
                      className={destClass}
                    >
                      {chip}
                    </button>
                  }
                />
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                tabIndex={hidden ? -1 : undefined}
                data-house-phone-bottom-nav-item={item.href}
                data-house-phone-bottom-nav-item-active={active ? "" : undefined}
                data-house-phone-dest={item.label}
                className={destClass}
              >
                {chip}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
