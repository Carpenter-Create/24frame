import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const envExample = readFileSync(".env.example", "utf8");
const infra = readFileSync("docs/infra/news-aws-setup.md", "utf8");
const vercel = readFileSync("vercel.json", "utf8");
const current = readFileSync("docs/status/CURRENT.md", "utf8");

describe("News AWS setup doc", () => {
  it("documents founder-applied Dynamo + Lambda + EventBridge and forbids CI create", () => {
    expect(infra).toContain("405912452061");
    expect(infra).toContain("us-west-2");
    expect(infra).toContain("24frame-news-prod");
    expect(infra).toContain("24frame-news-ingest");
    expect(infra).toContain("rate(30 minutes)");
    expect(infra).toContain("24frame-news-ingest-dlq");
    expect(infra).toContain("Do **not** create these resources from CI");
    expect(infra).toContain("Kill a source");
    expect(infra).toContain("Trigger ingest");
    expect(infra).toContain("Not Supabase");
    expect(infra).toContain("What Adam must create");
    expect(current).toContain("Industry News AWS");
    expect(current).toContain("Not Vercel cron");
    expect(envExample).toContain("NEWS_AWS_ACCESS_KEY_ID=");
    expect(envExample).toContain("NEWS_DDB_TABLE=");
    expect(envExample).toContain("Never fall back to AWS_* / FINANCE_AWS_* /");
    expect(vercel).not.toContain("/api/cron/news-ingest");
  });
});
