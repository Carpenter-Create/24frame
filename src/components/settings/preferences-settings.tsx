import Link from "next/link";

import {
  AppearancePreferences,
  AppearanceThemeRow,
} from "@/components/settings/appearance-preferences";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { SettingsPageLead } from "@/components/settings/settings-page-lead";
import type { NotificationPrefs } from "@/lib/notification-prefs";
import { NOTIFICATION_PREFS } from "@/lib/notification-prefs";
import {
  SETTINGS,
  SETTINGS_DRILL_LIST_CLASS,
  SETTINGS_PANE_CLASS,
  SETTINGS_QUIET_ROW_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsManageCoursesVisible,
  settingsPaneTitle,
} from "@/lib/settings";

// Preferences pane — Appearance (gc-theme SoT) + notification
// matrix. Never a You / Social / Education / Aggregation spine.
// Education staff get a quiet Manage courses row linking out to
// /education. Members never see it. Not a CMS. Not GC Staff admin.
//
// Mobile: Coinbase drill-in. Theme and Notifications are one-row
// summaries. Instant switches stay on the Notifications pane.
// Desktop keeps the on-page Appearance card and matrix.

export function PreferencesSettings({
  isGcStaff = false,
  prefs,
}: {
  isGcStaff?: boolean;
  prefs: NotificationPrefs;
}) {
  const showManage = settingsManageCoursesVisible(isGcStaff);

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
        </div>
        <div className={`hidden md:block ${SETTINGS_SECTION_CLASS}`}>
          <AppearancePreferences />
          <NotificationPreferences initialPrefs={prefs} />
        </div>
        {showManage ? (
          <Link
            href={SETTINGS.manageCoursesHref}
            data-settings-manage-courses=""
            className={SETTINGS_QUIET_ROW_CLASS}
          >
            {SETTINGS.manageCourses}
          </Link>
        ) : null}
      </section>
    </div>
  );
}
