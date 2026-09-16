import { describe, expect, it, vi } from "vitest";

const { mockGetSignedUrl } = vi.hoisted(() => ({
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/cloudfront-signer", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { EDUCATION_CLOUDFRONT_ENV } from "./education";
import { isEducationCloudfrontConfigured, signEducationCloudfrontUrl } from "./education-cloudfront";

describe("education CloudFront", () => {
  it("signs an Education path and does not read title/media/finance CLOUDFRONT_*", () => {
    process.env.EDUCATION_CLOUDFRONT_DOMAIN = "https://d-education.cloudfront.net";
    process.env.EDUCATION_CLOUDFRONT_KEY_PAIR_ID = "KEDU";
    process.env.EDUCATION_CLOUDFRONT_PRIVATE_KEY = "education-private";
    process.env.CLOUDFRONT_DOMAIN = "https://title.cloudfront.net";
    process.env.MEDIA_CLOUDFRONT_DOMAIN = "https://media.cloudfront.net";
    process.env.FINANCE_CLOUDFRONT_DOMAIN = "https://finance.cloudfront.net";
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
});
