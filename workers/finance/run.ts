// 24Frame finance worker entry. Fargate preferred; Lambda is fine for export.
// Uses FINANCE_AWS_* / S3_FINANCE_* only. Never AWS_* or MEDIA_AWS_*.
// Relational SoT: AURORA_DATABASE_URL on frame-aurora-dev / frame-aurora-prod.
// Auth stays Supabase Auth. No Cognito. EventBridge + ECS deploy are not yet.

import { processFinanceJob, type FinanceWorkerDeps } from "../../src/lib/finance-worker-run";

export async function runQueuedJob(deps: FinanceWorkerDeps, jobId: string): Promise<void> {
  await processFinanceJob(deps, jobId);
}

if (process.argv[1]?.endsWith("run.ts") && process.argv[2]) {
  throw new Error(
    "Finance worker live poll is not wired until EventBridge + ECS deploy exist. Use processFinanceJob with injected deps.",
  );
}
