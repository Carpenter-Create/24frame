// 24Frame finance worker entry. Fargate preferred; Lambda is fine for export.
// Uses FINANCE_AWS_* / S3_FINANCE_* only. Never AWS_* or MEDIA_AWS_*.
// Relational SoT: AURORA_DATABASE_URL when set and valid; else FINANCE_DATABASE_URL
// (survivor Postgres until Aurora cutover). Auth stays Supabase Auth. No Cognito.
// EventBridge rule 24frame-finance-poll stays founder-enabled.

import { buildLiveFinanceWorkerRuntime } from "../../src/lib/finance-worker-live";
import { pollAndProcessQueuedJobs, pollExitCode } from "../../src/lib/finance-worker-poll";
import { processFinanceJob, type FinanceWorkerDeps } from "../../src/lib/finance-worker-run";

export async function runQueuedJob(deps: FinanceWorkerDeps, jobId: string): Promise<void> {
  await processFinanceJob(deps, jobId);
}

export async function main(): Promise<number> {
  const runtime = buildLiveFinanceWorkerRuntime();
  try {
    const result = await pollAndProcessQueuedJobs(runtime);
    if (result.processed === 0) {
      console.log("finance worker idle: no queued jobs");
    } else {
      console.log(
        `finance worker done: processed=${result.processed} failed=${result.failed}`,
      );
    }
    return pollExitCode(result);
  } finally {
    await runtime.close?.();
  }
}

function isDirectRun(): boolean {
  const entry = process.argv[1] ?? "";
  return entry.endsWith("workers/finance/run.ts") || entry.endsWith("workers/finance/run.js");
}

if (isDirectRun()) {
  main()
    .then((code) => {
      process.exit(code);
    })
    .catch((err) => {
      const message = err instanceof Error ? err.message : "Finance worker failed";
      console.error(message);
      process.exit(1);
    });
}
