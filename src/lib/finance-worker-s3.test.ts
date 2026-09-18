import { afterEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(function S3ClientMock() {
      return { send: mockSend };
    }),
  };
});

import { S3Client } from "@aws-sdk/client-s3";

import { createFinanceWorkerS3 } from "./finance-worker-s3";

const ORG = "11111111-1111-4111-8111-111111111111";

describe("finance worker S3", () => {
  afterEach(() => {
    mockSend.mockReset();
    vi.mocked(S3Client).mockClear();
  });

  it("uses FINANCE_AWS_* and allows the ECS task-role chain when keys are absent", () => {
    createFinanceWorkerS3({
      FINANCE_AWS_REGION: "us-west-2",
      S3_FINANCE_BUCKET: "24frame-finance-dev",
      AWS_ACCESS_KEY_ID: "title-key",
      AWS_SECRET_ACCESS_KEY: "title-secret",
      AWS_REGION: "us-east-1",
    });
    expect(S3Client).toHaveBeenCalledWith({ region: "us-west-2" });

    vi.mocked(S3Client).mockClear();
    createFinanceWorkerS3({
      FINANCE_AWS_REGION: "us-west-2",
      S3_FINANCE_BUCKET: "24frame-finance-dev",
      FINANCE_AWS_ACCESS_KEY_ID: "finance-key",
      FINANCE_AWS_SECRET_ACCESS_KEY: "finance-secret",
    });
    expect(S3Client).toHaveBeenCalledWith({
      region: "us-west-2",
      credentials: { accessKeyId: "finance-key", secretAccessKey: "finance-secret" },
    });
  });

  it("refuses title/media buckets and cross-org keys", async () => {
    expect(() =>
      createFinanceWorkerS3({
        FINANCE_AWS_REGION: "us-west-2",
        S3_FINANCE_BUCKET: "24frame-media-prod",
      }),
    ).toThrow(/dedicated 24Frame finance bucket/);
    const s3 = createFinanceWorkerS3({
      FINANCE_AWS_REGION: "us-west-2",
      S3_FINANCE_BUCKET: "24frame-finance-dev",
    });
    await expect(s3.getObject("orgs/other/imports/x/a.csv", ORG)).rejects.toThrow(
      /organization's prefix/,
    );
  });
});
