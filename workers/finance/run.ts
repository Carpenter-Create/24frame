// 24Frame finance worker entry. Fargate preferred; Lambda is fine for export.
// Uses FINANCE_AWS_* / S3_FINANCE_* only. Never AWS_* or MEDIA_AWS_*.
// Relational SoT: AURORA_DATABASE_URL once Adam creates the cluster.
// Auth stays Supabase Auth. No Cognito.
// Wire processFinanceJob from src/lib/finance-worker-run.ts once Adam applies
// the bucket + OIDC role. This file is the in-repo cutover scaffold.

import { processFinanceJob, type FinanceWorkerDeps } from "../../src/lib/finance-worker-run";

export async function runQueuedJob(deps: FinanceWorkerDeps, jobId: string): Promise<void> {
  await processFinanceJob(deps, jobId);
}

if (process.argv[1]?.endsWith("run.ts") && process.argv[2]) {
  throw new Error(
    "Finance worker live poll is not wired until FINANCE_AWS_* and the OIDC role exist. Use processFinanceJob with injected deps.",
  );
}
