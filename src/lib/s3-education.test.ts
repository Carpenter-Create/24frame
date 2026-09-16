import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetSignedUrl, mockSend } = vi.hoisted(() => ({
  mockGetSignedUrl: vi.fn(),
  mockSend: vi.fn(),
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

vi.mock("@/lib/education-cloudfront", () => ({
  isEducationCloudfrontConfigured: vi.fn(() => false),
  signEducationCloudfrontUrl: vi.fn(),
}));

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import {
  isEducationCloudfrontConfigured,
  signEducationCloudfrontUrl,
} from "@/lib/education-cloudfront";
import { EDUCATION_AWS_ENV, educationCoverKey, educationHlsManifestKey, educationLessonSourceKey } from "./education";
import {
  educationOutputBucket,
  educationSourceBucket,
  presignEducationOutputGet,
  presignEducationSourceGet,
  presignEducationSourcePut,
  putEducationSourceObject,
  signedEducationCoverUrl,
  signedEducationHlsUrl,
} from "./s3-education";

const COURSE = "11111111-1111-4111-8111-111111111111";
const LESSON = "22222222-2222-4222-8222-222222222222";
const COVER = educationCoverKey(COURSE, "image/jpeg");
const SOURCE = educationLessonSourceKey(COURSE, LESSON, "video/mp4");
const HLS = educationHlsManifestKey(COURSE, LESSON);

const EDUCATION_AWS = {
  EDUCATION_AWS_ACCESS_KEY_ID: "education-access-key",
  EDUCATION_AWS_SECRET_ACCESS_KEY: "education-secret-key",
  EDUCATION_AWS_REGION: "us-west-2",
} as const;

function setEducationAwsEnv() {
  process.env.EDUCATION_AWS_ACCESS_KEY_ID = EDUCATION_AWS.EDUCATION_AWS_ACCESS_KEY_ID;
  process.env.EDUCATION_AWS_SECRET_ACCESS_KEY = EDUCATION_AWS.EDUCATION_AWS_SECRET_ACCESS_KEY;
  process.env.EDUCATION_AWS_REGION = EDUCATION_AWS.EDUCATION_AWS_REGION;
}

function unsetEducationAwsEnv() {
  delete process.env.EDUCATION_AWS_ACCESS_KEY_ID;
  delete process.env.EDUCATION_AWS_SECRET_ACCESS_KEY;
  delete process.env.EDUCATION_AWS_REGION;
}

describe("s3-education isolated lane", () => {
  beforeEach(() => {
    mockGetSignedUrl.mockReset();
    mockSend.mockReset();
    vi.mocked(S3Client).mockClear();
    vi.mocked(isEducationCloudfrontConfigured).mockReturnValue(false);
    vi.mocked(signEducationCloudfrontUrl).mockReset();
    process.env.S3_EDUCATION_SOURCE_BUCKET = "test-education-source-bucket";
    process.env.S3_EDUCATION_OUTPUT_BUCKET = "test-education-output-bucket";
    process.env.S3_BUCKET = "test-bucket";
    process.env.S3_AVATARS_BUCKET = "test-avatars-bucket";
    process.env.S3_MEDIA_SOURCE_BUCKET = "test-media-source-bucket";
    process.env.S3_MEDIA_OUTPUT_BUCKET = "test-media-output-bucket";
    process.env.S3_FINANCE_BUCKET = "24frame-finance-dev";
    process.env.AWS_ACCESS_KEY_ID = "title-access-key";
    process.env.AWS_SECRET_ACCESS_KEY = "title-secret-key";
    process.env.AWS_REGION = "us-east-1";
    process.env.MEDIA_AWS_ACCESS_KEY_ID = "media-access-key";
    process.env.FINANCE_AWS_ACCESS_KEY_ID = "finance-access-key";
    process.env.SES_AWS_ACCESS_KEY_ID = "ses-access-key";
    setEducationAwsEnv();
  });

  it("PUTs cover bytes on the Education source bucket", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = new Uint8Array([1, 2, 3]);
    await putEducationSourceObject(COVER, body, "image/jpeg");
    expect(mockSend).toHaveBeenCalledTimes(1);
    const cmd = mockSend.mock.calls[0]?.[0] as PutObjectCommand;
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    expect(cmd.input.Bucket).toBe("test-education-source-bucket");
    expect(cmd.input.Bucket).not.toBe(process.env.S3_BUCKET);
    expect(cmd.input.Key).toBe(COVER);
    expect(cmd.input.Body).toBe(body);
    expect(cmd.input.ContentType).toBe("image/jpeg");
    expect(cmd.input.ACL).toBeUndefined();
  });

  it("PUTs lesson source bytes on the Education source bucket", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = new Uint8Array([1, 2, 3, 4]);
    await putEducationSourceObject(SOURCE, body, "video/mp4");
    expect(mockSend).toHaveBeenCalledTimes(1);
    const cmd = mockSend.mock.calls[0]?.[0] as PutObjectCommand;
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    expect(cmd.input.Bucket).toBe("test-education-source-bucket");
    expect(cmd.input.Bucket).not.toBe(process.env.S3_BUCKET);
    expect(cmd.input.Key).toBe(SOURCE);
    expect(cmd.input.Body).toBe(body);
    expect(cmd.input.ContentType).toBe("video/mp4");
    expect(cmd.input.ACL).toBeUndefined();
  });

  it("presigns cover PUT/GET on the Education source bucket", async () => {
    mockGetSignedUrl.mockResolvedValueOnce("https://s3.example/put");
    await expect(presignEducationSourcePut(COVER, "image/jpeg")).resolves.toBe("https://s3.example/put");
    const putCmd = mockGetSignedUrl.mock.calls[0]?.[1] as PutObjectCommand;
    expect(putCmd).toBeInstanceOf(PutObjectCommand);
    expect(putCmd.input.Bucket).toBe("test-education-source-bucket");
    expect(putCmd.input.Bucket).not.toBe(process.env.S3_BUCKET);
    expect(putCmd.input.Key).toBe(COVER);
    expect(putCmd.input.CacheControl).toBeUndefined();

    mockGetSignedUrl.mockResolvedValueOnce("https://s3.example/get");
    await expect(presignEducationSourceGet(COVER)).resolves.toBe("https://s3.example/get");
  });

  it("presigns HLS GET on the Education output bucket", async () => {
    mockGetSignedUrl.mockResolvedValueOnce("https://s3.example/hls");
    await expect(presignEducationOutputGet(HLS)).resolves.toBe("https://s3.example/hls");
    const getCmd = mockGetSignedUrl.mock.calls[0]?.[1] as GetObjectCommand;
    expect(getCmd.input.Bucket).toBe("test-education-output-bucket");
  });

  it("refuses when an Education bucket is a title or social bucket", () => {
    process.env.S3_EDUCATION_SOURCE_BUCKET = process.env.S3_BUCKET;
    expect(() => educationSourceBucket()).toThrow(/dedicated 24Frame education bucket/);
    process.env.S3_EDUCATION_SOURCE_BUCKET = "test-education-source-bucket";
    process.env.S3_EDUCATION_OUTPUT_BUCKET = "24frame-media-output-prod";
    expect(() => educationOutputBucket()).toThrow(/dedicated 24Frame education bucket/);
  });

  it("does not sign title-prefix keys", async () => {
    await expect(presignEducationSourcePut(`orgs/${COURSE}/titles/${LESSON}/master/a.mov`, "video/mp4")).rejects.toThrow(
      /not allowed/,
    );
    await expect(signedEducationCoverUrl(`orgs/${COURSE}/titles/${LESSON}/master/a.mov`)).resolves.toBeNull();
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("uses CloudFront signed URLs for HLS when Education CF env is present", async () => {
    vi.mocked(isEducationCloudfrontConfigured).mockReturnValue(true);
    vi.mocked(signEducationCloudfrontUrl).mockReturnValue("https://d-education.cloudfront.net/signed");
    await expect(signedEducationHlsUrl(HLS)).resolves.toBe("https://d-education.cloudfront.net/signed");
    expect(signEducationCloudfrontUrl).toHaveBeenCalledWith(HLS);
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("returns null for signed helpers when Education env is stubbed", async () => {
    unsetEducationAwsEnv();
    await expect(signedEducationCoverUrl(COVER)).resolves.toBeNull();
    await expect(signedEducationHlsUrl(HLS)).resolves.toBeNull();
    expect(mockGetSignedUrl).not.toHaveBeenCalled();
  });

  it("constructs S3Client from EDUCATION_AWS_* even when other lanes are present", async () => {
    mockGetSignedUrl.mockResolvedValueOnce("https://s3.example/put");
    await presignEducationSourcePut(COVER, "image/jpeg");
    expect(S3Client).toHaveBeenCalledWith({
      region: EDUCATION_AWS.EDUCATION_AWS_REGION,
      credentials: {
        accessKeyId: EDUCATION_AWS.EDUCATION_AWS_ACCESS_KEY_ID,
        secretAccessKey: EDUCATION_AWS.EDUCATION_AWS_SECRET_ACCESS_KEY,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
    const config = vi.mocked(S3Client).mock.calls[0]?.[0] as {
      region?: string;
      credentials?: { accessKeyId?: string };
    };
    expect(config.region).not.toBe("us-east-1");
    expect(config.credentials?.accessKeyId).not.toBe("title-access-key");
    expect(config.credentials?.accessKeyId).not.toBe("media-access-key");
    expect(config.credentials?.accessKeyId).not.toBe("finance-access-key");
  });

  it.each([...EDUCATION_AWS_ENV])("refuses when %s is missing and does not use other lanes", async (name) => {
    delete process.env[name];
    await expect(presignEducationSourcePut(COVER, "image/jpeg")).rejects.toThrow(
      new RegExp(`${name} environment variable is not set`),
    );
    expect(S3Client).not.toHaveBeenCalled();
  });

  it("never imports title, social, finance, or title MediaConvert clients", () => {
    const src = readFileSync("src/lib/s3-education.ts", "utf8");
    expect(src).toContain("S3_EDUCATION_SOURCE_BUCKET");
    expect(src).toContain("EDUCATION_AWS_ACCESS_KEY_ID");
    expect(src).not.toContain('from "@/lib/s3"');
    expect(src).not.toContain('from "@/lib/s3-social-media"');
    expect(src).not.toContain('from "@/lib/s3-finance"');
    expect(src).not.toContain('from "@/lib/s3-avatars"');
    expect(src).not.toContain('from "@/lib/mediaconvert"');
    expect(src).not.toContain("process.env.AWS_ACCESS_KEY_ID");
    expect(src).not.toContain("process.env.MEDIA_AWS_");
    expect(src).not.toContain("process.env.FINANCE_AWS_");
    expect(src).not.toContain("process.env.SES_AWS_");
  });
});
