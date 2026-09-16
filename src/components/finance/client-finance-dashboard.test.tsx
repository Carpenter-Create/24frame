import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT, FINANCE_PAGE, formatUsdCents } from "@/lib/finance";
import { buildClientFinanceDashboard } from "@/lib/finance-dashboard";
import { buildPeriodStatement } from "@/lib/finance-statement";

import { ClientFinanceDashboardView } from "./client-finance-dashboard";

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
  recoupItems: [],
  adjustmentItems: [],
  staffSaleItems: [],
});

describe("ClientFinanceDashboardView", () => {
  it("uses a white hairline hero, contract strip, thicker meter, chart, and history cards", () => {
    const dashboard = buildClientFinanceDashboard({
      orgId: "org-a",
      clientRateBp: 8500,
      latestStatement: statement,
      ledger: [
        { period_id: "p-a", kind: "sale", amount_cents: 2125 },
        { period_id: "p-a", kind: "payable", amount_cents: -2125 },
      ],
      periods: [
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
      ],
    });
    const html = renderToStaticMarkup(<ClientFinanceDashboardView dashboard={dashboard} />);
    expect(html).toContain("data-finance-hero");
    expect(html).toContain("border-hairline");
    expect(html).toContain("bg-surface");
    expect(html).not.toContain("bg-band");
    expect(html).toContain("data-finance-contract-strip");
    expect(html).toContain(FINANCE_CLIENT.overview);
    expect(html).toContain(FINANCE_PAGE.aggregatorKeep);
    expect(html).toContain(FINANCE_CLIENT.recoupVisible);
    expect(html).toContain("data-finance-threshold-meter");
    expect(html).toContain("h-2");
    expect(html).toContain("data-finance-contribution");
    expect(html).toContain("Title A");
    expect(html).toContain("data-finance-history-chart");
    expect(html).toContain("148");
    expect(html).toContain("data-finance-history-card=\"p-a\"");
    expect(html).toContain("data-finance-status-pill");
    expect(html).toContain("data-finance-history-chevron");
    expect(html).toContain(formatUsdCents(statement.org?.netCents ?? 0));
    expect(html).toContain("t-data");
    expect(html).toContain("hover:border-accent");
    expect(html).not.toContain("$99.99");
  });

  it("uses the house empty line when there is no history", () => {
    const dashboard = buildClientFinanceDashboard({
      orgId: "org-a",
      clientRateBp: null,
      periods: [],
      ledger: [],
      latestStatement: null,
    });
    const html = renderToStaticMarkup(<ClientFinanceDashboardView dashboard={dashboard} />);
    expect(html).toContain(FINANCE_CLIENT.empty);
    expect(html).toContain("data-house-empty");
    expect(html).not.toContain("data-finance-hero");
  });
});
