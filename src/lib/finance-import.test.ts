import { describe, expect, it } from "vitest";

import { parseSalesFile, parseSalesRows } from "./finance-import";

describe("parseSalesRows", () => {
  it("converts dollar gross to integer cents and lowercases endpoint", () => {
    const result = parseSalesRows(
      ["endpoint", "external_id", "gross"],
      [["Tubi", "ext-1", "12.50"]],
    );
    expect(result).toEqual({
      ok: true,
      lines: [
        {
          endpoint: "tubi",
          external_id: "ext-1",
          gross_cents: 1250,
          transaction_date: null,
          currency: "USD",
          raw: { endpoint: "Tubi", external_id: "ext-1", gross: "12.50" },
        },
      ],
    });
  });

  it("keeps gross_cents as integer cents", () => {
    const result = parseSalesRows(
      ["vendor", "sku", "gross_cents"],
      [["Avod", "A-9", "199"]],
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lines[0]?.gross_cents).toBe(199);
  });

  it("rejects a non-USD currency", () => {
    const result = parseSalesRows(
      ["endpoint", "external_id", "gross", "currency"],
      [["tubi", "x", "10", "EUR"]],
    );
    expect(result).toEqual({ ok: false, error: "USD only (line 1)." });
  });

  it("rejects a file without the mapping columns", () => {
    const result = parseSalesRows(["title", "amount"], [["Film", "10"]]);
    expect(result.ok).toBe(false);
  });
});

describe("parseSalesFile", () => {
  it("reads a CSV buffer", async () => {
    const csv = "endpoint,external_id,gross\nfast,abc,1.00\n";
    const result = await parseSalesFile({
      filename: "sales.csv",
      bytes: new TextEncoder().encode(csv),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]?.gross_cents).toBe(100);
    }
  });
});
