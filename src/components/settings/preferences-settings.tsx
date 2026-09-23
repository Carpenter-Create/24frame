import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { PrefDrillGroup } from "@/components/settings/pref-drill-group";
import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import { composeLocationLabel, LOCATION, type ProfileLocation } from "@/lib/location";
import type { NotificationPrefs } from "@/lib/notification-prefs";
import { NOTIFICATION_PREFS } from "@/lib/notification-prefs";
import { menuHostClass } from "@/lib/menu-host";
import {
  SETTINGS,
  SETTINGS_CONTENT_MEASURE_CLASS,
  SETTINGS_DRILL_LIST_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsPaneTitle,
} from "@/lib/settings";

// Preferences pane — Location and Theme in one PrefDrillGroup,
// then the notification matrix (PrefControlSection grammar).
// Speech-learning is parked off Preferences (Adam 2026-09-22).
// The gc-speech-learning store stays; this pane does not surface it.
// Never a You / Social / Education / Aggregation spine.
// Course management lives on the Education operator workspace,
// not a Preferences row. Not a CMS. Not GC Staff admin.
//
// Location and Theme are Coinbase horizontal drills inside the
// inset group. The muted value is the composed place, or the empty
// placeholder, and the stored theme label (Auto, Dark, or Light).
// Mobile also drills to Notifications. Instant switches stay
// on the Notifications pane. Theme is not under that matrix.
// PrefDrillGroup and the Notifications matrix share one
// SETTINGS_CONTENT_MEASURE_CLASS — constrained measure, not
// full-bleed rows. Same left and right edges.

export function PreferencesSettings({
  prefs,
  location,
}: {
  prefs: NotificationPrefs;
  location: ProfileLocation;
}) {
  const locationValue =
    composeLocationLabel(location.city, location.region, location.country) || LOCATION.empty;
  return (
    <div data-settings-page="" data-settings-hub="preferences" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="preferences" className={SETTINGS_SECTION_CLASS}>
        <SettingsPageLead
          title={settingsPaneTitle("preferences")}
          pathname={SETTINGS.preferencesHref}
        />
        <div
          data-settings-pref-column=""
          className={`${SETTINGS_CONTENT_MEASURE_CLASS} flex flex-col gap-[var(--space-6)]`}
        >
          <div data-settings-pref-index="" className={SETTINGS_DRILL_LIST_CLASS}>
            <PrefDrillGroup locationValue={locationValue} />
            <div className={menuHostClass("phone")} data-menu-host="phone" data-menu-family="B">
              <SettingsDrillRow
                kind="notifications"
                label={NOTIFICATION_PREFS.title}
                href={SETTINGS.notificationsHref}
              />
            </div>
          </div>
          <div
            data-settings-pref-desktop=""
            className={`${menuHostClass("desktop")} ${SETTINGS_SECTION_CLASS}`}
          >
            <NotificationPreferences initialPrefs={prefs} />
          </div>
        </div>
      </section>
    </div>
  );
}
