import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { HouseEmpty } from "@/components/chrome/house";
import { LIST_PAGE, rangeFor } from "@/lib/list-bounds";
import {
  FINANCE_HREF,
  FINANCE_PAGE,
  financePeriodLabel,
  formatUsdCents,
  staffCanWriteFinance,
} from "@/lib/finance";
import { CreatePeriodForm } from "./finance-forms";

export default async function GcFinancePage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  const [{ data: staff }, { data: periodRows }, { data: orgRows }] = await Promise.all([
    user
      ? supabase.from("gc_staff").select("role").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("finance_periods")
      .select("id, org_id, period_year, period_month, status, opening_balance_cents, organizations(name)")
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false })
      .range(...rangeFor(LIST_PAGE)),
    supabase.from("organizations").select("id, name").order("name").range(...rangeFor(LIST_PAGE)),
  ]);

  const canWrite = staffCanWriteFinance(staff?.role);
  const periods = periodRows ?? [];
  const now = new Date();

  return (
    <>
      <PageHeader title={FINANCE_PAGE.title} subtitle={FINANCE_PAGE.subtitle} />

      {canWrite ? (
        <div className="mb-[var(--space-8)]">
          <CreatePeriodForm
            orgs={(orgRows ?? []).map((org) => ({ id: org.id, name: org.name }))}
            now={{ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }}
          />
        </div>
      ) : (
        <p className="mb-[var(--space-6)] t-body-sm text-ink-3">{FINANCE_PAGE.writeDenied}</p>
      )}

      {periods.length === 0 ? (
        <HouseEmpty>{FINANCE_PAGE.empty}</HouseEmpty>
      ) : (
        <div className="flex flex-col gap-3">
          {periods.map((period) => {
            const orgName = Array.isArray(period.organizations)
              ? period.organizations[0]?.name
              : period.organizations?.name;
            return (
              <Link key={period.id} href={`${FINANCE_HREF}/${period.id}`} className="block">
                <Card className="transition-colors hover:border-accent">
                  <CardBody className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="t-body font-medium text-ink">
                        {financePeriodLabel(period.period_year, period.period_month)}
                      </span>
                      <span className="t-body-sm text-ink-3">
                        {orgName ?? "—"} · {FINANCE_PAGE.opening}{" "}
                        {formatUsdCents(period.opening_balance_cents)}
                      </span>
                    </div>
                    <span className="t-label text-ink-2">
                      {period.status === "closed" ? FINANCE_PAGE.statusClosed : FINANCE_PAGE.statusOpen}
                    </span>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
