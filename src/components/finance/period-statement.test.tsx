import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PeriodStatementView } from "./period-statement";
import { FINANCE_PAGE, formatUsdCents } from "@/lib/finance";
import { buildPeriodStatement } from "@/lib/finance-statement";

describe("PeriodStatementView", () => {
  it("shows source input, remainder keep, itemized recoup, and org rollup", () => {
    const statement = buildPeriodStatement({
      clientRateBp: 8500,
      openingCents: 0,
      thresholdCents: 500,
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
          raw: { endpoint: "avod", external_id: "ext-99" },
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
      adjustmentItems: [],
      staffSaleItems: [],
    });

    const html = renderToStaticMarkup(<PeriodStatementView statement={statement} />);
    expect(html).toContain(FINANCE_PAGE.source);
    expect(html).toContain("avod");
    expect(html).toContain("ext-99");
    expect(html).toContain(formatUsdCents(3000));
    expect(html).toContain(formatUsdCents(2500));
    expect(html).toContain(FINANCE_PAGE.aggregatorKeep);
    expect(html).toContain(formatUsdCents(375));
    expect(html).toContain("Advance");
    expect(html).toContain(FINANCE_PAGE.byTitle);
    expect(html).toContain(FINANCE_PAGE.orgRollup);
    expect(html).toContain(FINANCE_PAGE.thresholdCheck);
    expect(html).toContain(FINANCE_PAGE.payable);
    expect(html).toContain(FINANCE_PAGE.opening);
    expect(html).toContain(FINANCE_PAGE.periodNet);
    expect(html).toContain('data-finance-line="bank-receipt"');
    expect(html).toContain('data-finance-line="client-share"');
    expect(html).toContain('data-finance-line="aggregator-keep"');
    expect(html).toContain('data-finance-line="opening"');
    expect(html).toContain('data-finance-line="period-net"');
    expect(html).toContain('data-finance-line="threshold"');
    expect(html).toContain('data-finance-line="payable"');
    expect(html).not.toContain("aggregator_rate");
  });
});
