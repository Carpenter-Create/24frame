import { Suspense } from "react";

import { AggregationViewAsBanner } from "@/components/aggregation/view-as-banner";
import { getOrgContext } from "@/lib/supabase/context";

// Sync segment. Awaiting getOrgContext here blocked child loading.tsx
// the same way the app layout used to block Social hops. The view-as
// banner streams in its own boundary so the page slot can paint.
export default function AggregationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AggregationViewAsSlot />
      </Suspense>
      {children}
    </>
  );
}

export async function AggregationViewAsSlot() {
  const ctx = await getOrgContext();
  if (!ctx?.aggregationViewAs) return null;
  return <AggregationViewAsBanner orgName={ctx.aggregationViewAs.orgName} />;
}
