import { redirect } from "next/navigation";

import { LocationSearch } from "@/components/settings/location-search";
import { SettingsEditPane } from "@/components/settings/settings-drill";
import { loadProfileLocation } from "@/app/(app)/settings/preferences/location/actions";
import { LOCATION } from "@/lib/location";
import { SETTINGS } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";

// Location drill-in. Back to Preferences. Search selects a place
// and writes profiles.location_city / location_region / location_country.

export default async function SettingsPreferencesLocationPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const location = await loadProfileLocation();
  return (
    <SettingsEditPane
      title={LOCATION.title}
      helper={LOCATION.helper}
      pathname={SETTINGS.locationHref}
      hub="preferences"
    >
      <LocationSearch initial={location} />
    </SettingsEditPane>
  );
}
