import "server-only";

import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import {
  EDUCATION_CLOUDFRONT_ENV,
  EDUCATION_SIGNED_URL_TTL_SECONDS,
} from "@/lib/education";

// Dedicated Education CloudFront signer. Output-bucket HLS only.
// Do not import @/lib/cloudfront or @/lib/social-media-cloudfront.
// Do not read CLOUDFRONT_* / MEDIA_CLOUDFRONT_* / FINANCE_CLOUDFRONT_*.

function requireEducationCf(name: (typeof EDUCATION_CLOUDFRONT_ENV)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function isEducationCloudfrontConfigured(): boolean {
  return EDUCATION_CLOUDFRONT_ENV.every((name) => !!process.env[name]);
}

export function signEducationCloudfrontUrl(
  storageKey: string,
  ttlSeconds: number = EDUCATION_SIGNED_URL_TTL_SECONDS,
): string {
  const domain = requireEducationCf("EDUCATION_CLOUDFRONT_DOMAIN").replace(/\/+$/, "");
  const keyPairId = requireEducationCf("EDUCATION_CLOUDFRONT_KEY_PAIR_ID");
  const privateKey = requireEducationCf("EDUCATION_CLOUDFRONT_PRIVATE_KEY");
  const key = storageKey.replace(/^\/+/, "");
  const url = `${domain}/${key}`;
  const dateLessThan = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  return getSignedUrl({ url, keyPairId, privateKey, dateLessThan });
}
