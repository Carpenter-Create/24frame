import { YouSettings } from "@/components/settings/you-settings";

// Profile menu door. You identity lives here and on /settings/you.
// Company moved to /settings/aggregation. The 220 rail stays in the
// Access slot. Do not invent columns. Do not restyle Identity.
export default async function SettingsProfilePage() {
  return YouSettings();
}
