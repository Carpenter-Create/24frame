"use client";

import { SettingsDrillRow, SettingsGroupList, SettingsGroupRow } from "@/components/settings/settings-drill";
import { useThemePreference } from "@/components/theme-toggle";
import { appearancePreferenceLabel } from "@/lib/appearance";
import { LOCATION } from "@/lib/location";
import { SETTINGS } from "@/lib/settings";

// Preferences Location + Theme. One inset SETTINGS_GROUP.
// Theme drills to the same /settings/preferences/theme picker as the avatar door.
// The Theme face is the stored preference (Light, Dark, or Auto) —
// theme-sot-auto-lock-v1 G4. Not the resolved appearance.
// Rows use the horizontal value trail (row-grammar lock v2).
// Notifications is not in this group.

export function PrefDrillGroup({ locationValue }: { locationValue: string }) {
  const preference = useThemePreference();

  return (
    <div data-settings-pref-drill-group="">
      <SettingsGroupList>
        <SettingsGroupRow>
          <SettingsDrillRow
            kind="location"
            label={LOCATION.title}
            value={locationValue}
            href={SETTINGS.locationHref}
            layout="value-trail"
          />
        </SettingsGroupRow>
        <SettingsGroupRow>
          <SettingsDrillRow
            kind="theme"
            label={SETTINGS.theme}
            value={appearancePreferenceLabel(preference)}
            href={SETTINGS.themeHref}
            layout="value-trail"
          />
        </SettingsGroupRow>
      </SettingsGroupList>
    </div>
  );
}
