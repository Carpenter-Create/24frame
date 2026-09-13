import { describe, expect, it } from "vitest";

import { FINANCE_LOGIC_VERSION } from "./finance";
import { aggregatorKeepCents, clientShareCents } from "./finance-compute";
import { buildPeriodStatement, type StatementSourceLine } from "./finance-statement";

function line(partial: Partial<StatementSourceLine> & Pick<StatementSourceLine, "id">): StatementSourceLine {
  return {
    importId: "imp-1",
    importFilename: "aug.csv",
    lineNo: 1,
    endpoint: "avod",
    externalId: "ext-1",
    titleId: "title-a",
    titleName: "Title A",
    bankReceiptCents: 1000,
    reportedCents: null,
    ...partial,
  };
}

describe("buildPeriodStatement", () => {
  it("applies client % per bank-receipt line and rolls title into org", () => {
    const statement = buildPeriodStatement({
      clientRateBp: 8500,
      openingCents: 500,
      thresholdCents: 1000,
      sourceLines: [
        line({ id: "l1", bankReceiptCents: 1001, reportedCents: 1200, externalId: "a-1" }),
        line({
          id: "l2",
          lineNo: 2,
          titleId: "title-b",
          titleName: "Title B",
          bankReceiptCents: 1001,
          externalId: "b-1",
        }),
        line({
          id: "l3",
          lineNo: 3,
          titleId: null,
          titleName: null,
          bankReceiptCents: 400,
          externalId: "unmapped",
        }),
      ],
      recoupItems: [
        {
          id: "r1",
          kind: "recoup",
          amountCents: -200,
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

    expect(statement.complementarySplit).toBe(true);
    expect(statement.logicVersion).toBe(FINANCE_LOGIC_VERSION);
    expect(statement.sourceLines).toHaveLength(3);
    expect(statement.sourceLines[0]).toMatchObject({
      endpoint: "avod",
      externalId: "a-1",
      reportedCents: 1200,
      bankReceiptCents: 1001,
      importFilename: "aug.csv",
    });
    expect(statement.unmappedLines).toHaveLength(1);
    expect(statement.unmappedLines[0]?.externalId).toBe("unmapped");

    const titleA = statement.titles.find((t) => t.titleId === "title-a");
    expect(titleA?.clientShareCents).toBe(clientShareCents(1001, 8500));
    expect(titleA?.aggregatorKeepCents).toBe(aggregatorKeepCents(1001, 8500));
    expect(titleA?.recoupItems).toHaveLength(1);
    expect(titleA?.recoupItems[0]?.note).toBe("Advance");

    // Per-line remainder, not a second % applied to the title or org total.
    expect(statement.org?.clientShareCents).toBe(850 + 850);
    expect(statement.org?.aggregatorKeepCents).toBe(151 + 151);
    expect(statement.org?.clientShareCents).not.toBe(clientShareCents(2002, 8500));
    expect(statement.org?.bankReceiptCents).toBe(2402);
    expect(statement.org?.mappedBankReceiptCents).toBe(2002);
    expect(statement.org?.unmappedBankReceiptCents).toBe(400);
    expect(statement.org?.netCents).toBe(500 + 1700 - 200 + 25);
    expect(statement.org?.close.kind).toBe("payable");
  });

  it("does not invent client share when no contract term is present", () => {
    const statement = buildPeriodStatement({
      clientRateBp: null,
      openingCents: 0,
      thresholdCents: null,
      sourceLines: [line({ id: "l1", bankReceiptCents: 2500 })],
      recoupItems: [],
      adjustmentItems: [],
      staffSaleItems: [],
    });
    expect(statement.titles).toEqual([]);
    expect(statement.org).toBeNull();
    expect(statement.sourceLines[0]?.bankReceiptCents).toBe(2500);
  });

  it("carries forward when net is under the staff threshold", () => {
    const statement = buildPeriodStatement({
      clientRateBp: 8500,
      openingCents: 0,
      thresholdCents: 10_000,
      sourceLines: [line({ id: "l1", bankReceiptCents: 1000 })],
      recoupItems: [],
      adjustmentItems: [],
      staffSaleItems: [],
    });
    expect(statement.org?.close.kind).toBe("closing");
    expect(statement.org?.close.closingBalanceCents).toBe(850);
  });
});
