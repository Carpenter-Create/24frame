import { beforeEach, describe, expect, it, vi } from "vitest";

import { EDUCATION_ADMIN, EDUCATION_VIDEO_MAX_BYTES, educationLessonSourceKey } from "./education";

vi.mock("@/app/(app)/(operator)/education/manage/actions", () => ({
  startEducationLessonSourceUpload: vi.fn(),
  signEducationLessonSourceParts: vi.fn(),
  completeEducationLessonSourceUpload: vi.fn(),
}));

import {
  completeEducationLessonSourceUpload,
  signEducationLessonSourceParts,
  startEducationLessonSourceUpload,
} from "@/app/(app)/(operator)/education/manage/actions";

import { uploadEducationLessonSourceFromBrowser } from "./education-source-upload";

const COURSE = "22222222-2222-4222-8222-222222222222";
const LESSON = "44444444-4444-4444-8444-444444444444";

describe("uploadEducationLessonSourceFromBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 200, headers: { ETag: '"abc"' } })),
    );
  });

  it("refuses an oversize file before starting a multipart upload", async () => {
    const file = new File([new Uint8Array([1])], "huge.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: EDUCATION_VIDEO_MAX_BYTES + 1 });
    await expect(
      uploadEducationLessonSourceFromBrowser({ courseId: COURSE, lessonId: LESSON, file }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.invalid });
    expect(startEducationLessonSourceUpload).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("PUTs part bytes to S3 and completes without posting the file to an action", async () => {
    const key = educationLessonSourceKey(COURSE, LESSON, "video/mp4");
    vi.mocked(startEducationLessonSourceUpload).mockResolvedValue({
      key,
      uploadId: "upload-1",
      partSize: 8,
    });
    vi.mocked(signEducationLessonSourceParts).mockResolvedValue({
      urls: [{ partNumber: 1, url: "https://s3.example/part" }],
    });
    vi.mocked(completeEducationLessonSourceUpload).mockResolvedValue({});

    const file = new File([new Uint8Array([1, 2, 3, 4])], "smoke.mp4", { type: "video/mp4" });
    await expect(
      uploadEducationLessonSourceFromBrowser({ courseId: COURSE, lessonId: LESSON, file }),
    ).resolves.toEqual({});

    expect(startEducationLessonSourceUpload).toHaveBeenCalledWith({
      courseId: COURSE,
      lessonId: LESSON,
      contentType: "video/mp4",
      fileName: "smoke.mp4",
      byteLength: 4,
    });
    expect(fetch).toHaveBeenCalledWith("https://s3.example/part", {
      method: "PUT",
      body: expect.any(Blob),
    });
    expect(completeEducationLessonSourceUpload).toHaveBeenCalledWith({
      courseId: COURSE,
      lessonId: LESSON,
      key,
      uploadId: "upload-1",
      byteLength: 4,
      parts: [{ partNumber: 1, etag: '"abc"' }],
    });
    const startPayload = vi.mocked(startEducationLessonSourceUpload).mock.calls[0]?.[0] as Record<string, unknown>;
    expect(startPayload).not.toHaveProperty("file");
  });
});
