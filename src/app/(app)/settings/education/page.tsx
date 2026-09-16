import { redirect } from "next/navigation";

import { WorkspaceEmptySettings } from "@/components/settings/workspace-empty-settings";
import { settingsCanAccessSection } from "@/lib/settings";
import { getOrgContext } from "@/lib/supabase/context";
import { availableWorkspaceOptions } from "@/lib/workspace-menu";

export default async function SettingsEducationPage() {
  const lanes = availableWorkspaceOptions().map((option) => option.mode);
  if (!settingsCanAccessSection("education", lanes)) redirect("/settings/you");

  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  return <WorkspaceEmptySettings section="education" isGcStaff={ctx.isGcStaff} />;
}
