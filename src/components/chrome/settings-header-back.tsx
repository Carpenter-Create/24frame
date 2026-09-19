"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import {
  SETTINGS_HEADER_BACK_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
  settingsHeaderBack,
} from "@/lib/settings";

// Mobile Settings detail back = house SoT. AppShell mounts this
// once for every isSettingsPath. Accent caret only — label is aria.
// 16 Phosphor caret-left Bold. Absolute so the 24 emblem stays put.
export function SettingsHeaderBack() {
  const back = settingsHeaderBack(usePathname());

  return (
    <Link
      href={back.href}
      data-settings-header-back=""
      aria-label={back.label}
      className={SETTINGS_HEADER_BACK_CLASS}
    >
      <CaretLeft
        className={SETTINGS_RAIL_CHEVRON_CLASS}
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
      />
    </Link>
  );
}
