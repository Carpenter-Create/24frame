// 24Frame Industry News AWS contracts. Dedicated DynamoDB namespace.
// Credentials are NEWS_AWS_* / NEWS_DDB_TABLE only. No fallback to
// AWS_* (titles), FINANCE_AWS_*, MEDIA_AWS_*, SES_AWS_*, or EDUCATION_AWS_*.
// Account 405912452061 / us-west-2. Founder creates resources — see
// docs/infra/news-aws-setup.md. Never NEXT_PUBLIC_.

export const NEWS_AWS_ENV = [
  "NEWS_AWS_REGION",
  "NEWS_AWS_ACCESS_KEY_ID",
  "NEWS_AWS_SECRET_ACCESS_KEY",
] as const;

export const NEWS_DDB_ENV = ["NEWS_DDB_TABLE"] as const;

export const NEWS_AWS_ACCOUNT = "405912452061";
export const NEWS_AWS_REGION = "us-west-2";

export const NEWS_TABLES = {
  prod: "24frame-news-prod",
  dev: "24frame-news-dev",
} as const;

export const NEWS_INGEST_FUNCTION = "24frame-news-ingest";
export const NEWS_INGEST_RULE = "24frame-news-ingest";
export const NEWS_INGEST_DLQ = "24frame-news-ingest-dlq";
export const NEWS_INGEST_ROLE = "24frame-news-ingest";
export const NEWS_APP_USER = "24frame-news-app";

export const NEWS_FEED_PK = "FEED";
export const NEWS_ITEM_SK = "ITEM";
export const NEWS_HEALTH_SK = "HEALTH";

export const FORBIDDEN_NEWS_TABLE_MARKERS = [
  "finance",
  "education",
  "media",
  "avatars",
  "titles",
] as const;

export type NewsEnv = Record<string, string | undefined>;

export function isNewsAwsConfigured(env: NewsEnv = process.env): boolean {
  return [...NEWS_AWS_ENV, ...NEWS_DDB_ENV].every((name) => !!env[name]?.trim());
}

export function requireNewsEnv(
  name: (typeof NEWS_AWS_ENV)[number] | (typeof NEWS_DDB_ENV)[number],
  env: NewsEnv = process.env,
): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function assertNewsTableName(name: string): string {
  const table = name.trim();
  if (!table) throw new Error("NEWS_DDB_TABLE environment variable is not set");
  const lower = table.toLowerCase();
  if (FORBIDDEN_NEWS_TABLE_MARKERS.some((marker) => lower.includes(marker))) {
    throw new Error("NEWS_DDB_TABLE must be a dedicated 24Frame news table");
  }
  return table;
}

export function newsItemPk(canonicalUrl: string): string {
  return `ITEM#${canonicalUrl}`;
}

export function newsSourcePk(sourceId: string): string {
  return `SOURCE#${sourceId}`;
}

export function newsFeedSk(publishedAt: string, canonicalUrl: string): string {
  return `${publishedAt}#${canonicalUrl}`;
}
