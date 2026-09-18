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

// Phone Settings left slot. Hub list → Home. Pushed section →
// Settings list. 16 Phosphor caret-left Bold + 15 Regular, gap 8.
// Hidden at md, where the rail stays.
export function SettingsHeaderBack() {
  const back = settingsHeaderBack(usePathname());

  return (
    <Link
      href={back.href}
      data-settings-header-back=""
      className={SETTINGS_HEADER_BACK_CLASS}
    >
      <CaretLeft
        className={SETTINGS_RAIL_CHEVRON_CLASS}
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
      />
      {back.label}
    </Link>
  );
}
