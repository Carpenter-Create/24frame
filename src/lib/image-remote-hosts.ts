// next/image remote hosts. Title CloudFront + Social media CloudFront + the
// S3 preview addressing styles already used for signed GETs. No new env names.
//
// The optimiser only fetches hosts listed here. Social avatars and post images
// were raw <img> because these hosts were never allowlisted.

export type ImageRemotePattern = {
  protocol: "https";
  hostname: string;
};

export const TITLE_CLOUDFRONT_HOST_FALLBACK = "delivery.globalcontent.co";
// FrameMediaDelivery distribution already named in social-media-cloudfront.
export const MEDIA_CLOUDFRONT_HOST_FALLBACK = "d364lvgeu9rmwn.cloudfront.net";
export const TITLE_S3_DEV_HOST = "gc-content-assets-dev.s3.us-east-1.amazonaws.com";

const DEFAULT_S3_REGIONS = ["us-east-1", "us-west-2"] as const;

export function hostnameFromEnvHost(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;
  try {
    const value = raw.trim();
    return new URL(value.startsWith("http") ? value : `https://${value}`).hostname;
  } catch {
    return fallback;
  }
}

function pushHost(patterns: ImageRemotePattern[], hostname: string | null | undefined) {
  if (!hostname) return;
  if (patterns.some((pattern) => pattern.hostname === hostname)) return;
  patterns.push({ protocol: "https", hostname });
}

export function imageRemotePatterns(env: NodeJS.Dict<string> = process.env): ImageRemotePattern[] {
  const patterns: ImageRemotePattern[] = [];
  pushHost(patterns, hostnameFromEnvHost(env.CLOUDFRONT_DOMAIN, TITLE_CLOUDFRONT_HOST_FALLBACK));
  pushHost(patterns, hostnameFromEnvHost(env.MEDIA_CLOUDFRONT_DOMAIN, MEDIA_CLOUDFRONT_HOST_FALLBACK));
  pushHost(patterns, TITLE_S3_DEV_HOST);

  const regions = new Set<string>(DEFAULT_S3_REGIONS);
  if (env.AWS_REGION) regions.add(env.AWS_REGION);
  if (env.MEDIA_AWS_REGION) regions.add(env.MEDIA_AWS_REGION);

  for (const region of regions) {
    pushHost(patterns, `s3.${region}.amazonaws.com`);
    // Virtual-hosted preview/avatar buckets. Region-scoped — not *.amazonaws.com.
    pushHost(patterns, `*.s3.${region}.amazonaws.com`);
  }

  if (env.S3_AVATARS_BUCKET && env.AWS_REGION) {
    pushHost(patterns, `${env.S3_AVATARS_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`);
  }
  if (env.S3_MEDIA_SOURCE_BUCKET && env.MEDIA_AWS_REGION) {
    pushHost(patterns, `${env.S3_MEDIA_SOURCE_BUCKET}.s3.${env.MEDIA_AWS_REGION}.amazonaws.com`);
  }

  return patterns;
}
