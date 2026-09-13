import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT, FINANCE_CLIENT_HREF, formatUsdCents } from "./finance";
import { buildClientFinanceGlance } from "./finance-glance";

describe("buildClientFinanceGlance", () => {
  it("uses current client % and the latest closed statement", () => {
    const glance = buildClientFinanceGlance({
      clientRateBp: 8500,
      financeHref: FINANCE_CLIENT_HREF,
      periods: [
        {
          id: "open-1",
          period_year: 2026,
          period_month: 9,
          status: "open",
          opening_balance_cents: 200,
          closing_balance_cents: null,
          threshold_cents: 5000,
        },
        {
          id: "closed-1",
          period_year: 2026,
          period_month: 8,
          status: "closed",
          opening_balance_cents: 0,
          closing_balance_cents: 400,
          threshold_cents: 1000,
        },
      ],
    });

    expect(glance.rateLabel).toBe("85%");
    expect(glance.balanceLabel).toBe(formatUsdCents(400));
    expect(glance.thresholdLabel).toBe(formatUsdCents(1000));
    expect(glance.latestLabel).toBe("2026-08");
    expect(glance.latestHref).toBe(`${FINANCE_CLIENT_HREF}/closed-1`);
  });

  it("stays quiet when no closed period exists", () => {
    const glance = buildClientFinanceGlance({
      clientRateBp: null,
      financeHref: FINANCE_CLIENT_HREF,
      periods: [],
    });
    expect(glance.rateLabel).toBe(FINANCE_CLIENT.glanceNoTerm);
    expect(glance.balanceLabel).toBe(FINANCE_CLIENT.glanceNone);
    expect(glance.thresholdLabel).toBe(FINANCE_CLIENT.glanceNoThreshold);
    expect(glance.latestLabel).toBe(FINANCE_CLIENT.glanceNone);
    expect(glance.latestHref).toBeNull();
  });
});
