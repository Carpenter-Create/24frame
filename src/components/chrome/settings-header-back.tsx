"use client";

import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import {
  SETTINGS,
  SETTINGS_HEADER_BACK_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
} from "@/lib/settings";

// 623:785 — phone /settings left slot. Same ← Home as the
// 600:881 rail. 16 Phosphor caret-left Bold + 15 Regular, gap 8,
// href /. Hidden at md. Not a new IA. Do not restyle the rail or Identity.
export function SettingsHeaderBack() {
  return (
    <Link
      href={SETTINGS.dashboardHref}
      data-settings-header-back=""
      className={SETTINGS_HEADER_BACK_CLASS}
    >
      <CaretLeft
        className={SETTINGS_RAIL_CHEVRON_CLASS}
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
      />
      {SETTINGS.dashboard}
    </Link>
  );
}
