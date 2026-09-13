import { afterEach, describe, expect, it } from "vitest";

import {
  createFinanceWorkerDbOps,
  financeWorkerDatabaseUrl,
  type FinanceSql,
} from "./finance-worker-db";

const SURVIVOR =
  "postgresql://postgres.uevsculwzwlhxeamagwg@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
const AURORA =
  "postgresql://app@frame-aurora-dev.cluster-abc.us-west-2.rds.amazonaws.com:5432/24frame";

function emptyResult<T extends Record<string, unknown>>(rows: T[] = []) {
  return { rows, rowCount: rows.length, command: "SELECT", oid: 0, fields: [] };
}

describe("finance worker database URL", () => {
  afterEach(() => {
    delete process.env.AURORA_DATABASE_URL;
    delete process.env.FINANCE_DATABASE_URL;
  });

  it("prefers a valid AURORA_DATABASE_URL and never accepts the survivor pooler as Aurora", () => {
    expect(
      financeWorkerDatabaseUrl({ AURORA_DATABASE_URL: AURORA }).source,
    ).toBe("AURORA_DATABASE_URL");
    expect(() => financeWorkerDatabaseUrl({ AURORA_DATABASE_URL: SURVIVOR })).toThrow(
      /dedicated 24Frame Aurora cluster/,
    );
    expect(financeWorkerDatabaseUrl({ FINANCE_DATABASE_URL: SURVIVOR })).toEqual({
      url: SURVIVOR,
      source: "FINANCE_DATABASE_URL",
    });
    expect(() =>
      financeWorkerDatabaseUrl({ FINANCE_DATABASE_URL: "postgresql://x@royalogic.example/db" }),
    ).toThrow(/survivor or Aurora/);
    expect(() => financeWorkerDatabaseUrl({})).toThrow(/FINANCE_DATABASE_URL/);
  });
});

describe("finance worker db ops", () => {
  it("claims the next queued job with skip locked and applies existing RPCs", async () => {
    const texts: string[] = [];
    const results = [
      emptyResult([{ id: "job-1" }]),
      emptyResult([{ apply_sales_import: 2 }]),
      emptyResult(),
      emptyResult(),
    ];
    const query: FinanceSql["query"] = async (text) => {
      texts.push(text);
      return results.shift() ?? emptyResult();
    };
    const ops = createFinanceWorkerDbOps({ query });
    await expect(ops.claimNextQueuedJob()).resolves.toBe("job-1");
    expect(texts[0]).toMatch(/for update skip locked/i);
    await expect(
      ops.applySalesImport("import-1", [
        {
          endpoint: "avod",
          external_id: "EXT-9",
          bank_receipt_cents: 2500,
          reported_cents: null,
          transaction_date: null,
          currency: "USD",
          raw: {},
        },
      ]),
    ).resolves.toBe(2);
    expect(texts[1]).toContain("apply_sales_import");
    await ops.applyClose("period-1");
    expect(texts[2]).toContain("apply_finance_close");
    await ops.applyExport({
      periodId: "period-1",
      format: "pdf",
      s3Key: "orgs/x/statements/p/24frame-statement.pdf",
      contentHash: "abc",
    });
    expect(texts[3]).toContain("apply_finance_export");
  });

  it("returns null when no queued job is available", async () => {
    const query: FinanceSql["query"] = async () => emptyResult();
    const ops = createFinanceWorkerDbOps({ query });
    await expect(ops.claimNextQueuedJob()).resolves.toBeNull();
  });
});
