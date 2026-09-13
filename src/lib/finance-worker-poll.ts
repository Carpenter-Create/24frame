import { processFinanceJob, type FinanceWorkerDeps } from "@/lib/finance-worker-run";

// One EventBridge invocation: claim queued jobs, run processFinanceJob, exit.
// Idle (no queued jobs) is success so a rate schedule can fire without work.

export type FinanceWorkerRuntime = {
  deps: FinanceWorkerDeps;
  claimNextQueuedJob: () => Promise<string | null>;
  markSucceededIfRunning: (id: string) => Promise<void>;
  close?: () => Promise<void>;
};

export type FinanceWorkerPollResult = {
  processed: number;
  failed: number;
  failedIds: string[];
};

export async function pollAndProcessQueuedJobs(
  runtime: FinanceWorkerRuntime,
  runJob: typeof processFinanceJob = processFinanceJob,
): Promise<FinanceWorkerPollResult> {
  let processed = 0;
  let failed = 0;
  const failedIds: string[] = [];

  for (;;) {
    const jobId = await runtime.claimNextQueuedJob();
    if (!jobId) break;
    processed += 1;
    try {
      await runJob(runtime.deps, jobId);
      await runtime.markSucceededIfRunning(jobId);
    } catch {
      failed += 1;
      failedIds.push(jobId);
    }
  }

  return { processed, failed, failedIds };
}

export function pollExitCode(result: FinanceWorkerPollResult): number {
  return result.failed > 0 ? 1 : 0;
}
