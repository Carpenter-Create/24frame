import { PRODUCT_NAME } from "@/lib/product";

// 24Frame finance AWS contracts. Dedicated namespace — never title film,
// never 24frame-media, never avatars. Credentials are FINANCE_AWS_* /
// S3_FINANCE_* only. No fallback to AWS_* or MEDIA_AWS_*.
// Live buckets: 24frame-finance-dev / 24frame-finance-prod (E8 us-west-2).

export const FINANCE_AWS_ENV = [
  "FINANCE_AWS_REGION",
  "FINANCE_AWS_ACCESS_KEY_ID",
  "FINANCE_AWS_SECRET_ACCESS_KEY",
] as const;

export const S3_FINANCE_ENV = ["S3_FINANCE_BUCKET"] as const;

export const FINANCE_CLOUDFRONT_ENV = [
  "FINANCE_CLOUDFRONT_DOMAIN",
  "FINANCE_CLOUDFRONT_KEY_PAIR_ID",
  "FINANCE_CLOUDFRONT_PRIVATE_KEY",
] as const;

/** Live finance buckets (E8 us-west-2). CloudFront is not yet. */
export const FINANCE_BUCKETS = {
  prod: "24frame-finance-prod",
  dev: "24frame-finance-dev",
} as const;

export const FORBIDDEN_FINANCE_BUCKET_MARKERS = [
  "24frame-media",
  "24frame-education",
  "gc-content-assets",
  "gc-avatars",
] as const;

export const FINANCE_KEY_PREFIX = "orgs";
export const FINANCE_SIGNED_URL_TTL_SECONDS = 300;

export type FinanceJobKind = "ingest" | "map" | "close" | "export";
export type FinanceExportFormat = "pdf" | "csv";

export function isForbiddenFinanceBucket(name: string): boolean {
  const bucket = name.trim().toLowerCase();
  if (!bucket) return true;
  if (FORBIDDEN_FINANCE_BUCKET_MARKERS.some((marker) => bucket.includes(marker))) {
    return true;
  }
  const titles = (process.env.S3_BUCKET ?? "").toLowerCase();
  const avatars = (process.env.S3_AVATARS_BUCKET ?? "").toLowerCase();
  const mediaSource = (process.env.S3_MEDIA_SOURCE_BUCKET ?? "").toLowerCase();
  const mediaOutput = (process.env.S3_MEDIA_OUTPUT_BUCKET ?? "").toLowerCase();
  return (
    (titles !== "" && bucket === titles) ||
    (avatars !== "" && bucket === avatars) ||
    (mediaSource !== "" && bucket === mediaSource) ||
    (mediaOutput !== "" && bucket === mediaOutput)
  );
}

export function assertFinanceBucketName(bucket: string): string {
  if (!bucket) throw new Error("S3_FINANCE_BUCKET environment variable is not set");
  if (isForbiddenFinanceBucket(bucket)) {
    throw new Error("S3_FINANCE_BUCKET must be a dedicated 24Frame finance bucket");
  }
  return bucket;
}

function safeFilename(filename: string): string {
  const base = filename.trim().split(/[/\\]/).pop() ?? "upload.csv";
  return base.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 120) || "upload.csv";
}

export function financeImportObjectKey(input: {
  orgId: string;
  contentHash: string;
  filename: string;
}): string {
  return `${FINANCE_KEY_PREFIX}/${input.orgId}/imports/${input.contentHash}/${safeFilename(input.filename)}`;
}

export function financeStatementObjectKey(input: {
  orgId: string;
  periodId: string;
  format: FinanceExportFormat;
}): string {
  return `${FINANCE_KEY_PREFIX}/${input.orgId}/statements/${input.periodId}/${PRODUCT_NAME.toLowerCase()}-statement.${input.format}`;
}

export function financeObjectKeyBelongsToOrg(key: string, orgId: string): boolean {
  return key.startsWith(`${FINANCE_KEY_PREFIX}/${orgId}/`);
}
