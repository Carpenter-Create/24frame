import { FINANCE_LOGIC_VERSION } from "@/lib/finance";

// Locked compute (CoS / Adam 2026-09-13).
// Gross = bank-receipt cents. Client share = contract_terms.revenue_share_rate_bp
// of that receipt. Aggregator keep = remainder. Then recoup/adjustments.
// Do not invent a second independent aggregator % field.

export type CloseKind = "payable" | "closing";

export type CloseDecision = {
  kind: CloseKind;
  netCents: number;
  closingBalanceCents: number;
  zeroingCents: number;
  logicVersion: typeof FINANCE_LOGIC_VERSION;
  complementarySplit: true;
};

export function clientShareCents(bankReceiptCents: number, clientRateBp: number): number {
  return Math.trunc((bankReceiptCents * clientRateBp) / 10000);
}

export function aggregatorKeepCents(bankReceiptCents: number, clientRateBp: number): number {
  return bankReceiptCents - clientShareCents(bankReceiptCents, clientRateBp);
}

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
    complementarySplit: true,
  };
}

export type StatementSlice = {
  bankReceiptCents: number;
  clientRateBp: number;
  clientShareCents: number;
  aggregatorKeepCents: number;
  recoupCents: number;
  adjustmentCents: number;
  openingCents: number;
  netCents: number;
  thresholdCents: number | null;
  close: CloseDecision;
};

export function statementSlice(input: {
  bankReceiptCents: number;
  clientRateBp: number;
  recoupCents: number;
  adjustmentCents: number;
  openingCents: number;
  thresholdCents: number | null;
}): StatementSlice {
  const client = clientShareCents(input.bankReceiptCents, input.clientRateBp);
  const keep = aggregatorKeepCents(input.bankReceiptCents, input.clientRateBp);
  const netCents = input.openingCents + client + input.recoupCents + input.adjustmentCents;
  return {
    bankReceiptCents: input.bankReceiptCents,
    clientRateBp: input.clientRateBp,
    clientShareCents: client,
    aggregatorKeepCents: keep,
    recoupCents: input.recoupCents,
    adjustmentCents: input.adjustmentCents,
    openingCents: input.openingCents,
    netCents,
    thresholdCents: input.thresholdCents,
    close: closePeriodDecision({ netCents, thresholdCents: input.thresholdCents }),
  };
}
