"use client";

import { HouseLink } from "./house-link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { SocialCreateSheet } from "@/components/social/social-create-sheet";
import { railDestinations, isSocialCreateDest, STAFF_RAIL_EYEBROW, type NavItem } from "@/lib/nav";
import {
  HOUSE_RAIL_ACTIVE_CLASS,
  HOUSE_RAIL_ICON_CLASS,
  HOUSE_RAIL_IDLE_CLASS,
  HOUSE_RAIL_ITEM_CLASS,
  HOUSE_RAIL_LABEL_CLASS,
  HOUSE_RAIL_TITLE_CLASS,
} from "@/lib/house-shell";
import { cn } from "@/lib/cn";
import { clampWorkspaceMode, type WorkspaceMode } from "@/lib/workspace";
import { SocialIcon } from "@/components/social/social-icon";
import {
  SocialNavPendingProbe,
  useSocialNavPending,
} from "@/components/social/use-social-nav-pending";
import { SOCIAL_ICON_SIZE_NAV, socialNavIconName } from "@/lib/social-icons";
import { NavGlyph } from "./nav-glyph";

// Access rail: house --text-base / t-body labels, 16px Phosphor Bold idle /
// Fill active (75:5 / 61:2). Active = Sporty Blue icon+text + light-blue
// pill wash. Inactive = ink. Header mark is BrandLogo (24Frame), not a C.
// Social destinations use Social Figma V1 Phosphor via SocialIcon.
// Collapsed mode is icon-only (labels hidden; title tooltips). Open count lives on the header bell.
export function SideNav({
  isGcStaff = false,
  collapsed = false,
  workspace: requestedWorkspace = "aggregation",
}: {
  isGcStaff?: boolean;
  collapsed?: boolean;
  workspace?: WorkspaceMode;
}) {
  const workspace = clampWorkspaceMode(requestedWorkspace, isGcStaff);
  const social = workspace === "social";
  const { activePath, markPending, pendingHref } = useSocialNavPending();
  const pathForActive = activePath;

  const router = useRouter();
  const warmed = useRef<Set<string>>(new Set());
  const warm = (href: string) => {
    if (social || warmed.current.has(href)) return;
    warmed.current.add(href);
    router.prefetch(href);
  };

  const row = (
    item: NavItem,
    badge: React.ReactNode = null,
  ) => {
    const active = item.exact ? pathForActive === item.href : pathForActive.startsWith(item.href);
    const rowClass = cn(
      HOUSE_RAIL_ITEM_CLASS,
      collapsed ? "justify-center px-0 py-2" : "gap-2 px-2 py-2",
      active ? HOUSE_RAIL_ACTIVE_CLASS : HOUSE_RAIL_IDLE_CLASS,
    );
    const glyph = social ? (
      <span data-side-nav-icon="" className={HOUSE_RAIL_ICON_CLASS}>
        <SocialIcon
          name={socialNavIconName(item.href)}
          active={active}
          size={SOCIAL_ICON_SIZE_NAV}
        />
      </span>
    ) : (
      <NavGlyph item={item} active={active} />
    );
    const label = !collapsed ? (
      <span className={HOUSE_RAIL_LABEL_CLASS}>{item.label}</span>
    ) : null;
    if (social && isSocialCreateDest(item)) {
      return (
        <SocialCreateSheet
          key={item.href}
          trigger={
            <button
              type="button"
              title={collapsed ? item.label : undefined}
              aria-label={item.ariaLabel ?? item.label}
              aria-current={active ? "page" : undefined}
              data-social-create-sheet="dest"
              className={rowClass}
            >
              {glyph}
              {label}
            </button>
          }
        />
      );
    }
    return (
      <HouseLink
        key={item.href}
        href={item.href}
        // Aggregation: VIEWPORT prefetch off, HOVER prefetch on. The sidebar
        // renders on every page, so viewport prefetch fired a full uncached
        // render of EVERY destination on EVERY navigation — ~400 invocations
        // in one short session. Hovering warms the one destination you are
        // about to click. Deduped per href so re-hovering does not re-fire.
        // Social: VIEWPORT prefetch on. Desktop rail is the same five
        // SOCIAL_NAV dests plus local loading.tsx — not the Aggregation
        // dashboard skeleton. Create opens the equal-tile sheet.
        prefetch={social}
        onMouseEnter={social ? undefined : () => warm(item.href)}
        onFocus={social ? undefined : () => warm(item.href)}
        onClick={(event) => markPending(item.href, event)}
        title={collapsed ? item.label : undefined}
        aria-label={item.ariaLabel ?? (collapsed ? item.label : undefined)}
        data-social-rail-pending={social && pendingHref === item.href ? "" : undefined}
        className={rowClass}
      >
        <SocialNavPendingProbe href={item.href} onPending={markPending} />
        {glyph}
        {label}
        {badge}
      </HouseLink>
    );
  };

  const { items, staffItems } = railDestinations(isGcStaff, workspace);

  return (
    <nav className="flex flex-col gap-2 px-2" data-side-nav="">
      {items.map((item) => row(item))}
      {staffItems.length > 0 ? (
        <>
          <div className="mx-1 my-2 border-t border-hairline" />
          {!collapsed ? (
            <span className={HOUSE_RAIL_TITLE_CLASS}>{STAFF_RAIL_EYEBROW}</span>
          ) : null}
          {staffItems.map((item) => row(item))}
        </>
      ) : null}
    </nav>
  );
}
