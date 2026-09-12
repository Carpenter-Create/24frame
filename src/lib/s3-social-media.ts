import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  isForbiddenMediaBucket,
  isForbiddenMediaKey,
  parsePostMedia,
  SOCIAL_MEDIA_PUT_TTL_SECONDS,
  SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS,
  type SocialMediaContentType,
  type SocialMediaKind,
} from "@/lib/social-media";
import {
  isMediaCloudfrontConfigured,
  signSocialMediaCloudfrontUrl,
} from "@/lib/social-media-cloudfront";

// Isolated 24frame-media S3 client. Ideas from donor #9 s3.ts + actions.ts.
// Never import @/lib/s3 / @/lib/cloudfront / @/lib/mediaconvert.
// Source bucket is the only write target in v0 (progressive playback).

export const MEDIA_S3_ENV = ["S3_MEDIA_SOURCE_BUCKET", "S3_MEDIA_OUTPUT_BUCKET"] as const;

function mediaRegion(): string {
  const region = process.env.AWS_REGION;
  if (!region) throw new Error("AWS_REGION environment variable is not set");
  return region;
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
  return { bucket: mediaSourceBucket(), s3: new S3Client({ region: mediaRegion() }) };
}

export async function presignSocialMediaPut(
  key: string,
  contentType: SocialMediaContentType,
): Promise<string> {
  if (isForbiddenMediaKey(key)) {
    throw new Error("Media key is not allowed");
  }
  const { bucket, s3 } = mediaClient();
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: "private, max-age=300",
    }),
    { expiresIn: SOCIAL_MEDIA_PUT_TTL_SECONDS },
  );
}

export async function presignSocialMediaGet(key: string): Promise<string> {
  if (isForbiddenMediaKey(key)) {
    throw new Error("Media key is not allowed");
  }
  const { bucket, s3 } = mediaClient();
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS,
  });
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
};

export async function signedSocialMediaItems(media: unknown): Promise<SignedSocialMedia[]> {
  const items = parsePostMedia(media);
  const signed = await Promise.all(
    items.map(async (item) => {
      const url = await signedSocialMediaUrl(item.key);
      return url ? { kind: item.kind, url, contentType: item.contentType } : null;
    }),
  );
  return signed.filter((item): item is SignedSocialMedia => !!item);
}

export async function signedSocialMediaByPostId(
  posts: readonly { id: string; media: unknown }[],
): Promise<Map<string, SignedSocialMedia[]>> {
  const entries = await Promise.all(
    posts.map(async (post) => [post.id, await signedSocialMediaItems(post.media)] as const),
  );
  return new Map(entries);
}
