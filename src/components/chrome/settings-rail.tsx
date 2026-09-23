"use client";

import { HouseLink } from "./house-link";
import { HouseNavPendingProbe, useHouseNavPending } from "./use-house-nav-pending";
import { cn } from "@/lib/cn";
import {
  HOUSE_RAIL_ACTIVE_CLASS,
  HOUSE_RAIL_IDLE_CLASS,
  HOUSE_RAIL_ITEM_CLASS,
  HOUSE_RAIL_TITLE_CLASS,
} from "@/lib/house-shell";
import {
  SETTINGS,
  SETTINGS_HUB_NAV,
  SETTINGS_RAIL_NAV_CLASS,
  settingsHubSection,
  settingsRailActive,
} from "@/lib/settings";

// Settings hub rail — occupies the house dest-rail slot. Title Settings.
// Profile · Organization · Preferences · Security. Accent wash SoT from
// house-shell — same selected pill as every workspace rail. Not a
// workspace switch. Same URLs from every workspace.
// 75:132 — 16 Phosphor caret lives on the phone back, not these rows.
export function SettingsRail() {
  const { activePath, markPending } = useHouseNavPending();
  const section = settingsHubSection(activePath);

  return (
    <nav
      data-settings-rail-nav=""
      data-menu-host="desktop"
      data-menu-family="desktop"
      className={SETTINGS_RAIL_NAV_CLASS}
    >
      <p data-settings-rail-title="" className={HOUSE_RAIL_TITLE_CLASS}>
        {SETTINGS.title}
      </p>
      {SETTINGS_HUB_NAV.map((item) => {
        const active = settingsRailActive(item.kind, section);
        return (
          <HouseLink
            key={item.kind}
            href={item.href}
            data-settings-rail-item={item.kind}
            aria-current={active ? "page" : undefined}
            onClick={(event) => markPending(item.href, event)}
            className={cn(
              HOUSE_RAIL_ITEM_CLASS,
              "px-2 py-2",
              active ? HOUSE_RAIL_ACTIVE_CLASS : HOUSE_RAIL_IDLE_CLASS,
            )}
          >
            <HouseNavPendingProbe href={item.href} onPending={markPending} />
            {item.label}
          </HouseLink>
        );
      })}
    </nav>
  );
}
