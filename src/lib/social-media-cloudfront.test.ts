import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSignedUrl } = vi.hoisted(() => ({
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/cloudfront-signer", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

import { _resetSignedUrlCache } from "./signed-url-cache";
import { isMediaCloudfrontConfigured, MEDIA_CLOUDFRONT_ENV, signSocialMediaCloudfrontUrl } from "./social-media-cloudfront";

describe("social media CloudFront", () => {
  beforeEach(() => {
    mockGetSignedUrl.mockReset();
    _resetSignedUrlCache();
    process.env.MEDIA_CLOUDFRONT_DOMAIN = "https://d364lvgeu9rmwn.cloudfront.net";
    process.env.MEDIA_CLOUDFRONT_KEY_PAIR_ID = "KMEDIA";
    process.env.MEDIA_CLOUDFRONT_PRIVATE_KEY = "media-private";
  });

  it("signs a FrameMediaDelivery path and does not read title CLOUDFRONT_*", () => {
    process.env.MEDIA_CLOUDFRONT_DOMAIN = "https://d364lvgeu9rmwn.cloudfront.net";
    process.env.MEDIA_CLOUDFRONT_KEY_PAIR_ID = "KMEDIA";
    process.env.MEDIA_CLOUDFRONT_PRIVATE_KEY = "media-private";
    process.env.CLOUDFRONT_DOMAIN = "https://title.cloudfront.net";
    process.env.CLOUDFRONT_KEY_PAIR_ID = "KTITLE";
    process.env.CLOUDFRONT_PRIVATE_KEY = "title-private";
    mockGetSignedUrl.mockReturnValueOnce("https://d364lvgeu9rmwn.cloudfront.net/signed");

    expect(isMediaCloudfrontConfigured()).toBe(true);
    expect(signSocialMediaCloudfrontUrl("posts/u/x.jpg")).toBe(
      "https://d364lvgeu9rmwn.cloudfront.net/signed",
    );
    expect(mockGetSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://d364lvgeu9rmwn.cloudfront.net/posts/u/x.jpg",
        keyPairId: "KMEDIA",
        privateKey: "media-private",
      }),
    );
    expect(MEDIA_CLOUDFRONT_ENV).not.toContain("CLOUDFRONT_DOMAIN");
    const first = mockGetSignedUrl.mock.calls[0]?.[0] as { dateLessThan: string };
    expect(new Date(first.dateLessThan).getTime() % 300_000).toBe(0);
  });

  it("quantises expiry so two signs in the same window share one RSA signature", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-05T14:01:00Z"));
    mockGetSignedUrl.mockReturnValue("https://d364lvgeu9rmwn.cloudfront.net/signed");
    expect(signSocialMediaCloudfrontUrl("posts/u/x.jpg")).toBe(
      "https://d364lvgeu9rmwn.cloudfront.net/signed",
    );
    expect(signSocialMediaCloudfrontUrl("posts/u/x.jpg")).toBe(
      "https://d364lvgeu9rmwn.cloudfront.net/signed",
    );
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
