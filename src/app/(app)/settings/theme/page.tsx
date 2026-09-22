import { redirect } from "next/navigation";

import { AppearanceThemePicker } from "@/components/settings/appearance-preferences";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";

// Theme drill. Picker only — gc-theme SoT. Peer of Preferences,
// not nested under it. Back to Settings.

export default async function SettingsThemePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  return (
    <SettingsEditPane
      title={SETTINGS.theme}
      helper={SETTINGS.themeHelper}
      pathname={SETTINGS.themeHref}
    >
      <AppearanceThemePicker />
    </SettingsEditPane>
  );
}
