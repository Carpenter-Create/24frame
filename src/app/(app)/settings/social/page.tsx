import { redirect } from "next/navigation";

import { WorkspaceEmptySettings } from "@/components/settings/workspace-empty-settings";
import { settingsCanAccessSection } from "@/lib/settings";
import { availableWorkspaceOptions } from "@/lib/workspace-menu";

export default function SettingsSocialPage() {
  const lanes = availableWorkspaceOptions().map((option) => option.mode);
  if (!settingsCanAccessSection("social", lanes)) redirect("/settings/you");
  return <WorkspaceEmptySettings section="social" />;
}
