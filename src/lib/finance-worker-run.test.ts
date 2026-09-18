import { describe, expect, it, vi } from "vitest";

import { buildPeriodStatement } from "./finance-statement";
import { processFinanceJob, type FinanceWorkerDeps } from "./finance-worker-run";


const ORG = "11111111-1111-4111-8111-111111111111";
const PERIOD = "33333333-3333-4333-8333-333333333333";
const IMPORT = "44444444-4444-4444-8444-444444444444";

const csv = "endpoint,external_id,bank_receipt_cents\navod,EXT-9,2500\n";

function postedStatement() {
  return buildPeriodStatement({
    postedOnly: true,
    clientRateBp: 8500,
    openingCents: 0,
    thresholdCents: 1000,
    sourceLines: [
      {
        id: "l1",
        importId: IMPORT,
        importFilename: "a.csv",
        importContentHash: "abc",
        lineNo: 1,
        endpoint: "avod",
        externalId: "EXT-9",
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
    postedSales: [
      { salesLineId: "l1", clientShareCents: 2125, aggregatorKeepCents: 375, clientRateBp: 8500 },
    ],
  });
}

function deps(partial: Partial<FinanceWorkerDeps> = {}): FinanceWorkerDeps {
  return {
    getJob: async () => null,
    markRunning: async () => undefined,
    markFailed: async () => undefined,
    getImport: async () => null,
    getObject: async () => new Uint8Array(),
    putObject: async () => undefined,
    applySalesImport: async () => 0,
    applyClose: async () => undefined,
    applyExport: async () => undefined,
    loadPostedStatement: async () => ({
      statement: postedStatement(),
      orgName: "Acme",
      periodYear: 2026,
      periodMonth: 8,
    }),
    ...partial,
  };
}

describe("finance worker", () => {
  it("parses ingest bytes and applies lines — Next does not", async () => {
    const applySalesImport = vi.fn(async () => 1);
    await processFinanceJob(
      deps({
        getJob: async () => ({
          id: "job-1",
          org_id: ORG,
          period_id: PERIOD,
          import_id: IMPORT,
          kind: "ingest",
          status: "queued",
        }),
        getImport: async () => ({
          id: IMPORT,
          org_id: ORG,
          filename: "a.csv",
          s3_key: `orgs/${ORG}/imports/abc/a.csv`,
        }),
        getObject: async () => new TextEncoder().encode(csv),
        applySalesImport,
      }),
      "job-1",
    );
    expect(applySalesImport).toHaveBeenCalledWith(IMPORT, [
      expect.objectContaining({
        endpoint: "avod",
        external_id: "EXT-9",
        bank_receipt_cents: 2500,
      }),
    ]);
  });

  it("close jobs call apply_finance_close only", async () => {
    const applyClose = vi.fn(async () => undefined);
    await processFinanceJob(
      deps({
        getJob: async () => ({
          id: "job-2",
          org_id: ORG,
          period_id: PERIOD,
          import_id: null,
          kind: "close",
          status: "queued",
        }),
        applyClose,
      }),
      "job-2",
    );
    expect(applyClose).toHaveBeenCalledWith(PERIOD);
  });

  it("export jobs write org-scoped statement keys and apply both formats", async () => {
    const putObject = vi.fn<FinanceWorkerDeps["putObject"]>(async () => undefined);
    const applyExport = vi.fn<FinanceWorkerDeps["applyExport"]>(async () => undefined);
    await processFinanceJob(
      deps({
        getJob: async () => ({
          id: "job-3",
          org_id: ORG,
          period_id: PERIOD,
          import_id: null,
          kind: "export",
          status: "queued",
        }),
        putObject,
        applyExport,
      }),
      "job-3",
    );
    expect(putObject).toHaveBeenCalledTimes(2);
    expect(applyExport).toHaveBeenCalledTimes(2);
    const firstPut = putObject.mock.calls[0]?.[0];
    expect(firstPut?.key).toBe(`orgs/${ORG}/statements/${PERIOD}/24frame-statement.pdf`);
    expect(applyExport.mock.calls.map((call) => call[0]?.format)).toEqual(["pdf", "csv"]);
  });

  it("marks the job failed when ingest has no s3_key", async () => {
    const markFailed = vi.fn(async () => undefined);
    await expect(
      processFinanceJob(
        deps({
          getJob: async () => ({
            id: "job-4",
            org_id: ORG,
            period_id: PERIOD,
            import_id: IMPORT,
            kind: "ingest",
            status: "queued",
          }),
          getImport: async () => ({
            id: IMPORT,
            org_id: ORG,
            filename: "a.csv",
            s3_key: null,
          }),
          markFailed,
        }),
        "job-4",
      ),
    ).rejects.toThrow("Import has no s3_key");
    expect(markFailed).toHaveBeenCalledWith("job-4", "Import has no s3_key");
  });
});
