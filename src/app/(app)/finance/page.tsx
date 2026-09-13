import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getOrgContext } from "@/lib/supabase/context";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { HouseEmpty } from "@/components/chrome/house";
import { LIST_PAGE, rangeFor } from "@/lib/list-bounds";
import {
  FINANCE_CLIENT,
  FINANCE_CLIENT_HREF,
  FINANCE_PAGE,
  financePeriodLabel,
  formatUsdCents,
  orgRoleCanViewFinancial,
} from "@/lib/finance";

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

  const supabase = await createClient();
  const { data: periodRows } = await supabase
    .from("finance_periods")
    .select("id, org_id, period_year, period_month, status, opening_balance_cents, closing_balance_cents")
    .eq("org_id", ctx.activeOrg.id)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false })
    .range(...rangeFor(LIST_PAGE));

  const periods = (periodRows ?? []).filter((period) => period.org_id === ctx.activeOrg?.id);

  return (
    <>
      <PageHeader title={FINANCE_CLIENT.title} subtitle={FINANCE_CLIENT.subtitle} />

      {periods.length === 0 ? (
        <HouseEmpty>{FINANCE_CLIENT.empty}</HouseEmpty>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map((period) => (
            <Link key={period.id} href={`${FINANCE_CLIENT_HREF}/${period.id}`} className="block">
              <Card className="transition-colors hover:border-accent">
                <CardBody className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="t-body font-medium text-ink">
                      {financePeriodLabel(period.period_year, period.period_month)}
                    </span>
                    <span className="t-body-sm text-ink-3">
                      {FINANCE_PAGE.opening} {formatUsdCents(period.opening_balance_cents)}
                    </span>
                  </div>
                  <span className="t-label text-ink-2">
                    {period.status === "closed" ? FINANCE_PAGE.statusClosed : FINANCE_PAGE.statusOpen}
                  </span>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
