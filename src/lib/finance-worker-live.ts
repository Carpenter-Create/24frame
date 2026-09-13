import {
  createFinanceWorkerDbOps,
  createFinanceWorkerPool,
  createPgFinanceSql,
  type WorkerEnv,
} from "@/lib/finance-worker-db";
import type { FinanceWorkerRuntime } from "@/lib/finance-worker-poll";
import { createFinanceWorkerS3 } from "@/lib/finance-worker-s3";

// Concrete worker wiring. Money compute stays in processFinanceJob + existing RPCs.

export function buildLiveFinanceWorkerRuntime(
  env: WorkerEnv = process.env,
): FinanceWorkerRuntime {
  const { pool } = createFinanceWorkerPool(env);
  const db = createFinanceWorkerDbOps(createPgFinanceSql(pool));
  const s3 = createFinanceWorkerS3(env);
  return {
    deps: {
      getJob: db.getJob,
      markRunning: db.markRunning,
      markFailed: db.markFailed,
      getImport: db.getImport,
      getObject: s3.getObject,
      putObject: s3.putObject,
      applySalesImport: db.applySalesImport,
      applyClose: db.applyClose,
      applyExport: db.applyExport,
      loadPostedStatement: db.loadPostedStatement,
    },
    claimNextQueuedJob: db.claimNextQueuedJob,
    markSucceededIfRunning: db.markSucceededIfRunning,
    close: async () => {
      await pool.end();
    },
  };
}
