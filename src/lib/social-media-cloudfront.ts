import "server-only";

import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import { SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS } from "@/lib/social-media";
import { cachedSignedUrl } from "@/lib/signed-url-cache";
import { stableExpiryDate, stableExpiryEpoch } from "@/lib/signing-window";

// Isolated FrameMediaDelivery signer. Ideas from donor Slice 1 / #14
// (distribution d364lvgeu9rmwn) and this repo's title Slice 1 URL shape.
// Do not import @/lib/cloudfront. Title CLOUDFRONT_* stays film/screener.

export const MEDIA_CLOUDFRONT_ENV = [
  "MEDIA_CLOUDFRONT_DOMAIN",
  "MEDIA_CLOUDFRONT_KEY_PAIR_ID",
  "MEDIA_CLOUDFRONT_PRIVATE_KEY",
] as const;

function requireMediaEnv(name: (typeof MEDIA_CLOUDFRONT_ENV)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export function isMediaCloudfrontConfigured(): boolean {
  return MEDIA_CLOUDFRONT_ENV.every((name) => !!process.env[name]);
}

export function signSocialMediaCloudfrontUrl(
  storageKey: string,
  ttlSeconds: number = SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS,
): string {
  const domain = requireMediaEnv("MEDIA_CLOUDFRONT_DOMAIN").replace(/\/+$/, "");
  const keyPairId = requireMediaEnv("MEDIA_CLOUDFRONT_KEY_PAIR_ID");
  const privateKey = requireMediaEnv("MEDIA_CLOUDFRONT_PRIVATE_KEY");
  const key = storageKey.replace(/^\/+/, "");
  const url = `${domain}/${key}`;
  const boundary = stableExpiryEpoch(ttlSeconds);
  return cachedSignedUrl(`media:${key}`, boundary, () =>
    getSignedUrl({
      url,
      keyPairId,
      privateKey,
      dateLessThan: stableExpiryDate(ttlSeconds).toISOString(),
    }),
  );
}
