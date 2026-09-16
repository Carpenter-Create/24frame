import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/supabase/context";
import { PageHeader } from "@/components/ui/page-header";
import { HouseEmpty } from "@/components/chrome/house";
import { ANALYTICS_PAGE } from "@/lib/analytics";

// Named Analytics place. Not ledger, not Catalog Health, not Earn.
export default async function AnalyticsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  return (
    <>
      <PageHeader title={ANALYTICS_PAGE.title} subtitle={ANALYTICS_PAGE.subtitle} />
      <HouseEmpty>{ANALYTICS_PAGE.empty}</HouseEmpty>
    </>
  );
}
