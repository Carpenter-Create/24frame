import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const { mockGetSignedUrl, mockGetSignedCookies } = vi.hoisted(() => ({
  mockGetSignedUrl: vi.fn(),
  mockGetSignedCookies: vi.fn(),
}));

vi.mock("@aws-sdk/cloudfront-signer", () => ({
  getSignedUrl: mockGetSignedUrl,
  getSignedCookies: mockGetSignedCookies,
}));

import { EDUCATION_CLOUDFRONT_ENV, educationHlsCookiePath, educationHlsCookieResource } from "./education";
import {
  educationCloudfrontCookieHeader,
  educationCloudfrontCookieSetOptions,
  educationCloudfrontObjectUrl,
  educationLessonCookieResource,
  isEducationCloudfrontConfigured,
  signEducationCloudfrontCookies,
  signEducationCloudfrontUrl,
} from "./education-cloudfront";

const COURSE = "06655c31-1111-4111-8111-111111111111";
const LESSON = "9c525955-2222-4222-8222-222222222222";
const OTHER_LESSON = "aaaaaaaa-3333-4333-8333-333333333333";
const OTHER_COURSE = "bbbbbbbb-4444-4444-8444-444444444444";

function setEducationCfEnv() {
  process.env.EDUCATION_CLOUDFRONT_DOMAIN = "https://d-education.cloudfront.net";
  process.env.EDUCATION_CLOUDFRONT_KEY_PAIR_ID = "KEDU";
  process.env.EDUCATION_CLOUDFRONT_PRIVATE_KEY = "education-private";
  process.env.CLOUDFRONT_DOMAIN = "https://title.cloudfront.net";
  process.env.MEDIA_CLOUDFRONT_DOMAIN = "https://media.cloudfront.net";
  process.env.FINANCE_CLOUDFRONT_DOMAIN = "https://finance.cloudfront.net";
}

describe("education CloudFront", () => {
  it("signs an Education path and does not read title/media/finance CLOUDFRONT_*", () => {
    setEducationCfEnv();
    mockGetSignedUrl.mockReturnValueOnce("https://d-education.cloudfront.net/signed");

    expect(isEducationCloudfrontConfigured()).toBe(true);
    expect(signEducationCloudfrontUrl("courses/u/lessons/l/hls/source.m3u8")).toBe(
      "https://d-education.cloudfront.net/signed",
    );
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://d-education.cloudfront.net/courses/u/lessons/l/hls/source.m3u8",
        keyPairId: "KEDU",
        privateKey: "education-private",
      }),
    );
    expect(EDUCATION_CLOUDFRONT_ENV).not.toContain("CLOUDFRONT_DOMAIN");
    expect(EDUCATION_CLOUDFRONT_ENV).not.toContain("MEDIA_CLOUDFRONT_DOMAIN");
    expect(EDUCATION_CLOUDFRONT_ENV).not.toContain("FINANCE_CLOUDFRONT_DOMAIN");
  });

  it("scopes signed cookies to one lesson HLS prefix and isolates neighboring lessons", () => {
    setEducationCfEnv();
    mockGetSignedCookies.mockReturnValueOnce({
      "CloudFront-Policy": "policy-a",
      "CloudFront-Signature": "sig-a",
      "CloudFront-Key-Pair-Id": "KEDU",
    });

    const resource = educationLessonCookieResource(COURSE, LESSON);
    expect(resource).toBe(
      `https://d-education.cloudfront.net/courses/${COURSE}/lessons/${LESSON}/hls/*`,
    );
    expect(resource).toBe(
      educationHlsCookieResource("https://d-education.cloudfront.net", COURSE, LESSON),
    );
    expect(educationHlsCookieResource("https://d-education.cloudfront.net", COURSE, OTHER_LESSON)).not.toBe(
      resource,
    );
    expect(educationHlsCookieResource("https://d-education.cloudfront.net", OTHER_COURSE, LESSON)).not.toBe(
      resource,
    );
    expect(resource).not.toContain("title.cloudfront.net");
    expect(resource).not.toContain("media.cloudfront.net");
    expect(resource).not.toContain("finance.cloudfront.net");

    const cookies = signEducationCloudfrontCookies(COURSE, LESSON);
    expect(cookies).toEqual({
      "CloudFront-Policy": "policy-a",
      "CloudFront-Signature": "sig-a",
      "CloudFront-Key-Pair-Id": "KEDU",
    });
    const policy = JSON.parse(mockGetSignedCookies.mock.calls[0]?.[0]?.policy as string) as {
      Statement: { Resource: string }[];
    };
    expect(policy.Statement[0]?.Resource).toBe(resource);
    expect(mockGetSignedCookies).toHaveBeenCalledWith(
      expect.objectContaining({
        keyPairId: "KEDU",
        privateKey: "education-private",
      }),
    );
    expect(educationCloudfrontCookieHeader(cookies)).toBe(
      "CloudFront-Policy=policy-a; CloudFront-Signature=sig-a; CloudFront-Key-Pair-Id=KEDU",
    );

    const options = educationCloudfrontCookieSetOptions(COURSE, LESSON);
    expect(options.domain).toBe("d-education.cloudfront.net");
    expect(options.path).toBe(educationHlsCookiePath(COURSE, LESSON));
    expect(options.path).toBe(`/courses/${COURSE}/lessons/${LESSON}/hls`);
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("none");
    expect(educationCloudfrontObjectUrl(`courses/${COURSE}/lessons/${LESSON}/hls/source.m3u8`)).toBe(
      `https://d-education.cloudfront.net/courses/${COURSE}/lessons/${LESSON}/hls/source.m3u8`,
    );
  });

  it("never reads title, media, or finance CloudFront env from this module", () => {
    const src = readFileSync("src/lib/education-cloudfront.ts", "utf8");
    expect(src).toContain("getSignedCookies");
    expect(src).toContain("EDUCATION_CLOUDFRONT_DOMAIN");
    expect(src).not.toContain("process.env.CLOUDFRONT_");
    expect(src).not.toContain("process.env.MEDIA_CLOUDFRONT_");
    expect(src).not.toContain("process.env.FINANCE_CLOUDFRONT_");
    expect(src).not.toContain('from "@/lib/cloudfront"');
    expect(src).not.toContain('from "@/lib/social-media-cloudfront"');
    expect(src).not.toContain('from "@/lib/finance-cloudfront"');
  });
});
