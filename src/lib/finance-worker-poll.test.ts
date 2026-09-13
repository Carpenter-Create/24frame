import { describe, expect, it, vi } from "vitest";

import { pollAndProcessQueuedJobs, pollExitCode, type FinanceWorkerRuntime } from "./finance-worker-poll";
import type { FinanceWorkerDeps } from "./finance-worker-run";

function runtime(partial: Partial<FinanceWorkerRuntime> = {}): FinanceWorkerRuntime {
  const deps: FinanceWorkerDeps = {
    getJob: async () => null,
    markRunning: async () => undefined,
    markFailed: async () => undefined,
    getImport: async () => null,
    getObject: async () => new Uint8Array(),
    putObject: async () => undefined,
    applySalesImport: async () => 0,
    applyClose: async () => undefined,
    applyExport: async () => undefined,
    loadPostedStatement: async () => {
      throw new Error("not used");
    },
  };
  return {
    deps,
    claimNextQueuedJob: async () => null,
    markSucceededIfRunning: async () => undefined,
    ...partial,
  };
}

describe("finance worker poll", () => {
  it("exits 0 when idle — no jobs claimed", async () => {
    const result = await pollAndProcessQueuedJobs(runtime());
    expect(result).toEqual({ processed: 0, failed: 0, failedIds: [] });
    expect(pollExitCode(result)).toBe(0);
  });

  it("claims queued jobs, delegates to processFinanceJob, and succeeds still-running rows", async () => {
    const claimNextQueuedJob = vi
      .fn()
      .mockResolvedValueOnce("job-1")
      .mockResolvedValueOnce("job-2")
      .mockResolvedValueOnce(null);
    const markSucceededIfRunning = vi.fn(async () => undefined);
    const runJob = vi.fn(async () => undefined);
    const rt = runtime({ claimNextQueuedJob, markSucceededIfRunning });
    const result = await pollAndProcessQueuedJobs(rt, runJob);
    expect(runJob).toHaveBeenCalledTimes(2);
    expect(runJob).toHaveBeenNthCalledWith(1, rt.deps, "job-1");
    expect(runJob).toHaveBeenNthCalledWith(2, rt.deps, "job-2");
    expect(markSucceededIfRunning).toHaveBeenCalledWith("job-1");
    expect(markSucceededIfRunning).toHaveBeenCalledWith("job-2");
    expect(result).toEqual({ processed: 2, failed: 0, failedIds: [] });
    expect(pollExitCode(result)).toBe(0);
  });

  it("continues after a failed job and exits 1", async () => {
    const claimNextQueuedJob = vi
      .fn()
      .mockResolvedValueOnce("job-bad")
      .mockResolvedValueOnce("job-ok")
      .mockResolvedValueOnce(null);
    const markSucceededIfRunning = vi.fn(async () => undefined);
    const runJob = vi.fn(async (_deps, id: string) => {
      if (id === "job-bad") throw new Error("Import has no s3_key");
    });
    const result = await pollAndProcessQueuedJobs(
      runtime({ claimNextQueuedJob, markSucceededIfRunning }),
      runJob,
    );
    expect(markSucceededIfRunning).toHaveBeenCalledTimes(1);
    expect(markSucceededIfRunning).toHaveBeenCalledWith("job-ok");
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.failedIds).toEqual(["job-bad"]);
    expect(pollExitCode(result)).toBe(1);
  });
});
