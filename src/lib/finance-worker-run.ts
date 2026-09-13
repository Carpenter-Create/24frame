import { createHash } from "node:crypto";

import { financeStatementObjectKey, type FinanceJobKind } from "@/lib/finance-aws";
import { exportStatement } from "@/lib/finance-export";
import { parseSalesFile, type ParsedSalesLine } from "@/lib/finance-import";
import type { PeriodStatement } from "@/lib/finance-statement";

// AWS finance worker. Parse, close apply, and statement bytes live here.
// Next.js and the browser must not recompute money or emit statement files.

export type FinanceWorkerJob = {
  id: string;
  org_id: string;
  period_id: string | null;
  import_id: string | null;
  kind: FinanceJobKind;
  status: string;
};

export type FinanceWorkerDeps = {
  getJob: (id: string) => Promise<FinanceWorkerJob | null>;
  markRunning: (id: string) => Promise<void>;
  markFailed: (id: string, error: string) => Promise<void>;
  getImport: (id: string) => Promise<{
    id: string;
    org_id: string;
    filename: string;
    s3_key: string | null;
  } | null>;
  getObject: (key: string, orgId: string) => Promise<Uint8Array>;
  putObject: (input: {
    key: string;
    orgId: string;
    body: Uint8Array;
    contentType: string;
  }) => Promise<void>;
  applySalesImport: (importId: string, lines: ParsedSalesLine[]) => Promise<number>;
  applyClose: (periodId: string) => Promise<void>;
  applyExport: (input: {
    periodId: string;
    format: "pdf" | "csv";
    s3Key: string;
    contentHash: string;
  }) => Promise<void>;
  loadPostedStatement: (
    periodId: string,
    orgId: string,
  ) => Promise<{
    statement: PeriodStatement;
    orgName: string;
    periodYear: number;
    periodMonth: number;
  }>;
};

export async function processFinanceJob(deps: FinanceWorkerDeps, jobId: string): Promise<void> {
  const job = await deps.getJob(jobId);
  if (!job) throw new Error("Finance job not found");
  await deps.markRunning(job.id);
  try {
    if (job.kind === "ingest") {
      if (!job.import_id) throw new Error("Ingest job requires import_id");
      const imp = await deps.getImport(job.import_id);
      if (!imp?.s3_key) throw new Error("Import has no s3_key");
      const bytes = await deps.getObject(imp.s3_key, imp.org_id);
      const parsed = await parseSalesFile({ filename: imp.filename, bytes });
      if (!parsed.ok) throw new Error(parsed.error);
      await deps.applySalesImport(imp.id, parsed.lines);
      return;
    }
    if (job.kind === "close") {
      if (!job.period_id) throw new Error("Close job requires period_id");
      await deps.applyClose(job.period_id);
      return;
    }
    if (job.kind === "export") {
      if (!job.period_id) throw new Error("Export job requires period_id");
      const loaded = await deps.loadPostedStatement(job.period_id, job.org_id);
      for (const format of ["pdf", "csv"] as const) {
        const file = exportStatement(
          loaded.statement,
          {
            orgName: loaded.orgName,
            periodYear: loaded.periodYear,
            periodMonth: loaded.periodMonth,
            status: "closed",
          },
          format,
        );
        const key = financeStatementObjectKey({
          orgId: job.org_id,
          periodId: job.period_id,
          format,
        });
        await deps.putObject({
          key,
          orgId: job.org_id,
          body: file.body,
          contentType: file.contentType,
        });
        await deps.applyExport({
          periodId: job.period_id,
          format,
          s3Key: key,
          contentHash: createHash("sha256").update(file.body).digest("hex"),
        });
      }
      return;
    }
    throw new Error(`Unsupported finance job kind: ${job.kind}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Finance job failed";
    await deps.markFailed(job.id, message);
    throw err;
  }
}
