import { AggregationViewAsBanner } from "@/components/aggregation/view-as-banner";
import { getOrgContext } from "@/lib/supabase/context";

// Aggregation-only view-as banner. Lives here so Staff chrome never
// mounts on the client product and Social never sees the session.
export default async function AggregationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getOrgContext();
  return (
    <>
      {ctx?.aggregationViewAs ? (
        <AggregationViewAsBanner orgName={ctx.aggregationViewAs.orgName} />
      ) : null}
      {children}
    </>
  );
}
