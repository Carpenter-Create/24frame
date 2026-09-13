import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import {
  assertFinanceBucketName,
  financeObjectKeyBelongsToOrg,
} from "@/lib/finance-aws";

// Worker S3. FINANCE_AWS_* / S3_FINANCE_BUCKET only. Never AWS_* or MEDIA_AWS_*.
// Access keys are optional: ECS task role 24frame-finance-worker is the live path.

export type WorkerEnv = Record<string, string | undefined>;

function requireFinanceEnv(
  env: WorkerEnv,
  name: "FINANCE_AWS_REGION" | "S3_FINANCE_BUCKET",
): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

function financeCredentials(
  env: WorkerEnv,
): { accessKeyId: string; secretAccessKey: string } | undefined {
  const accessKeyId = env.FINANCE_AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.FINANCE_AWS_SECRET_ACCESS_KEY?.trim();
  if (!accessKeyId && !secretAccessKey) return undefined;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("FINANCE_AWS_ACCESS_KEY_ID and FINANCE_AWS_SECRET_ACCESS_KEY must be set together");
  }
  return { accessKeyId, secretAccessKey };
}

export function createFinanceWorkerS3(
  env: WorkerEnv = process.env,
): {
  getObject: (key: string, orgId: string) => Promise<Uint8Array>;
  putObject: (input: {
    key: string;
    orgId: string;
    body: Uint8Array;
    contentType: string;
  }) => Promise<void>;
} {
  const bucket = assertFinanceBucketName(requireFinanceEnv(env, "S3_FINANCE_BUCKET"));
  const region = requireFinanceEnv(env, "FINANCE_AWS_REGION");
  const credentials = financeCredentials(env);
  const s3 = new S3Client({
    region,
    ...(credentials ? { credentials } : {}),
  });

  return {
    async getObject(key, orgId) {
      if (!financeObjectKeyBelongsToOrg(key, orgId)) {
        throw new Error("Finance object key must stay on the organization's prefix");
      }
      const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = await response.Body?.transformToByteArray();
      if (!bytes) throw new Error("Finance object is empty");
      return bytes;
    },
    async putObject(input) {
      if (!financeObjectKeyBelongsToOrg(input.key, input.orgId)) {
        throw new Error("Finance object key must stay on the organization's prefix");
      }
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          CacheControl: "private, max-age=300",
        }),
      );
    },
  };
}
