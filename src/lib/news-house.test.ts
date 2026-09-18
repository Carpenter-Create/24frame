import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const newsSrc = readFileSync("src/lib/news.ts", "utf8");
const loadSrc = readFileSync("src/lib/news-load.ts", "utf8");
const ingestSrc = readFileSync("src/lib/news-ingest.ts", "utf8");
const cronSrc = readFileSync("src/app/api/cron/news-ingest/route.ts", "utf8");
const homeSrc = readFileSync("src/app/(app)/home/page.tsx", "utf8");
const historySrc = readFileSync("src/app/(app)/news/page.tsx", "utf8");
const vercel = readFileSync("vercel.json", "utf8");
const envExample = readFileSync(".env.example", "utf8");

describe("News house scheduler", () => {
  it("stays on Vercel cron + Supabase and does not fork EventBridge", () => {
    for (const src of [newsSrc, loadSrc, ingestSrc, cronSrc]) {
      expect(src).not.toContain("EventBridge");
      expect(src).not.toContain("DynamoDB");
      expect(src).not.toContain("NEWS_AWS_");
    }
    expect(cronSrc).toContain("CRON_SECRET");
    expect(cronSrc).toContain("createAdminClient");
    expect(loadSrc).toContain("news_items");
    expect(loadSrc).not.toMatch(/fetchNewsFeedXml|parseNewsFeed/);
    expect(homeSrc).toContain("loadHomeNews");
    expect(homeSrc).not.toContain("parseNewsFeed");
    expect(historySrc).toContain("loadNewsHistory");
    expect(vercel).toContain("/api/cron/news-ingest");
    expect(vercel).toContain("*/30 * * * *");
    expect(envExample).not.toContain("NEWS_AWS_");
    expect(envExample).not.toContain("NEWS_DDB_TABLE");
  });
});
