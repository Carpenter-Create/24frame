import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT, FINANCE_CLIENT_HREF, formatUsdCents } from "./finance";
import { periodNetCents } from "./finance-compute";
import {
  buildClientFinanceDashboard,
  meterWidthPercent,
  selfBillingInvoice,
  thresholdMeter,
  titleContributionShares,
} from "./finance-dashboard";
import { buildPeriodStatement } from "./finance-statement";

const statement = buildPeriodStatement({
  clientRateBp: 8500,
  openingCents: 0,
  thresholdCents: 1000,
  sourceLines: [
    {
      id: "l1",
      importId: "imp-1",
      importFilename: "aug.csv",
      importContentHash: "abc",
      lineNo: 1,
      endpoint: "avod",
      externalId: "ext-99",
      titleId: "title-a",
      titleName: "Title A",
      bankReceiptCents: 2500,
      reportedCents: 3000,
      transactionDate: null,
      raw: {},
    },
  ],
  recoupItems: [
    {
      id: "r1",
      kind: "recoup",
      amountCents: -150,
      titleId: "title-a",
      titleName: "Title A",
      note: "Advance",
    },
  ],
  adjustmentItems: [
    {
      id: "a1",
      kind: "adjustment",
      amountCents: 25,
      titleId: null,
      titleName: null,
      note: "Correction",
    },
  ],
  staffSaleItems: [],
});

describe("client finance dashboard model", () => {
  it("uses the same net as period math and drops Client B periods", () => {
    const ledger = [
      { period_id: "p-a", kind: "sale", amount_cents: 2125 },
      { period_id: "p-a", kind: "recoup", amount_cents: -150 },
      { period_id: "p-a", kind: "adjustment", amount_cents: 25 },
      { period_id: "p-a", kind: "payable", amount_cents: -2000 },
    ];
    const dashboard = buildClientFinanceDashboard({
      orgId: "org-a",
      clientRateBp: 8500,
      latestStatement: statement,
      ledger: [...ledger, { period_id: "p-b", kind: "sale", amount_cents: 99_99 }],
      periods: [
        {
          id: "p-open",
          org_id: "org-a",
          period_year: 2026,
          period_month: 9,
          status: "open",
          opening_balance_cents: 0,
          closing_balance_cents: null,
          threshold_cents: 1000,
        },
        {
          id: "p-a",
          org_id: "org-a",
          period_year: 2026,
          period_month: 8,
          status: "closed",
          opening_balance_cents: 0,
          closing_balance_cents: 0,
          threshold_cents: 1000,
        },
        {
          id: "p-b",
          org_id: "org-b",
          period_year: 2026,
          period_month: 8,
          status: "closed",
          opening_balance_cents: 0,
          closing_balance_cents: 9999,
          threshold_cents: 1000,
        },
      ],
    });

    expect(dashboard.history.map((period) => period.id)).toEqual(["p-open", "p-a"]);
    expect(dashboard.latest?.periodId).toBe("p-a");
    expect(dashboard.latest?.href).toBe(`${FINANCE_CLIENT_HREF}/p-a`);
    expect(dashboard.history.find((period) => period.id === "p-a")?.netCents).toBe(
      periodNetCents(ledger),
    );
    expect(dashboard.latest?.statement.org?.netCents).toBe(statement.org?.netCents);
    expect(dashboard.latest?.invoice.amountDueCents).toBe(statement.org?.netCents);
    expect(dashboard.rateLabel).toBe("85%");
    expect(dashboard.chart.map((point) => point.id)).toEqual(["p-a"]);
  });

  it("documents payable due and carry-forward without inventing a second compute", () => {
    expect(selfBillingInvoice(statement.org)).toEqual({
      closeKind: "payable",
      amountDueCents: statement.org?.netCents,
      carryCents: 0,
    });
    const carry = buildPeriodStatement({
      clientRateBp: 8500,
      openingCents: 0,
      thresholdCents: 10_000,
      sourceLines: [
        {
          id: "l2",
          importId: "imp-1",
          importFilename: "aug.csv",
          importContentHash: "abc",
          lineNo: 1,
          endpoint: "avod",
          externalId: "ext-1",
          titleId: "title-a",
          titleName: "Title A",
          bankReceiptCents: 2500,
          reportedCents: null,
          transactionDate: null,
          raw: {},
        },
      ],
      recoupItems: [],
      adjustmentItems: [],
      staffSaleItems: [],
    });
    expect(selfBillingInvoice(carry.org)).toEqual({
      closeKind: "closing",
      amountDueCents: 0,
      carryCents: carry.org?.close.closingBalanceCents,
    });
    expect(titleContributionShares(statement.titles)[0]?.shareBp).toBe(10_000);
    expect(thresholdMeter(2000, 1000, true).ratioBp).toBe(20_000);
    expect(meterWidthPercent(20_000)).toBe(100);
    expect(formatUsdCents(statement.org?.recoupCents ?? 0)).toBe(formatUsdCents(-150));
  });

  it("stays quiet when there is no closed statement", () => {
    const dashboard = buildClientFinanceDashboard({
      orgId: "org-a",
      clientRateBp: null,
      periods: [],
      ledger: [],
      latestStatement: null,
    });
    expect(dashboard.latest).toBeNull();
    expect(dashboard.rateLabel).toBe(FINANCE_CLIENT.glanceNoTerm);
    expect(dashboard.chart).toEqual([]);
  });
});
