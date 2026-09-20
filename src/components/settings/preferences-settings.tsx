import {
  AppearancePreferences,
  AppearanceThemeRow,
} from "@/components/settings/appearance-preferences";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { SpeechLearningPreference } from "@/components/settings/speech-learning-preference";
import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import type { NotificationPrefs } from "@/lib/notification-prefs";
import { NOTIFICATION_PREFS } from "@/lib/notification-prefs";
import {
  SETTINGS,
  SETTINGS_CONTENT_MEASURE_CLASS,
  SETTINGS_DRILL_LIST_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsPaneTitle,
} from "@/lib/settings";

// Preferences pane — Appearance (gc-theme SoT) + speech-learning
// opt-out + notification matrix. Never a You / Social / Education /
// Aggregation spine.
// Course management lives on the Education operator workspace,
// not a Preferences row. Not a CMS. Not GC Staff admin.
//
// Mobile: Coinbase drill-in. Theme and Notifications are one-row
// summaries. Instant switches stay on the Notifications pane.
// Desktop keeps the on-page Appearance card and matrix inside
// SETTINGS_CONTENT_MEASURE_CLASS — constrained measure, not
// full-bleed rows.

export function PreferencesSettings({
  prefs,
}: {
  prefs: NotificationPrefs;
}) {
  return (
    <div data-settings-page="" data-settings-hub="preferences" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="preferences" className={SETTINGS_SECTION_CLASS}>
        <SettingsPageLead
          title={settingsPaneTitle("preferences")}
          pathname={SETTINGS.preferencesHref}
        />
        <div data-settings-pref-index="" className={`md:hidden ${SETTINGS_DRILL_LIST_CLASS}`}>
          <AppearanceThemeRow />
          <SettingsDrillRow
            kind="notifications"
            label={NOTIFICATION_PREFS.title}
            href={SETTINGS.notificationsHref}
          />
          <SpeechLearningPreference />
        </div>
        <div
          data-settings-pref-desktop=""
          className={`hidden md:block ${SETTINGS_SECTION_CLASS} ${SETTINGS_CONTENT_MEASURE_CLASS}`}
        >
          <AppearancePreferences />
          <SpeechLearningPreference />
          <NotificationPreferences initialPrefs={prefs} />
        </div>
      </section>
    </div>
  );
}
