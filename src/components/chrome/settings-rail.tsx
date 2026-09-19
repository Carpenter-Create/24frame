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
  settingsHubSection,
  settingsRailActive,
} from "@/lib/settings";

// Settings hub rail — occupies the 220 Access slot. Title Settings.
// Profile · Organization · Preferences · Security. House muted wash.
// Not a workspace switch. Same URLs from every workspace.
// 75:132 — 16 Phosphor caret lives on the phone back, not these rows.
export function SettingsRail() {
  const section = settingsHubSection(usePathname());

  return (
    <nav data-settings-rail-nav="" className={SETTINGS_RAIL_NAV_CLASS}>
      <p data-settings-rail-title="" className={SETTINGS_RAIL_TITLE_CLASS}>
        {SETTINGS.title}
      </p>
      {SETTINGS_HUB_NAV.map((item) => {
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
