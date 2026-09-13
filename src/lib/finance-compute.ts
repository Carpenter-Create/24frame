import { FINANCE_LOGIC_VERSION } from "@/lib/finance";

// Close-period math. ledger_entries are the source of truth.
// OPEN: client tier-plan % vs aggregator % is not locked. This module
// never reads a rate and never applies a percent.

export type CloseKind = "payable" | "closing";

export type CloseDecision = {
  kind: CloseKind;
  netCents: number;
  closingBalanceCents: number;
  zeroingCents: number;
  logicVersion: typeof FINANCE_LOGIC_VERSION;
  appliedTierPercent: false;
  appliedAggregatorPercent: false;
};

export function periodNetCents(
  entries: ReadonlyArray<{ kind: string; amount_cents: number }>,
): number {
  return entries
    .filter((e) => e.kind !== "payable" && e.kind !== "closing")
    .reduce((sum, e) => sum + e.amount_cents, 0);
}

export function closePeriodDecision(input: {
  netCents: number;
  thresholdCents: number | null;
}): CloseDecision {
  const payable = input.thresholdCents !== null && input.netCents >= input.thresholdCents;
  return {
    kind: payable ? "payable" : "closing",
    netCents: input.netCents,
    closingBalanceCents: payable ? 0 : input.netCents,
    zeroingCents: -input.netCents,
    logicVersion: FINANCE_LOGIC_VERSION,
    appliedTierPercent: false,
    appliedAggregatorPercent: false,
  };
}
