import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  assertFinanceBucketName,
  FINANCE_AWS_ENV,
  FINANCE_SIGNED_URL_TTL_SECONDS,
  financeObjectKeyBelongsToOrg,
  S3_FINANCE_ENV,
} from "@/lib/finance-aws";
import { isFinanceCloudfrontConfigured, signFinanceCloudfrontUrl } from "@/lib/finance-cloudfront";

// Isolated 24Frame finance S3 client. Never import @/lib/s3, @/lib/cloudfront,
// @/lib/s3-avatars, or @/lib/s3-social-media. No AWS_* / MEDIA_AWS_* fallback.

function requireFinanceEnv(name: (typeof FINANCE_AWS_ENV)[number] | (typeof S3_FINANCE_ENV)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function isFinanceAwsConfigured(): boolean {
  return [...FINANCE_AWS_ENV, ...S3_FINANCE_ENV].every((name) => !!process.env[name]);
}

function financeClient(): { bucket: string; s3: S3Client } {
  return {
    bucket: assertFinanceBucketName(requireFinanceEnv("S3_FINANCE_BUCKET")),
    s3: new S3Client({
      region: requireFinanceEnv("FINANCE_AWS_REGION"),
      credentials: {
        accessKeyId: requireFinanceEnv("FINANCE_AWS_ACCESS_KEY_ID"),
        secretAccessKey: requireFinanceEnv("FINANCE_AWS_SECRET_ACCESS_KEY"),
      },
    }),
  };
}

export async function getFinanceObject(input: {
  key: string;
  orgId: string;
}): Promise<Uint8Array> {
  if (!financeObjectKeyBelongsToOrg(input.key, input.orgId)) {
    throw new Error("Finance object key must stay on the organization's prefix");
  }
  const { bucket, s3 } = financeClient();
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: input.key }));
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) throw new Error("Finance object is empty");
  return bytes;
}

export async function putFinanceObject(input: {
  key: string;
  orgId: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  if (!financeObjectKeyBelongsToOrg(input.key, input.orgId)) {
    throw new Error("Finance object key must stay on the organization's prefix");
  }
  const { bucket, s3 } = financeClient();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: "private, max-age=300",
    }),
  );
}

export async function presignFinanceGet(key: string, orgId: string): Promise<string> {
  if (!financeObjectKeyBelongsToOrg(key, orgId)) {
    throw new Error("Finance object key must stay on the organization's prefix");
  }
  const { bucket, s3 } = financeClient();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: FINANCE_SIGNED_URL_TTL_SECONDS,
  });
}

export async function signedFinanceUrl(key: string, orgId: string): Promise<string | null> {
  if (!financeObjectKeyBelongsToOrg(key, orgId)) return null;
  try {
    if (isFinanceCloudfrontConfigured()) {
      return signFinanceCloudfrontUrl(key);
    }
    if (!isFinanceAwsConfigured()) return null;
    return await presignFinanceGet(key, orgId);
  } catch {
    return null;
  }
}
