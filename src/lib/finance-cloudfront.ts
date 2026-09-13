import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

import { FINANCE_CLOUDFRONT_ENV, FINANCE_SIGNED_URL_TTL_SECONDS } from "@/lib/finance-aws";
import { stableExpiryDate } from "@/lib/signing-window";

// Dedicated finance CloudFront. Do not read CLOUDFRONT_* or MEDIA_CLOUDFRONT_*.

function requireFinanceCf(name: (typeof FINANCE_CLOUDFRONT_ENV)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function isFinanceCloudfrontConfigured(): boolean {
  return FINANCE_CLOUDFRONT_ENV.every((name) => !!process.env[name]);
}

export function signFinanceCloudfrontUrl(key: string): string {
  const domain = requireFinanceCf("FINANCE_CLOUDFRONT_DOMAIN").replace(/\/+$/, "");
  const keyPairId = requireFinanceCf("FINANCE_CLOUDFRONT_KEY_PAIR_ID");
  const privateKey = requireFinanceCf("FINANCE_CLOUDFRONT_PRIVATE_KEY");
  const url = `${domain}/${key.replace(/^\/+/, "")}`;
  return getSignedUrl({
    url,
    keyPairId,
    privateKey,
    dateLessThan: stableExpiryDate(FINANCE_SIGNED_URL_TTL_SECONDS).toISOString(),
  });
}
