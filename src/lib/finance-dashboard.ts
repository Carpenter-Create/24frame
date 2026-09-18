import { periodNetCents } from "@/lib/finance-compute";
import {
  FINANCE_CLIENT,
  FINANCE_CLIENT_HREF,
  financePeriodLabel,
  formatClientRateBp,
  formatUsdCents,
} from "@/lib/finance";
import type { PeriodStatement, TitleStatementSlice } from "@/lib/finance-statement";

// Recipient dashboard model. Reads posted ledger / postedOnly statements.
// periodNetCents sums posted rows. Next does not recompute client share.

export type DashboardPeriodRow = {
  id: string;
  org_id: string;
  period_year: number;
  period_month: number;
  status: "open" | "closed";
  opening_balance_cents: number;
  closing_balance_cents: number | null;
  threshold_cents: number | null;
};

export type DashboardLedgerRow = {
  period_id: string;
  kind: string;
  amount_cents: number;
};

export type DashboardHistoryPoint = {
  id: string;
  label: string;
  status: "open" | "closed";
  href: string;
  openingCents: number;
  closingCents: number | null;
  thresholdCents: number | null;
  netCents: number | null;
  closeKind: "payable" | "closing" | null;
};

export type TitleContribution = {
  titleId: string;
  titleName: string;
  clientShareCents: number;
  shareBp: number;
};

export type SelfBillingInvoice = {
  closeKind: "payable" | "closing" | null;
  amountDueCents: number;
  carryCents: number;
};

export type ThresholdMeter = {
  netCents: number;
  thresholdCents: number | null;
  ratioBp: number | null;
  met: boolean | null;
};

export type ClientFinanceDashboard = {
  rateLabel: string;
  openCount: number;
  closedCount: number;
  latest: {
    periodId: string;
    label: string;
    href: string;
    statement: PeriodStatement;
    invoice: SelfBillingInvoice;
    threshold: ThresholdMeter;
    contributions: TitleContribution[];
  } | null;
  history: DashboardHistoryPoint[];
  chart: Array<{ id: string; label: string; netCents: number }>;
};

export function selfBillingInvoice(
  org: PeriodStatement["org"],
): SelfBillingInvoice {
  if (!org) {
    return { closeKind: null, amountDueCents: 0, carryCents: 0 };
  }
  if (org.close.kind === "payable") {
    return { closeKind: "payable", amountDueCents: org.netCents, carryCents: 0 };
  }
  return {
    closeKind: "closing",
    amountDueCents: 0,
    carryCents: org.close.closingBalanceCents,
  };
}

export function thresholdMeter(
  netCents: number,
  thresholdCents: number | null,
  thresholdMet: boolean | null,
): ThresholdMeter {
  return {
    netCents,
    thresholdCents,
    ratioBp:
      thresholdCents === null || thresholdCents <= 0
        ? null
        : Math.round((netCents / thresholdCents) * 10_000),
    met: thresholdMet,
  };
}

export function titleContributionShares(
  titles: readonly TitleStatementSlice[],
): TitleContribution[] {
  const total = titles.reduce((sum, title) => sum + title.clientShareCents, 0);
  return titles.map((title) => ({
    titleId: title.titleId,
    titleName: title.titleName,
    clientShareCents: title.clientShareCents,
    shareBp: total === 0 ? 0 : Math.round((title.clientShareCents / total) * 10_000),
  }));
}

export function closeKindFromLedger(
  rows: readonly DashboardLedgerRow[],
): "payable" | "closing" | null {
  if (rows.some((row) => row.kind === "payable")) return "payable";
  if (rows.some((row) => row.kind === "closing")) return "closing";
  return null;
}

export function buildClientFinanceDashboard(input: {
  orgId: string;
  clientRateBp: number | null;
  periods: readonly DashboardPeriodRow[];
  ledger: readonly DashboardLedgerRow[];
  latestStatement: PeriodStatement | null;
}): ClientFinanceDashboard {
  const periods = input.periods.filter((period) => period.org_id === input.orgId);
  const byPeriod = new Map<string, DashboardLedgerRow[]>();
  for (const row of input.ledger) {
    const list = byPeriod.get(row.period_id) ?? [];
    list.push(row);
    byPeriod.set(row.period_id, list);
  }

  const history = periods.map((period) => {
    const rows = byPeriod.get(period.id) ?? [];
    const closed = period.status === "closed";
    return {
      id: period.id,
      label: financePeriodLabel(period.period_year, period.period_month),
      status: period.status,
      href: `${FINANCE_CLIENT_HREF}/${period.id}`,
      openingCents: period.opening_balance_cents,
      closingCents: period.closing_balance_cents,
      thresholdCents: period.threshold_cents,
      netCents: closed ? periodNetCents(rows) : null,
      closeKind: closed ? closeKindFromLedger(rows) : null,
    };
  });

  const latestPeriod = periods.find((period) => period.status === "closed") ?? null;
  const latestStatement =
    latestPeriod && input.latestStatement ? input.latestStatement : null;
  const org = latestStatement?.org ?? null;

  return {
    rateLabel: formatClientRateBp(input.clientRateBp),
    openCount: periods.filter((period) => period.status === "open").length,
    closedCount: periods.filter((period) => period.status === "closed").length,
    latest:
      latestPeriod && latestStatement
        ? {
            periodId: latestPeriod.id,
            label: financePeriodLabel(latestPeriod.period_year, latestPeriod.period_month),
            href: `${FINANCE_CLIENT_HREF}/${latestPeriod.id}`,
            statement: latestStatement,
            invoice: selfBillingInvoice(org),
            threshold: thresholdMeter(
              org?.netCents ?? 0,
              org?.thresholdCents ?? latestPeriod.threshold_cents,
              org?.thresholdMet ?? null,
            ),
            contributions: titleContributionShares(latestStatement.titles),
          }
        : null,
    history,
    chart: [...history]
      .filter((point) => point.netCents !== null)
      .reverse()
      .map((point) => ({
        id: point.id,
        label: point.label,
        netCents: point.netCents ?? 0,
      })),
  };
}

export function meterWidthPercent(ratioBp: number | null): number {
  if (ratioBp === null) return 0;
  return Math.min(100, Math.max(0, Math.round(ratioBp / 100)));
}

export function invoiceAmountLabel(invoice: SelfBillingInvoice): string {
  if (invoice.closeKind === "payable") {
    return `${FINANCE_CLIENT.amountDue} ${formatUsdCents(invoice.amountDueCents)}`;
  }
  if (invoice.closeKind === "closing") {
    return `${FINANCE_CLIENT.settlementCarry} ${formatUsdCents(invoice.carryCents)}`;
  }
  return FINANCE_CLIENT.glanceNone;
}
