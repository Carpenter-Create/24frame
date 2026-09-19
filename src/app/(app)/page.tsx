import { redirect } from "next/navigation";

import { workspaceHome } from "@/lib/workspace";

// Aggregation land is Dashboard under /aggregation. Bookmarks and leftover `/` hops follow.
export default function AggregationRootPage() {
  redirect(workspaceHome("aggregation"));
}
