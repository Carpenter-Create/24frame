// Theme preference copy. Lives in lib/, not JSX.
// One SoT: gc-theme via lib/theme.ts. Header sun/moon, phone
// sheet drill-in, and Settings → Preferences Appearance all
// read/write that key. Do not invent a second store. Phone
// grammar A keeps the pre-#391 Appearance drill-in on the
// avatar sheet — not a page, not radios, not a route.
// Existing kinds stay light / dark / auto. Auto is System
// default on every preference surface.

import { SETTINGS_PREF_BLOCK_CLASS, SETTINGS_PREF_TITLE_CLASS } from "@/lib/settings";
import { USER_MENU } from "@/lib/user-menu";
import type { ThemePreference } from "@/lib/theme";

export type AccountMenuFace = "main" | "appearance";

export const APPEARANCE = {
  title: USER_MENU.appearance,
  back: "Back",
  light: "Light",
  dark: "Dark",
  auto: "Auto",
  systemDefault: "System default",
  systemDefaultHelper: "We'll match your system preferences",
} as const;

// Unused Light / Dark / Auto list. Preference surfaces use
// System default / Dark / Light.
export const APPEARANCE_OPTIONS = [
  { kind: "light", label: APPEARANCE.light },
  { kind: "dark", label: APPEARANCE.dark },
  { kind: "auto", label: APPEARANCE.auto },
] as const;

export const APPEARANCE_FLYOUT_OPTIONS = [
  {
    kind: "auto",
    label: APPEARANCE.systemDefault,
    helper: APPEARANCE.systemDefaultHelper,
  },
  { kind: "dark", label: APPEARANCE.dark },
  { kind: "light", label: APPEARANCE.light },
] as const;

export const APPEARANCE_SETTINGS_CARD_CLASS = SETTINGS_PREF_BLOCK_CLASS;
export const APPEARANCE_SETTINGS_TITLE_CLASS = SETTINGS_PREF_TITLE_CLASS;
export const APPEARANCE_SETTINGS_LIST_CLASS = "flex flex-col";
export const APPEARANCE_SETTINGS_OPTION_CLASS =
  "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-3)] text-left t-body text-ink hover:bg-surface";
export const APPEARANCE_SETTINGS_OPTION_ACTIVE_CLASS = "bg-surface";
export const APPEARANCE_SETTINGS_COPY_CLASS = "flex min-w-0 flex-col gap-[var(--space-1)]";
export const APPEARANCE_SETTINGS_HELPER_CLASS = "t-body-sm text-ink-3";

export function appearancePreferenceLabel(preference: ThemePreference): string {
  if (preference === "dark") return APPEARANCE.dark;
  if (preference === "auto") return APPEARANCE.systemDefault;
  return APPEARANCE.light;
}
