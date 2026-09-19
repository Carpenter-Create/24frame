import Link from "next/link";

import { AppearancePreferences } from "@/components/settings/appearance-preferences";
import { NotificationPreferences } from "@/components/settings/notification-preferences";
import type { NotificationPrefs } from "@/lib/notification-prefs";
import {
  SETTINGS,
  SETTINGS_PANE_CLASS,
  SETTINGS_PANE_TITLE_CLASS,
  SETTINGS_QUIET_ROW_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsManageCoursesVisible,
  settingsPaneTitle,
} from "@/lib/settings";

// Preferences pane — Appearance (gc-theme SoT) + notification
// matrix. Never a You / Social / Education / Aggregation spine.
// Education staff get a quiet Manage courses row linking out to
// /education. Members never see it. Not a CMS. Not GC Staff admin.

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
        <h1 className={SETTINGS_PANE_TITLE_CLASS}>{settingsPaneTitle("preferences")}</h1>
        <AppearancePreferences />
        <NotificationPreferences initialPrefs={prefs} />
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
