import { redirect } from "next/navigation";

import { loadProfileLocation } from "@/app/(app)/settings/preferences/location/actions";
import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { getOrgContext } from "@/lib/supabase/context";
import { loadOwnNotificationPrefs } from "@/app/(app)/settings/preferences/actions";

// Preferences door. Location drill and the notification matrix.
// Theme is the avatar menu. Speech-learning is not on this pane.
// Course management is Education workspace, not Settings.

export default async function SettingsPreferencesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const [prefs, location] = await Promise.all([
    loadOwnNotificationPrefs(),
    loadProfileLocation(),
  ]);
  return <PreferencesSettings prefs={prefs} location={location} />;
}
