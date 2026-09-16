"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import {
  SETTINGS,
  SETTINGS_HUB_NAV,
  SETTINGS_RAIL_ACTIVE_CLASS,
  SETTINGS_RAIL_IDLE_CLASS,
  SETTINGS_RAIL_ITEM_CLASS,
  SETTINGS_RAIL_NAV_CLASS,
  SETTINGS_RAIL_TITLE_CLASS,
  settingsHubNav,
  settingsHubSection,
  settingsRailActive,
} from "@/lib/settings";
import { availableWorkspaceOptions } from "@/lib/workspace-menu";

// Settings hub rail — occupies the 220 Access slot. Title Settings.
// You · Social · Education · Aggregation (omit a lane the user
// cannot access). House muted wash. Not a workspace switch.
// 75:132 — 16 Phosphor caret lives on the phone back, not these rows.
export function SettingsRail() {
  const section = settingsHubSection(usePathname());
  const items = settingsHubNav(availableWorkspaceOptions().map((option) => option.mode));
  const nav = items.length > 0 ? items : SETTINGS_HUB_NAV;

  return (
    <nav data-settings-rail-nav="" className={SETTINGS_RAIL_NAV_CLASS}>
      <p data-settings-rail-title="" className={SETTINGS_RAIL_TITLE_CLASS}>
        {SETTINGS.title}
      </p>
      {nav.map((item) => {
        const active = settingsRailActive(item.kind, section);
        return (
          <Link
            key={item.kind}
            href={item.href}
            data-settings-rail-item={item.kind}
            aria-current={active ? "page" : undefined}
            className={cn(
              SETTINGS_RAIL_ITEM_CLASS,
              active ? SETTINGS_RAIL_ACTIVE_CLASS : SETTINGS_RAIL_IDLE_CLASS,
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
