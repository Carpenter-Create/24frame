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
  suspenseLineSummary,
} from "@/lib/finance";
import { AssignSuspenseForm, CreatePeriodForm } from "./finance-forms";

export default async function GcFinancePage() {
  const supabase = await createClient();
  const user = await getAuthUser();
  const [{ data: staff }, { data: periodRows }, { data: orgRows }, { data: suspenseRows }] =
    await Promise.all([
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
      supabase
        .from("sales_lines")
        .select(
          "id, org_id, endpoint, external_id, bank_receipt_cents, reported_cents, transaction_date, origin_period_id, sales_imports(filename, imported_at), organizations(name), origin_period:finance_periods!origin_period_id(period_year, period_month)",
        )
        .is("period_id", null)
        .order("created_at", { ascending: false })
        .range(...rangeFor(LIST_PAGE)),
    ]);

  const canWrite = staffCanWriteFinance(staff?.role);
  const periods = periodRows ?? [];
  const originById = new Map(
    periods.map((period) => [period.id, financePeriodLabel(period.period_year, period.period_month)]),
  );
  const openPeriods = periods
    .filter((period) => period.status === "open")
    .map((period) => ({
      id: period.id,
      org_id: period.org_id,
      status: "open" as const,
      label: `${financePeriodLabel(period.period_year, period.period_month)} · ${
        (Array.isArray(period.organizations) ? period.organizations[0]?.name : period.organizations?.name) ??
        "—"
      }`,
    }));
  const suspenseByOrg = new Map<string, NonNullable<typeof suspenseRows>>();
  for (const line of suspenseRows ?? []) {
    const list = suspenseByOrg.get(line.org_id) ?? [];
    list.push(line);
    suspenseByOrg.set(line.org_id, list);
  }
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

      {canWrite ? (
        <section data-finance-suspense="" className="mb-[var(--space-8)] flex flex-col gap-3">
          <h2 className="t-body font-medium text-ink">{FINANCE_PAGE.suspense}</h2>
          <p className="t-body-sm text-ink-3">{FINANCE_PAGE.suspenseHint}</p>
          {suspenseByOrg.size === 0 ? (
            <p className="t-body-sm text-ink-3">{FINANCE_PAGE.suspenseEmpty}</p>
          ) : (
            [...suspenseByOrg.entries()].map(([orgId, lines]) => {
              const orgName = Array.isArray(lines[0]?.organizations)
                ? lines[0]?.organizations[0]?.name
                : lines[0]?.organizations?.name;
              return (
                <div key={orgId} className="flex flex-col gap-3">
                  <h3 className="t-body-sm text-ink-2">{orgName ?? orgId}</h3>
                  <AssignSuspenseForm
                    lines={lines.map((line) => {
                      const origin = Array.isArray(line.origin_period)
                        ? line.origin_period[0]
                        : line.origin_period;
                      const imp = Array.isArray(line.sales_imports)
                        ? line.sales_imports[0]
                        : line.sales_imports;
                      return {
                        id: line.id,
                        org_id: line.org_id,
                        summary: suspenseLineSummary({
                          endpoint: line.endpoint,
                          externalId: line.external_id,
                          bankReceiptCents: line.bank_receipt_cents,
                          reportedCents: line.reported_cents,
                          filename: imp?.filename ?? null,
                          originLabel: origin
                            ? financePeriodLabel(origin.period_year, origin.period_month)
                            : (originById.get(line.origin_period_id ?? "") ?? null),
                          transactionDate: line.transaction_date,
                          importedAt: imp?.imported_at ?? null,
                        }),
                      };
                    })}
                    openPeriods={openPeriods}
                  />
                </div>
              );
            })
          )}
        </section>
      ) : null}

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
