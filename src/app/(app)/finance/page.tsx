import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/supabase/context";
import { PageHeader } from "@/components/ui/page-header";
import { HouseEmpty } from "@/components/chrome/house";
import { ClientFinanceDashboardView } from "@/components/finance/client-finance-dashboard";
import { FINANCE_CLIENT, orgRoleCanViewFinancial } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { loadRecipientDashboard } from "@/lib/finance-recipient-load";

export default async function ClientFinancePage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrg) {
    return (
      <>
        <PageHeader title={FINANCE_CLIENT.title} subtitle={FINANCE_CLIENT.subtitle} />
        <HouseEmpty>{FINANCE_CLIENT.noOrg}</HouseEmpty>
      </>
    );
  }
  if (!orgRoleCanViewFinancial(ctx.activeRole)) {
    return (
      <>
        <PageHeader title={FINANCE_CLIENT.title} subtitle={FINANCE_CLIENT.subtitle} />
        <HouseEmpty>{FINANCE_CLIENT.noAccess}</HouseEmpty>
      </>
    );
  }

  const loaded = await loadRecipientDashboard(ctx.activeOrg.id);
  const dashboard = buildClientFinanceDashboard({
    orgId: ctx.activeOrg.id,
    clientRateBp: loaded.clientRateBp,
    periods: loaded.periods,
    ledger: loaded.ledger,
    latestStatement: loaded.latestStatement,
  });

  return (
    <>
      <PageHeader title={FINANCE_CLIENT.title} subtitle={FINANCE_CLIENT.subtitle} />
      <ClientFinanceDashboardView dashboard={dashboard} />
    </>
  );
}
