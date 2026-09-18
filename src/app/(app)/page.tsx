import { redirect } from "next/navigation";

// Aggregation land is Dashboard. Bookmarks and leftover `/` hops follow.
export default function AggregationRootPage() {
  redirect("/dashboard");
}
