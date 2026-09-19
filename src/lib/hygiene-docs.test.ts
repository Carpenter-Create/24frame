import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// P3-1 / P3-3 / P3-5 / P3-8 / P2-9 — docs match hard-404 + live IA.

describe("hygiene docs (P3 / P2-9)", () => {
  it("says retired /news 404s — no leftover redirect", () => {
    const current = readFileSync("docs/status/CURRENT.md", "utf8");
    const news = readFileSync("docs/infra/news-aws-setup.md", "utf8");
    expect(current).toContain("Retired `/news` 404s");
    expect(current).not.toContain("(`/news` permanently redirects)");
    expect(news).toContain("Retired `/news` 404s");
    expect(news).not.toContain("permanently redirects");
    expect(news).not.toContain("`/news` → `/home/news`");
  });

  it("smoke runbook uses first-segment IA", () => {
    const runbook = readFileSync("docs/infra/authenticated-smoke-runbook.md", "utf8");
    expect(runbook).toContain("/aggregation/titles");
    expect(runbook).toContain("/aggregation/activity");
    expect(runbook).toContain("/aggregation/attention");
    expect(runbook).toContain("/aggregation/queue");
    expect(runbook).toContain("/aggregation/gc/deliveries");
    expect(runbook).toContain("/aggregation/channels");
    expect(runbook).toContain("/settings/agreements");
    expect(runbook).not.toMatch(/\|\s+\*\*Path\*\*\s+\|\s+`\/titles`\s+\|/);
    expect(runbook).not.toMatch(/\|\s+\*\*Path\*\*\s+\|\s+`\/queue`\s+\|/);
    expect(runbook).not.toMatch(/\|\s+\*\*Path\*\*\s+\|\s+`\/vendors`\s+\|/);
  });

  it("July security files banner to CURRENT.md and env example names title/cron/portal", () => {
    expect(readFileSync("SECURITY-STATUS.md", "utf8")).toContain("Not live status (P3-8)");
    expect(readFileSync("security-audit-findings.md", "utf8")).toContain("docs/status/CURRENT.md");
    const env = readFileSync(".env.example", "utf8");
    expect(env).toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(env).toContain("CRON_SECRET=");
    expect(env).toContain("PORTAL_BASE_URL=");
    expect(env).toContain("S3_BUCKET=");
    expect(env).toContain("DASHBOARD_CRAFT_FIXTURE=");
    expect(env).not.toMatch(/^NEWS_S3_/m);
    expect(env).not.toContain("NEWS_S3_BUCKET=");
    const globals = readFileSync("src/app/globals.css", "utf8");
    const tokens = readFileSync("src/app/tokens.css", "utf8");
    expect(globals).toContain("Sporty Blue");
    expect(globals).not.toContain("PLACEHOLDER until the brand accent");
    expect(tokens).toContain("Sporty Blue is the confirmed accent");
    expect(tokens).not.toContain("placeholder accent until the brand accent is chosen");
  });
});
