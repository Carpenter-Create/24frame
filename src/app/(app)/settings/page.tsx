import { redirect } from "next/navigation";

import { SettingsHubList } from "@/components/chrome/settings-hub-list";
import { YouSettings } from "@/components/settings/you-settings";
import { settingsPathFromQuery } from "@/lib/settings";

// Settings hub. Query ?section= redirects to the path contract.
// Desktop: You pane (rail sits in the Access slot). Mobile: list → push.
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.section) ? sp.section[0] : sp.section;
  const land = settingsPathFromQuery(raw);
  if (land) redirect(land);

  return (
    <>
      <SettingsHubList className="md:hidden" />
      <div className="hidden md:block">
        <YouSettings />
      </div>
    </>
  );
}
