import { MenuDualHost } from "@/components/chrome/menu-dual-host";
import { SettingsHubList } from "@/components/chrome/settings-hub-list";
import { ProfileSettings } from "@/components/settings/profile-settings";

// Settings hub. Hard-cut — no ?section= land, no legacy redirects.
// Desktop: Profile pane (rail sits in the Access slot).
// Mobile: family B list → push. One dual host — no third menu.
export default async function SettingsPage() {
  return (
    <MenuDualHost phone={<SettingsHubList />} desktop={<ProfileSettings />} />
  );
}
