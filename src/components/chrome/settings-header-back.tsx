"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import {
  SETTINGS_HEADER_BACK_CLASS,
  SETTINGS_PANE_BACK_CLASS,
  SETTINGS_RAIL_CHEVRON_CLASS,
  settingsHeaderBack,
  settingsHeaderBackWhen,
} from "@/lib/settings";

// Phone Settings back. One SoT.
//   hub  — header lead: Home on the list (AppShell).
//   pane — Settings layout: accent caret + Settings on every subpage.
// Hidden at md, where the rail stays. Phosphor caret-left Bold +
// t-body Regular, Sporty Blue ink. Not a second chrome system.
export function SettingsHeaderBack({
  when = "always",
}: {
  when?: "always" | "hub" | "pane";
} = {}) {
  const pathname = usePathname();
  const slot = settingsHeaderBackWhen(pathname);
  if (when !== "always" && when !== slot) return null;

  const back = settingsHeaderBack(pathname);

  return (
    <Link
      href={back.href}
      data-settings-header-back=""
      data-settings-header-back-when={slot}
      className={
        when === "pane"
          ? `${SETTINGS_HEADER_BACK_CLASS} ${SETTINGS_PANE_BACK_CLASS}`
          : SETTINGS_HEADER_BACK_CLASS
      }
    >
      <CaretLeft
        className={SETTINGS_RAIL_CHEVRON_CLASS}
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
      />
      {back.label}
    </Link>
  );
}
