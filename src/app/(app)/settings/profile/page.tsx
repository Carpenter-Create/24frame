import { ProfileSettings } from "@/components/settings/profile-settings";

// Profile door. Identity lives here. Company lives on Organization.
// The dest rail stays in the Access slot. Do not invent columns.
// Do not restyle Identity. Do not fork a second public-profile editor.
export default async function SettingsProfilePage() {
  return ProfileSettings();
}
