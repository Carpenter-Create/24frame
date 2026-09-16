import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import {
  FINANCE_BUCKETS,
  FORBIDDEN_FINANCE_BUCKET_MARKERS,
  assertFinanceBucketName,
  financeImportObjectKey,
  financeObjectKeyBelongsToOrg,
  financeStatementObjectKey,
  isForbiddenFinanceBucket,
} from "./finance-aws";

const awsSrc = readFileSync("src/lib/finance-aws.ts", "utf8");
const s3Src = readFileSync("src/lib/s3-finance.ts", "utf8");
const cfSrc = readFileSync("src/lib/finance-cloudfront.ts", "utf8");
const actions = readFileSync("src/app/(app)/(operator)/gc/finance/actions.ts", "utf8");
const exportRoute = readFileSync("src/app/(app)/earn/[periodId]/export/route.ts", "utf8");

describe("finance AWS isolation", () => {
  afterEach(() => {
    delete process.env.S3_BUCKET;
    delete process.env.S3_AVATARS_BUCKET;
    delete process.env.S3_MEDIA_SOURCE_BUCKET;
    delete process.env.S3_MEDIA_OUTPUT_BUCKET;
  });

  it("uses live dedicated buckets and refuses title/media/avatar names", () => {
    expect(FINANCE_BUCKETS.prod).toBe("24frame-finance-prod");
    expect(FINANCE_BUCKETS.dev).toBe("24frame-finance-dev");
    expect(FORBIDDEN_FINANCE_BUCKET_MARKERS).toEqual(
      expect.arrayContaining(["24frame-media", "24frame-education", "gc-content-assets", "gc-avatars"]),
    );
    expect(isForbiddenFinanceBucket("24frame-finance-dev")).toBe(false);
    expect(isForbiddenFinanceBucket("24frame-media-prod")).toBe(true);
    expect(isForbiddenFinanceBucket("gc-content-assets-prod")).toBe(true);
    process.env.S3_BUCKET = "title-film-bucket";
    expect(isForbiddenFinanceBucket("title-film-bucket")).toBe(true);
    expect(() => assertFinanceBucketName("gc-avatars-dev")).toThrow(/dedicated 24Frame finance bucket/);
  });

  it("keeps object keys on the org prefix", () => {
    const orgId = "11111111-1111-4111-8111-111111111111";
    const other = "22222222-2222-4222-8222-222222222222";
    const importKey = financeImportObjectKey({
      orgId,
      contentHash: "abc",
      filename: "Aug Sales.xlsx",
    });
    const statementKey = financeStatementObjectKey({
      orgId,
      periodId: "33333333-3333-4333-8333-333333333333",
      format: "pdf",
    });
    expect(importKey).toBe(`orgs/${orgId}/imports/abc/Aug-Sales.xlsx`);
    expect(statementKey).toContain(`orgs/${orgId}/statements/`);
    expect(statementKey.endsWith("24frame-statement.pdf")).toBe(true);
    expect(financeObjectKeyBelongsToOrg(importKey, orgId)).toBe(true);
    expect(financeObjectKeyBelongsToOrg(importKey, other)).toBe(false);
  });

  it("never falls back to title or media AWS env names", () => {
    expect(s3Src).toContain("FINANCE_AWS_ACCESS_KEY_ID");
    expect(s3Src).toContain("S3_FINANCE_BUCKET");
    expect(s3Src).not.toContain("from \"@/lib/s3\"");
    expect(s3Src).not.toContain("from \"@/lib/s3-avatars\"");
    expect(s3Src).not.toContain("from \"@/lib/s3-social-media\"");
    expect(s3Src).not.toContain("process.env.AWS_ACCESS_KEY_ID");
    expect(s3Src).not.toContain("process.env.AWS_SECRET_ACCESS_KEY");
    expect(s3Src).not.toContain("process.env.AWS_REGION");
    expect(s3Src).not.toContain("process.env.MEDIA_AWS_");
    expect(cfSrc).toContain("FINANCE_CLOUDFRONT_DOMAIN");
    expect(cfSrc).not.toContain("process.env.CLOUDFRONT_");
    expect(cfSrc).not.toContain("process.env.MEDIA_CLOUDFRONT");
    expect(awsSrc).toContain("Live finance buckets");
    expect(readFileSync("src/lib/aurora.ts", "utf8")).toContain("frame-aurora-dev");
    expect(readFileSync("src/lib/aurora.ts", "utf8")).not.toContain("24frame-aurora-");
  });

  it("keeps Next off parse and statement generation", () => {
    expect(actions).toContain("request_sales_import");
    expect(actions).not.toContain("parseSalesFile");
    expect(actions).not.toContain("import_sales");
    expect(exportRoute).toContain("request_finance_export");
    expect(exportRoute).toContain("signedFinanceUrl");
    expect(exportRoute).not.toContain("exportStatement");
    expect(exportRoute).not.toContain("loadRecipientStatement");
  });
});
