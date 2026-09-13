import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/supabase/context";
import { PageHeader } from "@/components/ui/page-header";
import { HouseEmpty } from "@/components/chrome/house";
import { PeriodStatementView } from "@/components/finance/period-statement";
import {
  FINANCE_CLIENT,
  FINANCE_CLIENT_HREF,
  FINANCE_PAGE,
  financeExportHref,
  financePeriodLabel,
  formatUsdCents,
  orgRoleCanViewFinancial,
} from "@/lib/finance";
import { loadRecipientPeriod, loadRecipientStatement } from "@/lib/finance-recipient-load";

export default async function ClientFinancePeriodPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrg || !orgRoleCanViewFinancial(ctx.activeRole)) {
    return (
      <>
        <PageHeader
          title={FINANCE_CLIENT.title}
          subtitle={FINANCE_CLIENT.subtitle}
          backLink={{ href: FINANCE_CLIENT_HREF, label: FINANCE_CLIENT.title }}
        />
        <HouseEmpty>
          {ctx.activeOrg ? FINANCE_CLIENT.noAccess : FINANCE_CLIENT.noOrg}
        </HouseEmpty>
      </>
    );
  }

  const period = await loadRecipientPeriod(periodId, ctx.activeOrg.id);
  const title = financePeriodLabel(period.period_year, period.period_month);
  const closed = period.status === "closed";

  if (!closed) {
    return (
      <>
        <PageHeader
          title={title}
          subtitle={FINANCE_PAGE.statusOpen}
          backLink={{ href: FINANCE_CLIENT_HREF, label: FINANCE_CLIENT.title }}
        />
        <HouseEmpty>{FINANCE_CLIENT.notYet}</HouseEmpty>
      </>
    );
  }

  const statement = await loadRecipientStatement(period, ctx.activeOrg.id);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={`${FINANCE_PAGE.statusClosed} · ${FINANCE_PAGE.usd}`}
        backLink={{ href: FINANCE_CLIENT_HREF, label: FINANCE_CLIENT.title }}
        actions={
          <div className="flex flex-col items-end gap-2">
            <a href={financeExportHref(period.id, "pdf")} className="t-body-sm font-normal text-accent">
              {FINANCE_CLIENT.pdf}
            </a>
            <a href={financeExportHref(period.id, "csv")} className="t-body-sm font-normal text-accent">
              {FINANCE_CLIENT.csv}
            </a>
          </div>
        }
      />

      <div className="mb-[var(--space-6)] flex flex-wrap gap-x-6 gap-y-2 t-body-sm text-ink-2">
        <span>
          {FINANCE_PAGE.opening} {formatUsdCents(period.opening_balance_cents)}
        </span>
        {period.closing_balance_cents !== null ? (
          <span>
            {FINANCE_PAGE.closing} {formatUsdCents(period.closing_balance_cents)}
          </span>
        ) : null}
        <span>
          {FINANCE_PAGE.threshold}{" "}
          {period.threshold_cents === null ? FINANCE_CLIENT.glanceNoThreshold : formatUsdCents(period.threshold_cents)}
        </span>
      </div>

      <PeriodStatementView statement={statement} />
    </>
  );
}
