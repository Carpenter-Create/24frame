import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const dockerfile = readFileSync("workers/finance/Dockerfile", "utf8");
const entry = readFileSync("workers/finance/run.ts", "utf8");
const readme = readFileSync("workers/finance/README.md", "utf8");
const setup = readFileSync("docs/infra/finance-aws-setup.md", "utf8");
const pkg = readFileSync("package.json", "utf8");
const db = readFileSync("src/lib/finance-worker-db.ts", "utf8");
const poll = readFileSync("src/lib/finance-worker-poll.ts", "utf8");

describe("finance worker live wiring", () => {
  it("copies tsconfig and src/lib so @/ imports resolve, and ships tsx + pg", () => {
    expect(dockerfile).toContain("COPY tsconfig.json");
    expect(dockerfile).toContain("COPY src/lib");
    expect(dockerfile).toContain("tsx");
    expect(dockerfile).toContain("workers/finance/run.ts");
    expect(pkg).toContain("\"tsx\"");
    expect(pkg).toContain("\"pg\"");
  });

  it("polls queued jobs instead of throwing not-wired", () => {
    expect(entry).not.toContain("not wired");
    expect(entry).toContain("pollAndProcessQueuedJobs");
    expect(entry).toContain("buildLiveFinanceWorkerRuntime");
    expect(poll).toContain("claimNextQueuedJob");
    expect(db).toContain("apply_sales_import");
    expect(db).toContain("apply_finance_close");
    expect(db).toContain("apply_finance_export");
    expect(db).toContain("service_role");
    expect(db).toContain("AURORA_DATABASE_URL");
    expect(db).toContain("FINANCE_DATABASE_URL");
    expect(db).not.toContain("cognito");
    expect(db).not.toContain("Cognito");
  });

  it("documents founder-gated EventBridge and interim survivor URL", () => {
    expect(readme).toContain("FINANCE_DATABASE_URL");
    expect(readme).toContain("24frame-finance-poll");
    expect(readme).toContain("founder");
    expect(readme).toContain("24frame-finance-dev");
    expect(setup).toContain("FINANCE_DATABASE_URL");
    expect(setup).toContain("digest");
    expect(setup).toContain("Do not enable");
    expect(readme).not.toContain("Cognito");
    expect(setup).not.toContain("Cognito");
  });
});
