import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import {
  SETTINGS,
  SETTINGS_PANE_CLASS,
  SETTINGS_QUIET_ROW_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsManageCoursesVisible,
} from "@/lib/settings";

// Preferences pane — leftover workspace prefs as optional subsections
// only. Never a You / Social / Education / Aggregation spine.
// Education staff get a quiet Manage courses row linking out to
// /education. Members never see it. Not a CMS. Not GC Staff admin.
export function PreferencesSettings({
  isGcStaff = false,
}: {
  isGcStaff?: boolean;
}) {
  const showManage = settingsManageCoursesVisible(isGcStaff);

  return (
    <div data-settings-page="" data-settings-hub="preferences" className={SETTINGS_PANE_CLASS}>
      <section data-settings-section="preferences" className={SETTINGS_SECTION_CLASS}>
        <h1 className="t-section text-ink">{SETTINGS.title}</h1>
        <h2 className="t-section text-ink">{SETTINGS.preferences}</h2>
        {showManage ? (
          <Link
            href={SETTINGS.manageCoursesHref}
            data-settings-manage-courses=""
            className={SETTINGS_QUIET_ROW_CLASS}
          >
            {SETTINGS.manageCourses}
          </Link>
        ) : null}
        <HouseEmpty>{SETTINGS.preferencesEmpty}</HouseEmpty>
      </section>
    </div>
  );
}
