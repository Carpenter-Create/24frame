import { SettingsHubList } from "@/components/chrome/settings-hub-list";
import { ProfileSettings } from "@/components/settings/profile-settings";

// Settings hub. Hard-cut — no ?section= land, no legacy redirects.
// Desktop: Profile pane (rail sits in the Access slot).
// Mobile: list → push.
export default async function SettingsPage() {
  return (
    <>
      <SettingsHubList className="md:hidden" />
      <div className="hidden md:block">
        <ProfileSettings />
      </div>
    </>
  );
}
