import { redirect } from "next/navigation";

import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { getOrgContext } from "@/lib/supabase/context";

// Preferences door. Optional leftover prefs only — not a workspace
// product spine. Staff Manage courses is a href out, not CMS.
export default async function SettingsPreferencesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  return <PreferencesSettings isGcStaff={ctx.isGcStaff} />;
}
