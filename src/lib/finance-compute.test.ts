import { describe, expect, it } from "vitest";

import { FINANCE_LOGIC_VERSION } from "./finance";
import {
  aggregatorKeepCents,
  clientShareCents,
  closePeriodDecision,
  periodNetCents,
  statementSlice,
} from "./finance-compute";

describe("client / aggregator complementary split", () => {
  it("derives aggregator keep by subtraction from the bank receipt", () => {
    expect(clientShareCents(10_000, 8500)).toBe(8500);
    expect(aggregatorKeepCents(10_000, 8500)).toBe(1500);
    expect(clientShareCents(10_000, 8500) + aggregatorKeepCents(10_000, 8500)).toBe(10_000);
    expect(clientShareCents(2500, 8500)).toBe(2125);
    expect(aggregatorKeepCents(2500, 8500)).toBe(375);
    expect(clientShareCents(1001, 8500)).toBe(850);
    expect(aggregatorKeepCents(1001, 8500)).toBe(151);
  });

  it("does not invent a second aggregator percent field", () => {
    const slice = statementSlice({
      bankReceiptCents: 10_000,
      clientRateBp: 8000,
      recoupCents: -200,
      adjustmentCents: 0,
      openingCents: 500,
      thresholdCents: 1000,
    });
    expect(slice.clientShareCents).toBe(8000);
    expect(slice.aggregatorKeepCents).toBe(2000);
    expect(slice.netCents).toBe(8300);
    expect(slice.close.kind).toBe("payable");
    expect(slice.close.complementarySplit).toBe(true);
    expect(slice.close.logicVersion).toBe(FINANCE_LOGIC_VERSION);
  });
});

describe("periodNetCents", () => {
  it("sums opening, recoup, adjustment, and sale — not payable or closing", () => {
    expect(
      periodNetCents([
        { kind: "opening", amount_cents: 500 },
        { kind: "sale", amount_cents: 2125 },
        { kind: "recoup", amount_cents: -200 },
        { kind: "payable", amount_cents: -2425 },
        { kind: "closing", amount_cents: 0 },
      ]),
    ).toBe(2425);
  });
});

describe("closePeriodDecision", () => {
  it("pays when net meets a staff-set threshold, otherwise carries", () => {
    expect(closePeriodDecision({ netCents: 10_000, thresholdCents: 1000 })).toMatchObject({
      kind: "payable",
      closingBalanceCents: 0,
      complementarySplit: true,
    });
    expect(closePeriodDecision({ netCents: 800, thresholdCents: null })).toMatchObject({
      kind: "closing",
      closingBalanceCents: 800,
    });
  });
});
