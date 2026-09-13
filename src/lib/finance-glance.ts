import {
  FINANCE_CLIENT,
  financePeriodLabel,
  formatClientRateBp,
  formatUsdCents,
} from "@/lib/finance";

// Client home glance. Org purse only — no per-title balances.
// Staff glance stays the Slice 1 stub on /gc/finance.

export type ClientFinancePeriodRow = {
  id: string;
  period_year: number;
  period_month: number;
  status: string;
  opening_balance_cents: number;
  closing_balance_cents: number | null;
  threshold_cents: number | null;
};

export type ClientFinanceGlance = {
  rateLabel: string;
  balanceLabel: string;
  thresholdLabel: string;
  latestLabel: string;
  latestHref: string | null;
};

export function buildClientFinanceGlance(input: {
  clientRateBp: number | null;
  periods: readonly ClientFinancePeriodRow[];
  financeHref: string;
}): ClientFinanceGlance {
  const closed = input.periods.filter((period) => period.status === "closed");
  const latestClosed = closed[0] ?? null;
  const latest = input.periods[0] ?? null;
  const balanceCents =
    latestClosed?.closing_balance_cents ??
    latest?.closing_balance_cents ??
    latest?.opening_balance_cents ??
    null;
  const thresholdCents = latestClosed?.threshold_cents ?? latest?.threshold_cents ?? null;

  return {
    rateLabel: formatClientRateBp(input.clientRateBp),
    balanceLabel: balanceCents === null ? FINANCE_CLIENT.glanceNone : formatUsdCents(balanceCents),
    thresholdLabel:
      thresholdCents === null ? FINANCE_CLIENT.glanceNoThreshold : formatUsdCents(thresholdCents),
    latestLabel: latestClosed
      ? financePeriodLabel(latestClosed.period_year, latestClosed.period_month)
      : FINANCE_CLIENT.glanceNone,
    latestHref: latestClosed ? `${input.financeHref}/${latestClosed.id}` : null,
  };
}
