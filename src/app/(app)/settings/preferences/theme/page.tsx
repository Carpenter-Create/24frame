import { redirect } from "next/navigation";

import { AppearanceThemePicker } from "@/components/settings/appearance-preferences";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";

// Theme drill-in. Picker only — same gc-theme SoT as desktop
// Preferences Appearance and the phone sheet. Back to Preferences.

export default async function SettingsPreferencesThemePage() {
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
