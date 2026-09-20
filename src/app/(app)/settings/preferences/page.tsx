import { redirect } from "next/navigation";

import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { getOrgContext } from "@/lib/supabase/context";
import { loadOwnNotificationPrefs } from "@/app/(app)/settings/preferences/actions";

// Preferences door. Appearance + notification matrix.
// Manage courses is Education workspace, not Settings.

export default async function SettingsPreferencesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const prefs = await loadOwnNotificationPrefs();
  return <PreferencesSettings prefs={prefs} />;
}
