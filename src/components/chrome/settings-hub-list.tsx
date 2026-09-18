"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { cn } from "@/lib/cn";
import {
  SETTINGS,
  SETTINGS_HUB_NAV,
  SETTINGS_PANE_CLASS,
  SETTINGS_QUIET_ROW_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
  SETTINGS_RAIL_TITLE_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsHubNav,
} from "@/lib/settings";
import { availableWorkspaceOptions } from "@/lib/workspace-menu";

// Mobile Settings list → push. Same section order as the desktop
// rail. Hidden at md, where the rail stays.
export function SettingsHubList({
  lanes,
  className,
}: {
  lanes?: readonly ("aggregation" | "social" | "education")[];
  className?: string;
}) {
  const items = lanes
    ? settingsHubNav(lanes)
    : settingsHubNav(availableWorkspaceOptions().map((option) => option.mode));
  const nav = items.length > 0 ? items : SETTINGS_HUB_NAV;

  return (
    <div
      data-settings-page=""
      data-settings-hub-list=""
      className={cn(SETTINGS_PANE_CLASS, className)}
    >
      <section data-settings-section="list" className={SETTINGS_SECTION_CLASS}>
        <h1 className={SETTINGS_RAIL_TITLE_CLASS}>{SETTINGS.title}</h1>
        <nav data-settings-hub-list-nav="" className="flex flex-col gap-[var(--space-6)]">
          {nav.map((item) => (
            <Link
              key={item.kind}
              href={item.href}
              data-settings-hub-list-item={item.kind}
              className={SETTINGS_QUIET_ROW_CLASS}
            >
              {item.label}
              <CaretRight
                className={SETTINGS_RAIL_CHEVRON_CLASS}
                weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
              />
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
