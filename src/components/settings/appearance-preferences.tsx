"use client";

import { AppearanceCheck } from "@/components/chrome/appearance-check";
import { useThemePreference } from "@/components/theme-toggle";
import {
  APPEARANCE_FLYOUT_OPTIONS,
  APPEARANCE_SETTINGS_COPY_CLASS,
  APPEARANCE_SETTINGS_HELPER_CLASS,
  APPEARANCE_SETTINGS_LIST_CLASS,
  APPEARANCE_SETTINGS_OPTION_ACTIVE_CLASS,
  APPEARANCE_SETTINGS_OPTION_CLASS,
} from "@/lib/appearance";
import { applyDocumentThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/cn";

// Theme picker — same gc-theme SoT as ThemeSync. Writes go through
// theme.ts only. Mounted on /settings/theme (avatar Theme drill).
// Not a Preferences card. Not a header sun/moon.

export function AppearanceThemePicker() {
  const preference = useThemePreference();

  return (
    <div data-settings-appearance="" className={APPEARANCE_SETTINGS_LIST_CLASS}>
      {APPEARANCE_FLYOUT_OPTIONS.map((option) => {
        const selected = preference === option.kind;
        return (
          <button
            key={option.kind}
            type="button"
            data-settings-appearance-option={option.kind}
            aria-pressed={selected}
            onClick={() => {
              applyDocumentThemePreference(option.kind as ThemePreference);
            }}
            className={cn(
              APPEARANCE_SETTINGS_OPTION_CLASS,
              selected && APPEARANCE_SETTINGS_OPTION_ACTIVE_CLASS,
            )}
          >
            <span className={APPEARANCE_SETTINGS_COPY_CLASS}>
              <span>{option.label}</span>
              {"helper" in option ? (
                <span className={APPEARANCE_SETTINGS_HELPER_CLASS}>{option.helper}</span>
              ) : null}
            </span>
            <AppearanceCheck selected={selected} />
          </button>
        );
      })}
    </div>
  );
}
