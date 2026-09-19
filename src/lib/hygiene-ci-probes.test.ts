import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Isolation job: DB-only probes. portal + client-assets need a Next app.

describe("CI isolation probes", () => {
  it("runs B3, C group 1, and L7 on the default isolation job", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(ci).toContain("scripts/security/run-local-harness.mjs b3");
    expect(ci).toContain("scripts/security/run-local-harness.mjs c-group-1");
    expect(ci).toContain("scripts/security/run-local-harness.mjs l7");
    expect(ci).not.toContain("run-local-harness.mjs portal");
    expect(ci).not.toContain("run-local-harness.mjs client-assets");
    expect(ci).toContain("they need APP_URL and a running app");
  });
});
