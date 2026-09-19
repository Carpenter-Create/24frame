import { redirect } from "next/navigation";

import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { getOrgContext } from "@/lib/supabase/context";
import { loadOwnNotificationPrefs } from "@/app/(app)/settings/preferences/actions";

// Preferences door. Appearance + notification matrix. Staff
// Manage courses is a href out, not CMS.

export default async function SettingsPreferencesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const prefs = await loadOwnNotificationPrefs();
  return <PreferencesSettings isGcStaff={ctx.isGcStaff} prefs={prefs} />;
}
