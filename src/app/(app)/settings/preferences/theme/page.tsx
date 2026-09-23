import { redirect } from "next/navigation";

import { AppearanceThemePicker } from "@/components/settings/appearance-preferences";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";

// Theme drill. One picker — gc-theme SoT. Avatar Theme and the
// Preferences Theme row both land here. Nested under Preferences.
// Back to Preferences.

export default async function SettingsThemePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  return (
    <SettingsEditPane
      title={SETTINGS.theme}
      helper={SETTINGS.themeHelper}
      pathname={SETTINGS.themeHref}
      hub="preferences"
    >
      <AppearanceThemePicker />
    </SettingsEditPane>
  );
}
