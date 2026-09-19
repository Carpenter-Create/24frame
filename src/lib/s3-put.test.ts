import { describe, expect, it, vi, beforeEach } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@aws-sdk/client-s3")>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(function S3ClientMock() {
      return { send: mockSend };
    }),
  };
});

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { putObjectBytes } from "./s3-put";

describe("putObjectBytes", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({});
  });

  it("PutObject to S3_BUCKET with the given key and type", async () => {
    await putObjectBytes("news-thumbs/joblo/abc.jpg", new Uint8Array([1, 2, 3]), "image/jpeg");
    expect(mockSend).toHaveBeenCalledTimes(1);
    const cmd = mockSend.mock.calls[0]?.[0] as PutObjectCommand;
    expect(cmd).toBeInstanceOf(PutObjectCommand);
    expect(cmd.input.Bucket).toBe("test-bucket");
    expect(cmd.input.Key).toBe("news-thumbs/joblo/abc.jpg");
    expect(cmd.input.ContentType).toBe("image/jpeg");
    expect(cmd.input.CacheControl).toBe("public, max-age=86400");
  });
});
