import {
  completeEducationLessonSourceUpload,
  signEducationLessonSourceParts,
  startEducationLessonSourceUpload,
} from "@/app/(app)/(operator)/education/manage/actions";
import { EDUCATION_ADMIN, EDUCATION_SOURCE_SIGN_BATCH, EDUCATION_VIDEO_MAX_BYTES } from "@/lib/education";
import { planParts, planWindows } from "@/lib/upload-plan";

// Lesson source bytes multipart straight to the Education source bucket.
// The file is not a server-action body. Same shape as a title master:
// initiate, sign a window, PUT parts, complete.

const PART_CONCURRENCY = 5;

async function putEducationSourcePart(url: string, body: Blob, tries = 4): Promise<string | null> {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(url, { method: "PUT", body });
      if (!res.ok) throw new Error(String(res.status));
      const etag = res.headers.get("ETag");
      if (!etag) throw new Error("no ETag");
      return etag;
    } catch {
      if (attempt >= tries) return null;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }
  return null;
}

export async function uploadEducationLessonSourceFromBrowser(input: {
  courseId: string;
  lessonId: string;
  file: File;
}): Promise<{ error?: string }> {
  if (input.file.size <= 0 || input.file.size > EDUCATION_VIDEO_MAX_BYTES) {
    return { error: EDUCATION_ADMIN.invalid };
  }

  const started = await startEducationLessonSourceUpload({
    courseId: input.courseId,
    lessonId: input.lessonId,
    contentType: input.file.type,
    fileName: input.file.name,
    byteLength: input.file.size,
  });
  if (started.error || !started.key || !started.uploadId || !started.partSize) {
    return { error: started.error ?? EDUCATION_ADMIN.uploadFailed };
  }

  const parts = planParts(input.file.size, started.partSize);
  const done: { partNumber: number; etag: string }[] = [];
  let failed = false;

  for (const window of planWindows(parts, EDUCATION_SOURCE_SIGN_BATCH)) {
    if (failed) break;
    const signed = await signEducationLessonSourceParts({
      courseId: input.courseId,
      lessonId: input.lessonId,
      key: started.key,
      uploadId: started.uploadId,
      parts: window.map((part) => ({ partNumber: part.partNumber })),
    });
    if (signed.error || !signed.urls) return { error: signed.error ?? EDUCATION_ADMIN.uploadFailed };
    const urlFor = new Map(signed.urls.map((part) => [part.partNumber, part.url]));

    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(PART_CONCURRENCY, window.length) }, async () => {
        while (next < window.length && !failed) {
          const part = window[next];
          next += 1;
          if (!part) return;
          const url = urlFor.get(part.partNumber);
          if (!url) {
            failed = true;
            return;
          }
          const etag = await putEducationSourcePart(url, input.file.slice(part.start, part.end));
          if (!etag) {
            failed = true;
            return;
          }
          done.push({ partNumber: part.partNumber, etag });
        }
      }),
    );
  }

  if (failed || done.length !== parts.length) return { error: EDUCATION_ADMIN.uploadFailed };

  return completeEducationLessonSourceUpload({
    courseId: input.courseId,
    lessonId: input.lessonId,
    key: started.key,
    uploadId: started.uploadId,
    byteLength: input.file.size,
    parts: done,
  });
}
