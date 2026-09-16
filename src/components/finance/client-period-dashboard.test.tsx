import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FINANCE_CLIENT, FINANCE_PAGE, formatUsdCents } from "@/lib/finance";
import { buildPeriodStatement } from "@/lib/finance-statement";

import { ClientPeriodDashboard } from "./client-period-dashboard";

describe("ClientPeriodDashboard", () => {
  it("reads as a statement document with white header, source table, and one close outcome", () => {
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
      adjustmentItems: [],
      staffSaleItems: [],
    });
    const html = renderToStaticMarkup(
      <ClientPeriodDashboard
        statement={statement}
        orgName="Acme"
        periodLabel="2026-08"
        status="closed"
      />,
    );
    expect(html).toContain("data-finance-statement-doc");
    expect(html).toContain("data-finance-statement-header");
    expect(html).toContain("Acme");
    expect(html).toContain("2026-08");
    expect(html).toContain("85%");
    expect(html).toContain("data-finance-status-pill");
    expect(html).toContain(FINANCE_PAGE.statusClosed);
    expect(html).toContain("data-finance-close-outcome");
    expect(html).toContain(FINANCE_CLIENT.amountDue);
    expect(html).toContain("data-finance-close-kind");
    expect(html).toContain(FINANCE_PAGE.payable);
    expect(html).toContain("data-finance-source");
    expect(html).toContain("avod");
    expect(html).toContain("Title A");
    expect(html).toContain(formatUsdCents(2500));
    expect(html).toContain("t-data");
    expect(html).not.toContain("bg-band");
  });
});
