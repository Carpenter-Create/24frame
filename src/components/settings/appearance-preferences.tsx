"use client";

import { AppearanceCheck } from "@/components/chrome/appearance-check";
import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { useThemePreference } from "@/components/theme-toggle";
import {
  APPEARANCE,
  APPEARANCE_FLYOUT_OPTIONS,
  APPEARANCE_SETTINGS_CARD_CLASS,
  APPEARANCE_SETTINGS_COPY_CLASS,
  APPEARANCE_SETTINGS_HELPER_CLASS,
  APPEARANCE_SETTINGS_LIST_CLASS,
  APPEARANCE_SETTINGS_OPTION_ACTIVE_CLASS,
  APPEARANCE_SETTINGS_OPTION_CLASS,
  APPEARANCE_SETTINGS_TITLE_CLASS,
  appearancePreferenceLabel,
} from "@/lib/appearance";
import { SETTINGS, SETTINGS_SECTION_CLASS } from "@/lib/settings";
import { applyDocumentThemePreference, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/cn";

// Settings Appearance — same gc-theme SoT as the header sun/moon
// and the phone sheet drill-in. Writes go through theme.ts only.
// Mobile Preferences shows a Theme row; the picker lives on the
// Theme edit pane. Desktop keeps this card on Preferences.

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

export function AppearanceThemeRow() {
  const preference = useThemePreference();

  return (
    <SettingsDrillRow
      kind="theme"
      label={SETTINGS.theme}
      value={appearancePreferenceLabel(preference)}
      href={SETTINGS.themeHref}
    />
  );
}

export function AppearancePreferences() {
  return (
    <section data-settings-section="appearance" className={SETTINGS_SECTION_CLASS}>
      <div className={APPEARANCE_SETTINGS_CARD_CLASS}>
        <h3 className={APPEARANCE_SETTINGS_TITLE_CLASS}>{APPEARANCE.title}</h3>
        <AppearanceThemePicker />
      </div>
    </section>
  );
}
