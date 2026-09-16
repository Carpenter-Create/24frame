import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

vi.mock("@aws-sdk/client-mediaconvert", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-mediaconvert")>();
  return {
    ...actual,
    MediaConvertClient: vi.fn().mockImplementation(function MediaConvertClientMock() {
      return { send: mockSend };
    }),
  };
});

vi.mock("@/lib/s3-education", () => ({
  educationSourceBucket: () => "test-education-source-bucket",
  educationOutputBucket: () => "test-education-output-bucket",
}));

import { MediaConvertClient } from "@aws-sdk/client-mediaconvert";

import { EDUCATION_MEDIACONVERT_ENV, educationHlsPrefix, educationLessonSourceKey } from "./education";
import { getEducationEncodeJob, submitEducationHlsJob } from "./education-mediaconvert";

const COURSE = "11111111-1111-4111-8111-111111111111";
const LESSON = "22222222-2222-4222-8222-222222222222";

describe("education MediaConvert isolation", () => {
  beforeEach(() => {
    mockSend.mockReset();
    vi.mocked(MediaConvertClient).mockClear();
    process.env.EDUCATION_AWS_REGION = "us-west-2";
    process.env.EDUCATION_AWS_ACCESS_KEY_ID = "education-access-key";
    process.env.EDUCATION_AWS_SECRET_ACCESS_KEY = "education-secret-key";
    process.env.EDUCATION_MEDIACONVERT_ENDPOINT = "https://mediaconvert.us-west-2.amazonaws.com";
    process.env.EDUCATION_MEDIACONVERT_ROLE_ARN = "arn:aws:iam::405912452061:role/24frame-education-mediaconvert";
    process.env.EDUCATION_MEDIACONVERT_QUEUE_ARN = "arn:aws:mediaconvert:us-west-2:405912452061:queues/24frame-education";
    process.env.AWS_ACCESS_KEY_ID = "title-access-key";
    process.env.AWS_REGION = "us-east-1";
    process.env.MEDIACONVERT_ENDPOINT = "https://title.mediaconvert.amazonaws.com";
    process.env.MEDIA_AWS_ACCESS_KEY_ID = "media-access-key";
  });

  it("submits with EDUCATION_* credentials and role", async () => {
    mockSend.mockResolvedValueOnce({ Job: { Id: "job-1" } });
    await expect(
      submitEducationHlsJob({
        sourceKey: educationLessonSourceKey(COURSE, LESSON, "video/mp4"),
        destinationPrefix: educationHlsPrefix(COURSE, LESSON),
      }),
    ).resolves.toEqual({ externalJobId: "job-1" });
    expect(MediaConvertClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "us-west-2",
        endpoint: "https://mediaconvert.us-west-2.amazonaws.com",
        credentials: {
          accessKeyId: "education-access-key",
          secretAccessKey: "education-secret-key",
        },
      }),
    );
    const config = vi.mocked(MediaConvertClient).mock.calls[0]?.[0] as {
      credentials?: { accessKeyId?: string };
      endpoint?: string;
    };
    expect(config.credentials?.accessKeyId).not.toBe("title-access-key");
    expect(config.endpoint).not.toBe(process.env.MEDIACONVERT_ENDPOINT);
  });

  it("maps GetJob COMPLETE to complete", async () => {
    mockSend.mockResolvedValueOnce({ Job: { Status: "COMPLETE" } });
    await expect(getEducationEncodeJob("job-1")).resolves.toMatchObject({
      status: "complete",
      rawStatus: "COMPLETE",
    });
  });

  it.each([...EDUCATION_MEDIACONVERT_ENV])("refuses when %s is missing", async (name) => {
    delete process.env[name];
    await expect(
      submitEducationHlsJob({
        sourceKey: educationLessonSourceKey(COURSE, LESSON, "video/mp4"),
        destinationPrefix: educationHlsPrefix(COURSE, LESSON),
      }),
    ).rejects.toThrow(new RegExp(`${name} environment variable is not set`));
    expect(MediaConvertClient).not.toHaveBeenCalled();
  });

  it("never imports the title MediaConvert client", () => {
    const src = readFileSync("src/lib/education-mediaconvert.ts", "utf8");
    expect(src).toContain("EDUCATION_MEDIACONVERT_ENDPOINT");
    expect(src).toContain("EDUCATION_AWS_ACCESS_KEY_ID");
    expect(src).not.toContain('from "@/lib/mediaconvert"');
    expect(src).not.toContain("process.env.AWS_ACCESS_KEY_ID");
    expect(src).not.toContain("process.env.MEDIACONVERT_");
    expect(src).not.toContain("process.env.MEDIA_AWS_");
  });
});
