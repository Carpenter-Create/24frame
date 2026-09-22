import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  isForbiddenMediaBucket,
  isForbiddenMediaKey,
  SOCIAL_IMAGE_MAX_BYTES,
  SOCIAL_MEDIA_PUT_TTL_SECONDS,
  SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS,
  socialMediaKindFor,
  type SocialMediaContentType,
  type SocialMediaKind,
  type SocialMediaLane,
} from "@/lib/social-media";
import { socialMediaProxies, socialMediaProxiesByPostId } from "@/lib/social-edge";
import {
  isMediaCloudfrontConfigured,
  signSocialMediaCloudfrontUrl,
} from "@/lib/social-media-cloudfront";
import { privateMaxAgeCacheControl, stablePresignOptions } from "@/lib/signing-window";

// Isolated 24frame-media S3 client. Ideas from donor #9 s3.ts + actions.ts.
// Never import @/lib/s3 / @/lib/cloudfront / @/lib/mediaconvert.
// Source bucket is the only write target in v0 (progressive playback).
// Credentials and region are MEDIA_AWS_* only — title AWS_* is a different
// account (gc-content-assets, us-east-1). No default-chain fallback.

export const MEDIA_S3_ENV = ["S3_MEDIA_SOURCE_BUCKET", "S3_MEDIA_OUTPUT_BUCKET"] as const;
export const MEDIA_AWS_ENV = [
  "MEDIA_AWS_ACCESS_KEY_ID",
  "MEDIA_AWS_SECRET_ACCESS_KEY",
  "MEDIA_AWS_REGION",
] as const;

function requireMediaAwsEnv(name: (typeof MEDIA_AWS_ENV)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

function mediaRegion(): string {
  return requireMediaAwsEnv("MEDIA_AWS_REGION");
}

function mediaAwsCredentials(): { accessKeyId: string; secretAccessKey: string } {
  return {
    accessKeyId: requireMediaAwsEnv("MEDIA_AWS_ACCESS_KEY_ID"),
    secretAccessKey: requireMediaAwsEnv("MEDIA_AWS_SECRET_ACCESS_KEY"),
  };
}

function assertMediaBucket(bucket: string, envName: (typeof MEDIA_S3_ENV)[number]): string {
  if (!bucket) throw new Error(`${envName} environment variable is not set`);
  if (isForbiddenMediaBucket(bucket)) {
    throw new Error(`${envName} must be a 24frame-media bucket, not S3_BUCKET`);
  }
  return bucket;
}

export function mediaSourceBucket(): string {
  return assertMediaBucket(process.env.S3_MEDIA_SOURCE_BUCKET ?? "", "S3_MEDIA_SOURCE_BUCKET");
}

export function mediaOutputBucket(): string {
  return assertMediaBucket(process.env.S3_MEDIA_OUTPUT_BUCKET ?? "", "S3_MEDIA_OUTPUT_BUCKET");
}

function mediaClient(): { bucket: string; s3: S3Client } {
  return {
    bucket: mediaSourceBucket(),
    s3: new S3Client({
      region: mediaRegion(),
      credentials: mediaAwsCredentials(),
    }),
  };
}

export async function presignSocialMediaPut(
  key: string,
  contentType: SocialMediaContentType,
): Promise<string> {
  if (isForbiddenMediaKey(key)) {
    throw new Error("Media key is not allowed");
  }
  const { bucket, s3 } = mediaClient();
  // Browser PUT only sends Content-Type. Do not sign Cache-Control —
  // a signed extra header 403s the PUT (stills, Stories, welcome).
  // GET ResponseCacheControl / CloudFront signing stay on the read path.
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: SOCIAL_MEDIA_PUT_TTL_SECONDS },
  );
}

export async function presignSocialMediaGet(key: string): Promise<string> {
  if (isForbiddenMediaKey(key)) {
    throw new Error("Media key is not allowed");
  }
  const { bucket, s3 } = mediaClient();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseCacheControl: privateMaxAgeCacheControl(SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS),
    }),
    stablePresignOptions(SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS),
  );
}

function imageTypeForStoredObject(key: string, header: string | undefined): string | null {
  const normalized = header?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (socialMediaKindFor(normalized) === "image") return normalized;
  if (/\.jpe?g$/i.test(key)) return "image/jpeg";
  if (/\.png$/i.test(key)) return "image/png";
  if (/\.webp$/i.test(key)) return "image/webp";
  if (/\.gif$/i.test(key)) return "image/gif";
  return null;
}

/** Server-side read of one media object. Null when the key is closed, empty, or not an image. */
export async function readSocialMediaObject(
  key: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  if (isForbiddenMediaKey(key)) return null;
  try {
    const { bucket, s3 } = mediaClient();
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes || bytes.byteLength === 0 || bytes.byteLength > SOCIAL_IMAGE_MAX_BYTES) return null;
    const contentType = imageTypeForStoredObject(key, response.ContentType);
    if (!contentType) return null;
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function signedSocialMediaUrl(key: string): Promise<string | null> {
  if (isForbiddenMediaKey(key)) return null;
  try {
    if (isMediaCloudfrontConfigured()) {
      return signSocialMediaCloudfrontUrl(key);
    }
    return await presignSocialMediaGet(key);
  } catch {
    return null;
  }
}

export type SignedSocialMedia = {
  kind: SocialMediaKind;
  url: string;
  contentType: SocialMediaContentType;
  playbackId?: string;
};

/**
 * Display SoT for feeds / Home / Explore / profile activity.
 * Same-origin edge proxy — no CloudFront/S3 RSA on the page path.
 * Privileged short-lived GETs stay on signedSocialMediaUrl / presignSocialMediaGet
 * (media API, welcome/cover hops that need a direct object URL).
 */
export async function signedSocialMediaItems(
  media: unknown,
  authorId: string,
  lane: SocialMediaLane = "posts",
): Promise<SignedSocialMedia[]> {
  return socialMediaProxies(media, authorId, lane);
}

export async function signedSocialMediaByPostId(
  posts: readonly { id: string; author_id: string; media: unknown }[],
): Promise<Map<string, SignedSocialMedia[]>> {
  return socialMediaProxiesByPostId(posts);
}
