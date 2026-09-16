import "server-only";

import { getSignedCookies, getSignedUrl } from "@aws-sdk/cloudfront-signer";

import {
  EDUCATION_CLOUDFRONT_ENV,
  EDUCATION_SIGNED_URL_TTL_SECONDS,
  educationHlsCookiePath,
  educationHlsCookieResource,
} from "@/lib/education";

// Dedicated Education CloudFront signer. Output-bucket HLS only.
// Do not import @/lib/cloudfront or @/lib/social-media-cloudfront.
// Do not read CLOUDFRONT_* / MEDIA_CLOUDFRONT_* / FINANCE_CLOUDFRONT_*.
//
// Query-string signing the master playlist leaves relative child
// `source_hls.m3u8` / `.ts` unsigned (403 MissingKey). Signed cookies
// cover `courses/{courseId}/lessons/{lessonId}/hls/*`. The member
// player uses `/api/education/hls/...` so those cookies authorize
// children. A browser cannot store Domain=*.cloudfront.net cookies
// from the app host; the route attaches the Cookie header server-side.

function requireEducationCf(name: (typeof EDUCATION_CLOUDFRONT_ENV)[number]): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is not set`);
  return value;
}

export function isEducationCloudfrontConfigured(): boolean {
  return EDUCATION_CLOUDFRONT_ENV.every((name) => !!process.env[name]);
}

export function educationCloudfrontOrigin(): { href: string; hostname: string } {
  const raw = requireEducationCf("EDUCATION_CLOUDFRONT_DOMAIN").replace(/\/+$/, "");
  const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(href);
  return { href: url.origin, hostname: url.hostname };
}

export function educationCloudfrontObjectUrl(storageKey: string): string {
  const key = storageKey.replace(/^\/+/, "");
  return `${educationCloudfrontOrigin().href}/${key}`;
}

export function signEducationCloudfrontUrl(
  storageKey: string,
  ttlSeconds: number = EDUCATION_SIGNED_URL_TTL_SECONDS,
): string {
  const url = educationCloudfrontObjectUrl(storageKey);
  const keyPairId = requireEducationCf("EDUCATION_CLOUDFRONT_KEY_PAIR_ID");
  const privateKey = requireEducationCf("EDUCATION_CLOUDFRONT_PRIVATE_KEY");
  const dateLessThan = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  return getSignedUrl({ url, keyPairId, privateKey, dateLessThan });
}

export type EducationCloudfrontSignedCookies = {
  "CloudFront-Policy": string;
  "CloudFront-Signature": string;
  "CloudFront-Key-Pair-Id": string;
};

export function educationLessonCookieResource(courseId: string, lessonId: string): string {
  return educationHlsCookieResource(educationCloudfrontOrigin().href, courseId, lessonId);
}

export function signEducationCloudfrontCookies(
  courseId: string,
  lessonId: string,
  ttlSeconds: number = EDUCATION_SIGNED_URL_TTL_SECONDS,
): EducationCloudfrontSignedCookies {
  const resource = educationLessonCookieResource(courseId, lessonId);
  const keyPairId = requireEducationCf("EDUCATION_CLOUDFRONT_KEY_PAIR_ID");
  const privateKey = requireEducationCf("EDUCATION_CLOUDFRONT_PRIVATE_KEY");
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const policy = JSON.stringify({
    Statement: [
      {
        Resource: resource,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expires },
        },
      },
    ],
  });
  const signed = getSignedCookies({ keyPairId, privateKey, policy });
  const policyCookie = signed["CloudFront-Policy"];
  const signature = signed["CloudFront-Signature"];
  const pairId = signed["CloudFront-Key-Pair-Id"];
  if (!policyCookie || !signature || !pairId) {
    throw new Error("Education CloudFront cookie signing did not return a custom policy set");
  }
  return {
    "CloudFront-Policy": policyCookie,
    "CloudFront-Signature": signature,
    "CloudFront-Key-Pair-Id": pairId,
  };
}

export function educationCloudfrontCookieSetOptions(
  courseId: string,
  lessonId: string,
  ttlSeconds: number = EDUCATION_SIGNED_URL_TTL_SECONDS,
): {
  domain: string;
  path: string;
  secure: true;
  httpOnly: true;
  sameSite: "none";
  maxAge: number;
} {
  return {
    domain: educationCloudfrontOrigin().hostname,
    path: educationHlsCookiePath(courseId, lessonId),
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: ttlSeconds,
  };
}

export function educationCloudfrontCookieHeader(
  cookies: EducationCloudfrontSignedCookies,
): string {
  return [
    `CloudFront-Policy=${cookies["CloudFront-Policy"]}`,
    `CloudFront-Signature=${cookies["CloudFront-Signature"]}`,
    `CloudFront-Key-Pair-Id=${cookies["CloudFront-Key-Pair-Id"]}`,
  ].join("; ");
}
