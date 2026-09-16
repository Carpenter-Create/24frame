import { redirect } from "next/navigation";

import { AggregationSettings } from "@/components/settings/aggregation-settings";
import { settingsCanAccessSection } from "@/lib/settings";
import { availableWorkspaceOptions } from "@/lib/workspace-menu";

export default async function SettingsAggregationPage() {
  const lanes = availableWorkspaceOptions().map((option) => option.mode);
  if (!settingsCanAccessSection("aggregation", lanes)) redirect("/settings/you");
  return AggregationSettings();
}
