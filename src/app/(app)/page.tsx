import { redirect } from "next/navigation";

import { workspaceHome } from "@/lib/workspace";

// Signed-in default land is Aggregation home. Not a leftover flat-path hop.
export default function AggregationRootPage() {
  redirect(workspaceHome("aggregation"));
}
