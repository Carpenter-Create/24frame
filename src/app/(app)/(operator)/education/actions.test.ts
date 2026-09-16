import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/s3-education", () => ({
  isEducationAwsConfigured: vi.fn(() => false),
  presignEducationSourcePut: vi.fn(),
  putEducationSourceObject: vi.fn(),
}));
vi.mock("@/lib/education-mediaconvert", () => ({
  isEducationMediaconvertConfigured: vi.fn(() => false),
  submitEducationHlsJob: vi.fn(),
  getEducationEncodeJob: vi.fn(),
}));

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEducationAwsConfigured, presignEducationSourcePut, putEducationSourceObject } from "@/lib/s3-education";
import {
  isEducationMediaconvertConfigured,
  submitEducationHlsJob,
} from "@/lib/education-mediaconvert";
import { EDUCATION_ADMIN, educationCoverKey } from "@/lib/education";

import {
  createEducationCourse,
  createEducationLesson,
  presignEducationUpload,
  startEducationLessonEncode,
  uploadEducationCover,
} from "./actions";

const USER = { id: "11111111-1111-4111-8111-111111111111" };
const COURSE = "22222222-2222-4222-8222-222222222222";
const MODULE = "33333333-3333-4333-8333-333333333333";
const LESSON = "44444444-4444-4444-8444-444444444444";
const VIDEO = "55555555-5555-4555-8555-555555555555";

function staffClient(row: { user_id: string } | null) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data: row, error: null })),
  };
  const from = vi.fn(() => chain);
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from };
}

function query(data: unknown) {
  const q: Record<string, unknown> = {};
  const self = () => q;
  q.select = vi.fn(self);
  q.eq = vi.fn(self);
  q.order = vi.fn(self);
  q.limit = vi.fn(self);
  q.maybeSingle = vi.fn(async () => ({
    data: Array.isArray(data) ? (data[0] ?? null) : data,
    error: null,
  }));
  q.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(resolve);
  return q;
}

function insertResult(row: unknown, error: { code?: string; message?: string } | null = null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => ({ data: error ? null : row, error }));
  return chain;
}

function adminClient(options?: {
  insertError?: { code?: string; message?: string } | null;
  videoInsertError?: { code?: string; message?: string } | null;
  lessonRow?: Record<string, unknown> | null;
}) {
  const courseInsert = insertResult({ id: COURSE }, options?.insertError ?? null);
  const lessonInsert = insertResult({ id: LESSON });
  const videoInsert = insertResult({ id: VIDEO }, options?.videoInsertError ?? null);
  const courseInsertFn = vi.fn(() => courseInsert);
  const lessonInsertFn = vi.fn(() => lessonInsert);
  const videoInsertFn = vi.fn(() => videoInsert);
  const lessonUpdate = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  const videoUpdate = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  const lessonRead = options?.lessonRow
    ? query(options.lessonRow)
    : query([{ position: 1 }]);
  const from = vi.fn((table: string) => {
    if (table === "courses") {
      return {
        ...query([]),
        insert: courseInsertFn,
      };
    }
    if (table === "instructors") {
      return {
        ...query(null),
        insert: vi.fn(() => insertResult({ id: "instructor-1" })),
      };
    }
    if (table === "modules") {
      return query({ id: MODULE, course_id: COURSE, courses: { slug: "welcome" } });
    }
    if (table === "lessons") {
      return {
        ...lessonRead,
        insert: lessonInsertFn,
        update: lessonUpdate,
      };
    }
    if (table === "education_videos") {
      return { insert: videoInsertFn, update: videoUpdate };
    }
    throw new Error(`unexpected admin from(${table})`);
  });
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, courseInsertFn, lessonInsertFn, videoInsertFn, lessonUpdate, videoUpdate };
}

