import { describe, expect, it } from "vitest";

import { FINANCE_LOGIC_VERSION } from "./finance";
import {
  exportContainsRequiredMath,
  exportContainsRequiredSourceFields,
  exportStatement,
  statementCsv,
  statementPdf,
} from "./finance-export";
import {
  STATEMENT_OUTPUT_FORMAT,
  buildPeriodStatement,
  toStatementOutput,
  type StatementSourceLine,
} from "./finance-statement";

function line(
  partial: Partial<StatementSourceLine> & Pick<StatementSourceLine, "id">,
): StatementSourceLine {
  return {
    importId: "imp-1",
    importFilename: "aug.csv",
    importContentHash: "abc123",
    lineNo: 1,
    endpoint: "avod",
    externalId: "ext-99",
    titleId: "title-a",
    titleName: "Title A",
    bankReceiptCents: 2500,
    reportedCents: 3000,
    transactionDate: "2026-08-01",
    raw: { endpoint: "avod", external_id: "ext-99" },
    ...partial,
  };
}

function closedStatement() {
  return buildPeriodStatement({
    clientRateBp: 8500,
    openingCents: 500,
    thresholdCents: 1000,
    sourceLines: [line({ id: "l1" })],
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
}

const meta = {
  orgName: "Acme Pictures",
  periodYear: 2026,
  periodMonth: 8,
  status: "closed" as const,
};

describe("statement export", () => {
  it("CSV keeps transparent math and endpoint source fields", () => {
    const statement = closedStatement();
    const output = toStatementOutput(statement);
    const csv = statementCsv(output, meta);

    expect(output.format).toBe(STATEMENT_OUTPUT_FORMAT);
    expect(csv).toContain("24frame-statement-v1");
    expect(csv).toContain(FINANCE_LOGIC_VERSION);
    expect(csv).toContain("Acme Pictures");
    expect(csv).toContain("2026-08");
    expect(csv).toContain("USD");
    expect(exportContainsRequiredMath(csv)).toBe(true);
    expect(exportContainsRequiredSourceFields(csv)).toBe(true);
    expect(csv).toContain("avod");
    expect(csv).toContain("ext-99");
    expect(csv).toContain("3000");
    expect(csv).toContain("2500");
    expect(csv).toContain("aug.csv");
    expect(csv).toContain("abc123");
    expect(csv).toContain("2125");
    expect(csv).toContain("375");
    expect(csv).toContain("-150");
    expect(csv).toContain("payable");
    expect(csv).not.toContain("aggregator_rate");
  });

  it("PDF keeps transparent math and endpoint source fields", () => {
    const statement = closedStatement();
    const output = toStatementOutput(statement);
    const pdf = new TextDecoder().decode(statementPdf(output, meta));

    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("24Frame");
    expect(pdf).toContain("Global Content Holdings LLC");
    expect(pdf).toContain("24frame-statement-v1");
    expect(pdf).toContain(FINANCE_LOGIC_VERSION);
    expect(exportContainsRequiredMath(pdf)).toBe(true);
    expect(exportContainsRequiredSourceFields(pdf)).toBe(true);
    expect(pdf).toContain("avod");
    expect(pdf).toContain("ext-99");
    expect(pdf).toContain("$30.00");
    expect(pdf).toContain("$25.00");
    expect(pdf).toContain("Aggregator keep");
    expect(pdf).toContain("payable");
  });

  it("exportStatement emits CSV and PDF from the Slice 1 payload", () => {
    const statement = closedStatement();
    const csv = exportStatement(statement, meta, "csv");
    const pdf = exportStatement(statement, meta, "pdf");
    expect(csv.contentType).toContain("text/csv");
    expect(pdf.contentType).toBe("application/pdf");
    expect(csv.filename).toContain("2026-08");
    expect(pdf.filename).toContain(".pdf");
    expect(exportContainsRequiredMath(new TextDecoder().decode(csv.body))).toBe(true);
    expect(exportContainsRequiredSourceFields(new TextDecoder().decode(pdf.body))).toBe(true);
  });
});
