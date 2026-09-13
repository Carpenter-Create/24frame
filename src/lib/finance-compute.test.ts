import { describe, expect, it } from "vitest";

import { FINANCE_LOGIC_VERSION } from "./finance";
import { closePeriodDecision, periodNetCents } from "./finance-compute";

describe("periodNetCents", () => {
  it("sums opening, recoup, adjustment, and sale — not payable or closing", () => {
    expect(
      periodNetCents([
        { kind: "opening", amount_cents: 500 },
        { kind: "sale", amount_cents: 1000 },
        { kind: "recoup", amount_cents: -200 },
        { kind: "payable", amount_cents: -1300 },
        { kind: "closing", amount_cents: 0 },
      ]),
    ).toBe(1300);
  });
});

describe("closePeriodDecision", () => {
  it("does not apply a tier-plan or aggregator percent", () => {
    const decision = closePeriodDecision({ netCents: 10_000, thresholdCents: 1000 });
    expect(decision.appliedTierPercent).toBe(false);
    expect(decision.appliedAggregatorPercent).toBe(false);
    expect(decision.logicVersion).toBe(FINANCE_LOGIC_VERSION);
    expect(decision.logicVersion).toContain("no-tier-percent");
    expect(decision.kind).toBe("payable");
    expect(decision.closingBalanceCents).toBe(0);
    expect(decision.zeroingCents).toBe(-10_000);
  });

  it("carries the balance when threshold is unset or unmet", () => {
    expect(closePeriodDecision({ netCents: 800, thresholdCents: null })).toMatchObject({
      kind: "closing",
      closingBalanceCents: 800,
    });
    expect(closePeriodDecision({ netCents: 800, thresholdCents: 1000 })).toMatchObject({
      kind: "closing",
      closingBalanceCents: 800,
    });
  });
});
