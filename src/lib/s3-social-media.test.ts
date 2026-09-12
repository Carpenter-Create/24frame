import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend, mockGetSignedUrl } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(function S3ClientMock() {
      return { send: mockSend };
    }),
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

vi.mock("@/lib/social-media-cloudfront", () => ({
  isMediaCloudfrontConfigured: vi.fn(() => false),
  signSocialMediaCloudfrontUrl: vi.fn(),
}));

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

import { isMediaCloudfrontConfigured, signSocialMediaCloudfrontUrl } from "@/lib/social-media-cloudfront";
import {
  mediaOutputBucket,
  mediaSourceBucket,
  presignSocialMediaGet,
  presignSocialMediaPut,
  signedSocialMediaItems,
  signedSocialMediaUrl,
} from "./s3-social-media";

const USER = "11111111-1111-4111-8111-111111111111";
const OBJECT = "22222222-2222-4222-8222-222222222222";
const KEY = `posts/${USER}/${OBJECT}.jpg`;

describe("s3-social-media isolated lane", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockGetSignedUrl.mockReset();
    vi.mocked(isMediaCloudfrontConfigured).mockReturnValue(false);
    vi.mocked(signSocialMediaCloudfrontUrl).mockReset();
    process.env.S3_MEDIA_SOURCE_BUCKET = "test-media-source-bucket";
    process.env.S3_MEDIA_OUTPUT_BUCKET = "test-media-output-bucket";
    process.env.S3_BUCKET = "test-bucket";
    process.env.S3_AVATARS_BUCKET = "test-avatars-bucket";
  });

  it("presigns PUT/GET on the media source bucket, never S3_BUCKET", async () => {
    mockGetSignedUrl.mockResolvedValueOnce("https://s3.example/put");
    await expect(presignSocialMediaPut(KEY, "image/jpeg")).resolves.toBe("https://s3.example/put");
    const putCmd = mockGetSignedUrl.mock.calls[0]?.[1] as PutObjectCommand;
    expect(putCmd).toBeInstanceOf(PutObjectCommand);
    expect(putCmd.input.Bucket).toBe("test-media-source-bucket");
    expect(putCmd.input.Bucket).not.toBe(process.env.S3_BUCKET);
    expect(putCmd.input.Key).toBe(KEY);

    mockGetSignedUrl.mockResolvedValueOnce("https://s3.example/get");
    await expect(presignSocialMediaGet(KEY)).resolves.toBe("https://s3.example/get");
    const getCmd = mockGetSignedUrl.mock.calls[1]?.[1] as GetObjectCommand;
    expect(getCmd).toBeInstanceOf(GetObjectCommand);
    expect(getCmd.input.Bucket).toBe("test-media-source-bucket");
  });

  it("refuses when the media source bucket is the title bucket", () => {
    process.env.S3_MEDIA_SOURCE_BUCKET = process.env.S3_BUCKET;
    expect(() => mediaSourceBucket()).toThrow(/24frame-media bucket, not S3_BUCKET/);
  });

  it("refuses gc-content-assets as the media source bucket", () => {
    process.env.S3_MEDIA_SOURCE_BUCKET = "gc-content-assets";
    expect(() => mediaSourceBucket()).toThrow(/not S3_BUCKET/);
  });

  it("refuses when the unused output bucket is the title bucket", () => {
    process.env.S3_MEDIA_OUTPUT_BUCKET = process.env.S3_BUCKET;
    expect(() => mediaOutputBucket()).toThrow(/24frame-media bucket, not S3_BUCKET/);
  });

  it("does not sign title-prefix keys", async () => {
    await expect(presignSocialMediaPut(`orgs/${USER}/titles/${OBJECT}/master/a.mov`, "video/mp4")).rejects.toThrow(
      /not allowed/,
    );
    await expect(signedSocialMediaUrl(`orgs/${USER}/titles/${OBJECT}/master/a.mov`)).resolves.toBeNull();
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("uses CloudFront signed URLs when FrameMediaDelivery env is present", async () => {
    vi.mocked(isMediaCloudfrontConfigured).mockReturnValue(true);
    vi.mocked(signSocialMediaCloudfrontUrl).mockReturnValue("https://d364lvgeu9rmwn.cloudfront.net/signed");
    await expect(signedSocialMediaUrl(KEY)).resolves.toBe("https://d364lvgeu9rmwn.cloudfront.net/signed");
    expect(signSocialMediaCloudfrontUrl).toHaveBeenCalledWith(KEY);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("signs stored posts.media keys for display", async () => {
    mockGetSignedUrl.mockResolvedValue("https://s3.example/signed-image");
    const items = await signedSocialMediaItems([
      { kind: "image", key: KEY, contentType: "image/jpeg" },
      { kind: "video", key: `orgs/${USER}/titles/x`, contentType: "video/mp4" },
    ]);
    expect(items).toEqual([
      { kind: "image", url: "https://s3.example/signed-image", contentType: "image/jpeg" },
    ]);
  });

  it("never imports title s3, cloudfront, or mediaconvert", () => {
    const src = readFileSync("src/lib/s3-social-media.ts", "utf8");
    expect(src).toContain("S3_MEDIA_SOURCE_BUCKET");
    expect(src).toContain("24frame-media");
    expect(src).not.toContain("from \"@/lib/s3\"");
    expect(src).not.toContain("from \"@/lib/cloudfront\"");
    expect(src).not.toContain("from \"@/lib/mediaconvert\"");
    expect(src).not.toContain("process.env.S3_BUCKET)");
  });
});
