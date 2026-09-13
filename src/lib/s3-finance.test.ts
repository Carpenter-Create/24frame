import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend, mockGetSignedUrl } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(function S3ClientMock() {
      return { send: mockSend };
    }),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

vi.mock("@/lib/finance-cloudfront", () => ({
  isFinanceCloudfrontConfigured: vi.fn(() => false),
  signFinanceCloudfrontUrl: vi.fn(),
}));

import { S3Client } from "@aws-sdk/client-s3";

import { FINANCE_AWS_ENV } from "./finance-aws";
import { isFinanceAwsConfigured, presignFinanceGet } from "./s3-finance";

const ORG = "11111111-1111-4111-8111-111111111111";
const KEY = `orgs/${ORG}/imports/abc/sales.csv`;

const FINANCE_AWS = {
  FINANCE_AWS_ACCESS_KEY_ID: "finance-access-key",
  FINANCE_AWS_SECRET_ACCESS_KEY: "finance-secret-key",
  FINANCE_AWS_REGION: "us-east-1",
  S3_FINANCE_BUCKET: "24frame-finance-dev",
};

const TITLE_AWS = {
  AWS_ACCESS_KEY_ID: "title-access-key",
  AWS_SECRET_ACCESS_KEY: "title-secret-key",
  AWS_REGION: "us-west-2",
};

function setFinanceAwsEnv() {
  process.env.FINANCE_AWS_ACCESS_KEY_ID = FINANCE_AWS.FINANCE_AWS_ACCESS_KEY_ID;
  process.env.FINANCE_AWS_SECRET_ACCESS_KEY = FINANCE_AWS.FINANCE_AWS_SECRET_ACCESS_KEY;
  process.env.FINANCE_AWS_REGION = FINANCE_AWS.FINANCE_AWS_REGION;
  process.env.S3_FINANCE_BUCKET = FINANCE_AWS.S3_FINANCE_BUCKET;
}

function clearFinanceAwsEnv() {
  delete process.env.FINANCE_AWS_ACCESS_KEY_ID;
  delete process.env.FINANCE_AWS_SECRET_ACCESS_KEY;
  delete process.env.FINANCE_AWS_REGION;
  delete process.env.S3_FINANCE_BUCKET;
}

describe("s3-finance isolation", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockGetSignedUrl.mockReset();
    vi.mocked(S3Client).mockClear();
    process.env.S3_BUCKET = "gc-content-assets-dev";
    process.env.S3_AVATARS_BUCKET = "gc-avatars-dev";
    process.env.AWS_ACCESS_KEY_ID = TITLE_AWS.AWS_ACCESS_KEY_ID;
    process.env.AWS_SECRET_ACCESS_KEY = TITLE_AWS.AWS_SECRET_ACCESS_KEY;
    process.env.AWS_REGION = TITLE_AWS.AWS_REGION;
    setFinanceAwsEnv();
  });

  afterEach(() => {
    clearFinanceAwsEnv();
  });

  it("constructs S3Client from FINANCE_AWS_* even when title AWS_* is present", async () => {
    mockGetSignedUrl.mockResolvedValueOnce("https://s3.example/finance");
    await presignFinanceGet(KEY, ORG);
    expect(S3Client).toHaveBeenCalledTimes(1);
    const config = vi.mocked(S3Client).mock.calls[0]?.[0];
    expect(config).toMatchObject({
      region: FINANCE_AWS.FINANCE_AWS_REGION,
      credentials: {
        accessKeyId: FINANCE_AWS.FINANCE_AWS_ACCESS_KEY_ID,
        secretAccessKey: FINANCE_AWS.FINANCE_AWS_SECRET_ACCESS_KEY,
      },
    });
    expect(config?.credentials && "accessKeyId" in config.credentials).toBe(true);
    if (config?.credentials && "accessKeyId" in config.credentials) {
      expect(config.credentials.accessKeyId).not.toBe(TITLE_AWS.AWS_ACCESS_KEY_ID);
    }
  });

  it.each([...FINANCE_AWS_ENV, "S3_FINANCE_BUCKET"] as const)(
    "refuses when %s is missing and does not use title AWS_*",
    async (name) => {
      delete process.env[name];
      expect(isFinanceAwsConfigured()).toBe(false);
      await expect(presignFinanceGet(KEY, ORG)).rejects.toThrow(/FINANCE_AWS_|S3_FINANCE_/);
    },
  );

  it("does not fall back to AWS_* when every FINANCE_AWS_* var is missing", async () => {
    clearFinanceAwsEnv();
    process.env.AWS_ACCESS_KEY_ID = TITLE_AWS.AWS_ACCESS_KEY_ID;
    await expect(presignFinanceGet(KEY, ORG)).rejects.toThrow(/FINANCE_AWS_|S3_FINANCE_/);
  });

  it("never imports title s3 or media clients", () => {
    const src = readFileSync("src/lib/s3-finance.ts", "utf8");
    expect(src).not.toContain("from \"@/lib/s3\"");
    expect(src).not.toContain("from \"@/lib/s3-social-media\"");
    expect(src).not.toContain("process.env.S3_BUCKET");
    expect(src).not.toContain("process.env.AWS_ACCESS_KEY_ID");
  });
});
