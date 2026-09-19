import { OrganizationSettings } from "@/components/settings/organization-settings";

// Organization door. Company profile lives here. Team / invite /
// roles are out of scope — this section hosts Team next.
export default async function SettingsOrganizationPage() {
  return OrganizationSettings();
}
