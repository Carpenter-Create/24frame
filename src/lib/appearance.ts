// Theme preference copy. Lives in lib/, not JSX.
// Header sun/moon is the control — not an account-menu row.
// Existing gc-theme kinds stay light / dark / auto. Auto is
// System default when a preference surface exists. Not a page.
// Not radios. Not a route.

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

// Unused Light / Dark / Auto list. Both instances use
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

export function appearancePreferenceLabel(preference: ThemePreference): string {
  if (preference === "dark") return APPEARANCE.dark;
  if (preference === "auto") return APPEARANCE.systemDefault;
  return APPEARANCE.light;
}
