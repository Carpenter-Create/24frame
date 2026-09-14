"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { cn } from "@/lib/cn";
import {
  SETTINGS_LOCAL_NAV,
  SETTINGS_RAIL_ACTIVE_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
  SETTINGS_RAIL_DASHBOARD_CLASS,
  SETTINGS_RAIL_IDLE_CLASS,
  SETTINGS_RAIL_ITEM_CLASS,
  SETTINGS_RAIL_NAV_CLASS,
  settingsRailActive,
  settingsSection,
} from "@/lib/settings";

// 600:881 settings rail — occupies the 220 Access slot. Home is
// 16 Phosphor caret-left Bold + 15 Regular (75:132). Active is a
// muted wash that follows the path. Labels stay text-led. Do not
// add Titles, Appearance, Account, Users, or API.
export function SettingsRail() {
  const section = settingsSection(usePathname());

  return (
    <nav data-settings-rail-nav="" className={SETTINGS_RAIL_NAV_CLASS}>
      {SETTINGS_LOCAL_NAV.map((item) => {
        const active = settingsRailActive(item.kind, section);
        return (
          <Link
            key={item.kind}
            href={item.href}
            data-settings-rail-item={item.kind}
            aria-current={active ? "page" : undefined}
            className={cn(
              SETTINGS_RAIL_ITEM_CLASS,
              item.kind === "dashboard" ? SETTINGS_RAIL_DASHBOARD_CLASS : undefined,
              active ? SETTINGS_RAIL_ACTIVE_CLASS : SETTINGS_RAIL_IDLE_CLASS,
            )}
          >
            {item.kind === "dashboard" ? (
              <CaretLeft
                className={SETTINGS_RAIL_CHEVRON_CLASS}
                weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
              />
            ) : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