describe("education admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER as never);
  });

  it("refuses a member write and does not open the admin client", async () => {
    staffClient(null);
    const admin = adminClient();
    await expect(
      createEducationCourse({
        title: "Nope",
        model: "free",
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.notAuthorized });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("inserts a course through the service-role client for gc_staff with auto slug", async () => {
    staffClient({ user_id: USER.id });
    const admin = adminClient();
    await expect(
      createEducationCourse({
        title: "Welcome To 24Frame Two",
        model: "free",
        price: "49",
      }),
    ).resolves.toEqual({ slug: "welcome-to-24frame-two", courseId: COURSE });
    expect(createAdminClient).toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledWith("courses");
    expect(admin.courseInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "welcome-to-24frame-two",
        title: "Welcome To 24Frame Two",
        description: null,
        is_flagship_free: true,
        price_cents: null,
        status: "draft",
        instructor_id: null,
      }),
    );
  });

  it("persists a one-time price on Paid and rejects a Paid course without a price", async () => {
    staffClient({ user_id: USER.id });
    adminClient();
    await expect(
      createEducationCourse({
        slug: "paid-course",
        title: "Paid fixture",
        model: "paid",
        price: "49.00",
      }),
    ).resolves.toEqual({ slug: "paid-course", courseId: COURSE });
    await expect(
      createEducationCourse({
        slug: "paid-empty",
        title: "Paid empty",
        model: "paid",
        price: "",
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.invalid });
  });

  it("creates a lesson without a free-taste flag and opens an education_videos row", async () => {
    staffClient({ user_id: USER.id });
    const admin = adminClient();
    await expect(
      createEducationLesson({
        moduleId: MODULE,
        title: "Opening lesson",
        summary: "A short summary",
        durationMinutes: 12,
        lessonType: "lesson",
      }),
    ).resolves.toEqual({ lessonId: LESSON });
    expect(admin.from).toHaveBeenCalledWith("education_videos");
    expect(admin.from).toHaveBeenCalledWith("lessons");
  });

  it("returns the inserted lessonId when the education_videos write fails", async () => {
    staffClient({ user_id: USER.id });
    adminClient({ videoInsertError: { message: "video write failed" } });
    await expect(
      createEducationLesson({
        moduleId: MODULE,
        title: "Opening lesson",
        lessonType: "lesson",
      }),
    ).resolves.toEqual({ error: "video write failed", lessonId: LESSON });
  });

  it("writes submit_failed onto education_videos when encode submit throws", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationMediaconvertConfigured).mockReturnValue(true);
    vi.mocked(submitEducationHlsJob).mockRejectedValue(new Error("MediaConvert denied"));
    const admin = adminClient({
      lessonRow: {
        id: LESSON,
        source_key: `courses/${COURSE}/lessons/${LESSON}/source.mp4`,
        education_video_id: VIDEO,
        modules: { course_id: COURSE, courses: { slug: "welcome" } },
      },
    });
    await expect(startEducationLessonEncode({ lessonId: LESSON })).resolves.toEqual({
      error: EDUCATION_ADMIN.encodeFailed,
    });
    expect(admin.lessonUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ encode_status: "submit_failed", encode_error: "MediaConvert denied" }),
    );
    expect(admin.videoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ encode_status: "submit_failed", encode_error: "MediaConvert denied" }),
    );
  });

  it("returns a clear error when Education storage env is stubbed", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(false);
    await expect(
      presignEducationUpload({
        kind: "cover",
        courseId: COURSE,
        contentType: "image/jpeg",
        byteLength: 12,
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.envUnset });
    expect(presignEducationSourcePut).not.toHaveBeenCalled();
  });
});

function coverForm(file: File, courseId = COURSE) {
  const body = new FormData();
  body.set("courseId", courseId);
  body.set("file", file);
  return body;
}

function coverAdminClient() {
  const maybeSingle = vi.fn(async () => ({ data: { slug: "cos-smoke-2026-09-15" }, error: null }));
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }));
  const updateEq = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const from = vi.fn(() => ({ select, update }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, update, updateEq };
}

describe("uploadEducationCover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER as never);
    vi.mocked(putEducationSourceObject).mockResolvedValue(undefined);
  });

  it("PUTs cover bytes then sets cover_key and does not hang on a browser PUT", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const { update } = coverAdminClient();
    const file = new File([new Uint8Array([1, 2, 3])], "cover.jpg", { type: "image/jpeg" });
    await expect(uploadEducationCover(coverForm(file))).resolves.toEqual({});
    const key = educationCoverKey(COURSE, "image/jpeg");
    expect(putEducationSourceObject).toHaveBeenCalledTimes(1);
    const [putKey, body, type] = vi.mocked(putEducationSourceObject).mock.calls[0] ?? [];
    expect(putKey).toBe(key);
    expect(type).toBe("image/jpeg");
    expect(body).toBeInstanceOf(Uint8Array);
    expect(update).toHaveBeenCalledWith({ cover_key: key });
    expect(presignEducationSourcePut).not.toHaveBeenCalled();
  });

  it("normalizes image/jpg so attach is not rejected after a successful PUT", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const { update } = coverAdminClient();
    const file = new File([new Uint8Array([1])], "cover.JPG", { type: "image/jpg" });
    await expect(uploadEducationCover(coverForm(file))).resolves.toEqual({});
    expect(putEducationSourceObject).toHaveBeenCalledWith(
      educationCoverKey(COURSE, "image/jpeg"),
      expect.any(Uint8Array),
      "image/jpeg",
    );
    expect(update).toHaveBeenCalledWith({ cover_key: educationCoverKey(COURSE, "image/jpeg") });
  });

  it("does not write cover_key when the source PUT fails", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const { update } = coverAdminClient();
    vi.mocked(putEducationSourceObject).mockRejectedValueOnce(new Error("AccessDenied"));
    const file = new File([new Uint8Array([1])], "cover.jpg", { type: "image/jpeg" });
    await expect(uploadEducationCover(coverForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.uploadFailed,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses when Education storage env is stubbed", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(false);
    const { update } = coverAdminClient();
    const file = new File([new Uint8Array([1])], "cover.jpg", { type: "image/jpeg" });
    await expect(uploadEducationCover(coverForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.envUnset,
    });
    expect(putEducationSourceObject).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a member write", async () => {
    staffClient(null);
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const file = new File([new Uint8Array([1])], "cover.jpg", { type: "image/jpeg" });
    await expect(uploadEducationCover(coverForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.notAuthorized,
    });
    expect(putEducationSourceObject).not.toHaveBeenCalled();
  });
});
