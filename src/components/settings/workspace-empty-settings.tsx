import Link from "next/link";

import { HouseEmpty } from "@/components/chrome/house";
import {
  SETTINGS,
  SETTINGS_PANE_CLASS,
  SETTINGS_QUIET_ROW_CLASS,
  SETTINGS_SECTION_CLASS,
  settingsManageCoursesVisible,
  type SettingsHubSection,
} from "@/lib/settings";

// Workspace Settings pane — mode prefs only. HouseEmpty until a
// pref exists. Education staff get a quiet Manage courses row
// linking out to /education. Members never see it. Not a CMS.
export function WorkspaceEmptySettings({
  section,
  isGcStaff = false,
}: {
  section: Extract<SettingsHubSection, "social" | "education">;
  isGcStaff?: boolean;
}) {
  const empty = section === "social" ? SETTINGS.socialEmpty : SETTINGS.educationEmpty;
  const showManage = section === "education" && settingsManageCoursesVisible(isGcStaff);

  return (
    <div data-settings-page="" data-settings-hub={section} className={SETTINGS_PANE_CLASS}>
      <section data-settings-section={section} className={SETTINGS_SECTION_CLASS}>
        <h1 className="t-section text-ink">{SETTINGS.title}</h1>
        <h2 className="t-section text-ink">
          {section === "social" ? SETTINGS.social : SETTINGS.education}
        </h2>
        {showManage ? (
          <Link
            href={SETTINGS.manageCoursesHref}
            data-settings-manage-courses=""
            className={SETTINGS_QUIET_ROW_CLASS}
          >
            {SETTINGS.manageCourses}
          </Link>
        ) : null}
        <HouseEmpty>{empty}</HouseEmpty>
      </section>
    </div>
  );
}
