import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/supabase/context";
import { PageHeader } from "@/components/ui/page-header";
import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { ClientPeriodDashboard } from "@/components/finance/client-period-dashboard";
import {
  FINANCE_CLIENT,
  FINANCE_CLIENT_HREF,
  FINANCE_PAGE,
  financeExportHref,
  financePeriodLabel,
  canViewClientEarn,
} from "@/lib/finance";
import { FINANCE_DOWNLOAD_CLASS } from "@/lib/finance-craft";
import { loadRecipientPeriod, loadRecipientStatement } from "@/lib/finance-recipient-load";

export default async function ClientFinancePeriodPage({
  params,
}: {
  params: Promise<{ periodId: string }>;
}) {
  const { periodId } = await params;
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (!ctx.activeOrg || !canViewClientEarn({ isGcStaff: ctx.isGcStaff, role: ctx.activeRole })) {
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
          <div
            data-finance-download=""
            className="flex flex-col items-end gap-[var(--space-2)]"
          >
            <p className="t-label text-ink-3">{FINANCE_CLIENT.pack}</p>
            <div className="flex flex-wrap items-center justify-end gap-[var(--space-4)]">
              <a
                href={financeExportHref(period.id, "pdf")}
                aria-label={FINANCE_CLIENT.pdf}
                className={FINANCE_DOWNLOAD_CLASS}
              >
                {FINANCE_CLIENT.download}
              </a>
              <TextAction href={financeExportHref(period.id, "csv")}>{FINANCE_CLIENT.csv}</TextAction>
            </div>
          </div>
        }
      />
      <ClientPeriodDashboard
        statement={statement}
        orgName={ctx.activeOrg.name}
        periodLabel={title}
        status="closed"
      />
    </>
  );
}
