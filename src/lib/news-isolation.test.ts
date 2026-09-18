import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const envExample = readFileSync(".env.example", "utf8");
const infra = readFileSync("docs/infra/news-aws-setup.md", "utf8");
const vercel = readFileSync("vercel.json", "utf8");
const current = readFileSync("docs/status/CURRENT.md", "utf8");
const types = readFileSync("src/lib/supabase/database.types.ts", "utf8");
const homeSrc = readFileSync("src/app/(app)/home/page.tsx", "utf8");
const historySrc = readFileSync("src/app/(app)/home/news/page.tsx", "utf8");
const loadSrc = readFileSync("src/lib/news-load.ts", "utf8");

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
    expect(current).toContain("/home/news");
    expect(envExample).toContain("NEWS_AWS_ACCESS_KEY_ID=");
    expect(envExample).toContain("NEWS_DDB_TABLE=");
    expect(envExample).toContain("Never fall back to AWS_* / FINANCE_AWS_* /");
    expect(vercel).not.toContain("/api/cron/news-ingest");
    expect(existsSync("supabase/migrations/20260918180000_news_items.sql")).toBe(false);
    expect(existsSync("supabase/migrations/20260918140000_news_items.sql")).toBe(false);
    expect(existsSync("supabase/tests/news_items_test.sql")).toBe(false);
    expect(existsSync("src/app/api/cron/news-ingest/route.ts")).toBe(false);
    expect(existsSync("docs/scheduled/news-ingest.md")).toBe(false);
    expect(types).not.toContain("news_items");
    expect(types).not.toContain("news_source_health");
    expect(homeSrc).not.toContain("loadHomeNews(supabase");
    expect(historySrc).not.toContain("loadNewsHistory(supabase");
    expect(historySrc).toContain("backLink");
    expect(historySrc).toContain("newsHistoryBackLink");
    expect(existsSync("src/app/(app)/home/news/page.tsx")).toBe(true);
    expect(infra).toContain("Image backfill");
    expect(loadSrc).not.toMatch(/from ["']@\/lib\/supabase/);
  });
});
