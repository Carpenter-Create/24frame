import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  NEWS_APP_USER,
  NEWS_AWS_ACCOUNT,
  NEWS_AWS_ENV,
  NEWS_AWS_REGION,
  NEWS_DDB_ENV,
  NEWS_INGEST_DLQ,
  NEWS_INGEST_FUNCTION,
  NEWS_INGEST_ROLE,
  NEWS_INGEST_RULE,
  NEWS_INGEST_SCHEDULE,
  NEWS_TABLES,
  assertNewsTableName,
  isNewsAwsConfigured,
  isNewsIngestConfigured,
  newsAwsStaticCredentials,
  requireNewsEnv,
} from "./news-aws";

const newsSrc = readFileSync("src/lib/news.ts", "utf8");
const storeSrc = readFileSync("src/lib/news-store.ts", "utf8");
const ingestSrc = readFileSync("src/lib/news-ingest.ts", "utf8");
const loadSrc = readFileSync("src/lib/news-load.ts", "utf8");
const handlerSrc = readFileSync("workers/news/handler.ts", "utf8");
const homeSrc = readFileSync("src/app/(app)/home/page.tsx", "utf8");
const historySrc = readFileSync("src/app/(app)/home/news/page.tsx", "utf8");
const vercel = readFileSync("vercel.json", "utf8");

describe("News AWS isolation", () => {
  it("keeps dedicated NEWS_AWS_* names and never falls back", () => {
    expect(NEWS_AWS_ACCOUNT).toBe("405912452061");
    expect(NEWS_AWS_REGION).toBe("us-west-2");
    expect(NEWS_AWS_ENV).toEqual([
      "NEWS_AWS_REGION",
      "NEWS_AWS_ACCESS_KEY_ID",
      "NEWS_AWS_SECRET_ACCESS_KEY",
    ]);
    expect(NEWS_DDB_ENV).toEqual(["NEWS_DDB_TABLE"]);
    expect(NEWS_TABLES.prod).toBe("24frame-news-prod");
    expect(NEWS_TABLES.dev).toBe("24frame-news-dev");
    expect(NEWS_INGEST_FUNCTION).toBe("24frame-news-ingest");
    expect(NEWS_INGEST_RULE).toBe("24frame-news-ingest");
    expect(NEWS_INGEST_SCHEDULE).toBe("rate(30 minutes)");
    expect(NEWS_INGEST_DLQ).toBe("24frame-news-ingest-dlq");
    expect(NEWS_INGEST_ROLE).toBe("24frame-news-ingest");
    expect(NEWS_APP_USER).toBe("24frame-news-app");
    expect(isNewsAwsConfigured({})).toBe(false);
    expect(
      isNewsIngestConfigured({
        NEWS_AWS_REGION: "us-west-2",
        NEWS_DDB_TABLE: "24frame-news-dev",
      }),
    ).toBe(true);
    expect(
      isNewsAwsConfigured({
        NEWS_AWS_REGION: "us-west-2",
        NEWS_DDB_TABLE: "24frame-news-dev",
      }),
    ).toBe(false);
    expect(
      newsAwsStaticCredentials({
        NEWS_AWS_REGION: "us-west-2",
        NEWS_DDB_TABLE: "24frame-news-dev",
      }),
    ).toBeUndefined();
    expect(() => requireNewsEnv("NEWS_AWS_REGION", {})).toThrow(/NEWS_AWS_REGION/);
    expect(() => assertNewsTableName("24frame-finance-prod")).toThrow(/dedicated/);
    expect(() => assertNewsTableName("24frame-education-source-prod")).toThrow(/dedicated/);
    expect(() => assertNewsTableName("24frame-media")).toThrow(/dedicated/);
  });

  it("has no Supabase table or Vercel cron on the News path", () => {
    for (const src of [newsSrc, storeSrc, ingestSrc, loadSrc, handlerSrc]) {
      expect(src).not.toContain("news_items");
      expect(src).not.toContain("news_source_health");
      expect(src).not.toMatch(/from ["']@\/lib\/supabase/);
    }
    expect(homeSrc).not.toContain("news_items");
    expect(historySrc).not.toContain("news_items");
    expect(historySrc).not.toMatch(/from ["']@\/lib\/supabase\/server/);
    expect(vercel).not.toContain("news-ingest");
    expect(storeSrc).toContain("DynamoDB");
    expect(handlerSrc).toContain("createNewsIngestStore");
    expect(homeSrc).not.toMatch(/from ["']@\/lib\/news-ingest/);
    expect(historySrc).not.toMatch(/from ["']@\/lib\/news-ingest/);
    expect(loadSrc).not.toMatch(/fetchNewsFeedXml|parseNewsFeed/);
    expect(ingestSrc).toContain("fillNewsOgImages");
    expect(ingestSrc).toContain("parseOgImageUrl");
    expect(ingestSrc).toContain("mirrorNewsItemImages");
    expect(ingestSrc).toContain("newsItemNeedsOg");
    expect(ingestSrc).not.toContain("NEXT_PUBLIC_");
  });
});
