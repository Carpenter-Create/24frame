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
import { isEducationMediaconvertConfigured, submitEducationHlsJob } from "@/lib/education-mediaconvert";
import { EDUCATION_ADMIN, educationCoverKey, educationHlsPrefix, educationLessonSourceKey } from "@/lib/education";
import { revalidatePath } from "next/cache";

import {
  createEducationCourse,
  createEducationLesson,
  presignEducationUpload,
  startEducationLessonEncode,
  updateEducationCourse,
  uploadEducationCover,
  uploadEducationLessonSource,
} from "./actions";

const USER = { id: "11111111-1111-4111-8111-111111111111" };
const COURSE = "22222222-2222-4222-8222-222222222222";
const MODULE = "33333333-3333-4333-8333-333333333333";
const LESSON = "44444444-4444-4444-8444-444444444444";
const VIDEO = "55555555-5555-4555-8555-555555555555";
const OTHER_COURSE = "66666666-6666-4666-8666-666666666666";

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

function adminClient(options?: { insertError?: { code?: string; message?: string } | null }) {
  const courseInsert = insertResult({ id: COURSE }, options?.insertError ?? null);
  const lessonInsert = insertResult({ id: LESSON });
  const videoInsert = insertResult({ id: VIDEO });
  const courseInsertFn = vi.fn(() => courseInsert);
  const lessonInsertFn = vi.fn(() => lessonInsert);
  const videoInsertFn = vi.fn(() => videoInsert);
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
        ...query([{ position: 1 }]),
        insert: lessonInsertFn,
        update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
      };
    }
    if (table === "education_videos") {
      return { insert: videoInsertFn };
    }
    throw new Error(`unexpected admin from(${table})`);
  });
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, courseInsertFn, lessonInsertFn, videoInsertFn };
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
        title: "Paid fixture",
        model: "paid",
        price: "49.00",
      }),
    ).resolves.toEqual({ slug: "paid-fixture", courseId: COURSE });
    await expect(
      createEducationCourse({
        title: "Paid empty",
        model: "paid",
        price: "",
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.invalid });
  });

  it("derives create slugs from title and ignores a client-authored slug", async () => {
    staffClient({ user_id: USER.id });
    const admin = adminClient();
    await expect(
      createEducationCourse({
        slug: "staff-authored",
        title: "Welcome To 24Frame Two",
        model: "free",
      }),
    ).resolves.toEqual({ slug: "welcome-to-24frame-two", courseId: COURSE });
    expect(admin.courseInsertFn).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "welcome-to-24frame-two" }),
    );
    expect(admin.courseInsertFn).not.toHaveBeenCalledWith(
      expect.objectContaining({ slug: "staff-authored" }),
    );
  });

  it("keeps the existing slug on update and ignores a client slug", async () => {
    staffClient({ user_id: USER.id });
    const updateEq = vi.fn(async () => ({ error: null }));
    const update = vi.fn(() => ({ eq: updateEq }));
    const from = vi.fn((table: string) => {
      if (table === "courses") {
        return {
          ...query({ slug: "welcome-to-24frame" }),
          update,
        };
      }
      if (table === "instructors") {
        return {
          ...query(null),
          insert: vi.fn(() => insertResult({ id: "instructor-1" })),
        };
      }
      throw new Error(`unexpected admin from(${table})`);
    });
    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(
      updateEducationCourse({
        courseId: COURSE,
        title: "Renamed Welcome",
        slug: "hacked-slug",
        model: "free",
        status: "draft",
      }),
    ).resolves.toEqual({ slug: "welcome-to-24frame" });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Renamed Welcome",
      }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ slug: expect.anything() }),
    );
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

function sourceForm(file: File, courseId = COURSE, lessonId = LESSON) {
  const body = new FormData();
  body.set("courseId", courseId);
  body.set("lessonId", lessonId);
  body.set("file", file);
  return body;
}

function sourceAdminClient(courseId = COURSE) {
  const maybeSingle = vi.fn(async () => ({
    data: {
      id: LESSON,
      modules: { course_id: courseId, courses: { slug: "cos-smoke-2026-09-15" } },
    },
    error: null,
  }));
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }));
  const updateEq = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const from = vi.fn(() => ({ select, update }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, update, updateEq };
}

describe("uploadEducationLessonSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER as never);
    vi.mocked(putEducationSourceObject).mockResolvedValue(undefined);
  });

  it("PUTs source bytes then sets source_key and does not hang on a browser PUT", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const { update } = sourceAdminClient();
    const file = new File([new Uint8Array([1, 2, 3, 4])], "smoke.mp4", { type: "video/mp4" });
    await expect(uploadEducationLessonSource(sourceForm(file))).resolves.toEqual({});
    const key = educationLessonSourceKey(COURSE, LESSON, "video/mp4");
    expect(putEducationSourceObject).toHaveBeenCalledTimes(1);
    const [putKey, body, type] = vi.mocked(putEducationSourceObject).mock.calls[0] ?? [];
    expect(putKey).toBe(key);
    expect(type).toBe("video/mp4");
    expect(body).toBeInstanceOf(Uint8Array);
    expect(update).toHaveBeenCalledWith({
      source_key: key,
      encode_status: null,
      encode_job_id: null,
      encode_error: null,
      hls_key: null,
      encode_updated_at: expect.any(String),
    });
    expect(presignEducationSourcePut).not.toHaveBeenCalled();
  });

  it("normalizes an empty MP4 MIME so attach is not rejected after a successful PUT", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const { update } = sourceAdminClient();
    const file = new File([new Uint8Array([1])], "smoke.MP4", { type: "" });
    await expect(uploadEducationLessonSource(sourceForm(file))).resolves.toEqual({});
    expect(putEducationSourceObject).toHaveBeenCalledWith(
      educationLessonSourceKey(COURSE, LESSON, "video/mp4"),
      expect.any(Uint8Array),
      "video/mp4",
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ source_key: educationLessonSourceKey(COURSE, LESSON, "video/mp4") }),
    );
  });

  it("does not write source_key when the source PUT fails", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const { update } = sourceAdminClient();
    vi.mocked(putEducationSourceObject).mockRejectedValueOnce(new Error("AccessDenied"));
    const file = new File([new Uint8Array([1])], "smoke.mp4", { type: "video/mp4" });
    await expect(uploadEducationLessonSource(sourceForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.uploadFailed,
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses when Education storage env is stubbed", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(false);
    const { update } = sourceAdminClient();
    const file = new File([new Uint8Array([1])], "smoke.mp4", { type: "video/mp4" });
    await expect(uploadEducationLessonSource(sourceForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.envUnset,
    });
    expect(putEducationSourceObject).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("refuses a member write", async () => {
    staffClient(null);
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const file = new File([new Uint8Array([1])], "smoke.mp4", { type: "video/mp4" });
    await expect(uploadEducationLessonSource(sourceForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.notAuthorized,
    });
    expect(putEducationSourceObject).not.toHaveBeenCalled();
  });

  it("refuses when the lesson is not on the given course", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(true);
    const { update } = sourceAdminClient(OTHER_COURSE);
    const file = new File([new Uint8Array([1])], "smoke.mp4", { type: "video/mp4" });
    await expect(uploadEducationLessonSource(sourceForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.missing,
    });
    expect(putEducationSourceObject).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

function encodeAdminClient(lesson: {
  source_key: string | null;
  encode_status: string | null;
}) {
  const maybeSingle = vi.fn(async () => ({
    data: {
      id: LESSON,
      source_key: lesson.source_key,
      encode_status: lesson.encode_status,
      modules: { course_id: COURSE, courses: { slug: "cos-smoke-2026-09-15" } },
    },
    error: null,
  }));
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) }));
  const updateEq = vi.fn(async () => ({ error: null }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const from = vi.fn(() => ({ select, update }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, update };
}

describe("startEducationLessonEncode", () => {
  const sourceKey = educationLessonSourceKey(COURSE, LESSON, "video/mp4");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER as never);
    vi.mocked(isEducationMediaconvertConfigured).mockReturnValue(true);
  });

  it("resubmits when source is present and status is submit_failed", async () => {
    staffClient({ user_id: USER.id });
    encodeAdminClient({ source_key: sourceKey, encode_status: "submit_failed" });
    vi.mocked(submitEducationHlsJob).mockResolvedValueOnce({ externalJobId: "job-retry" });
    await expect(startEducationLessonEncode({ lessonId: LESSON })).resolves.toEqual({});
    expect(submitEducationHlsJob).toHaveBeenCalledWith({
      sourceKey,
      destinationPrefix: educationHlsPrefix(COURSE, LESSON),
    });
  });

  it("revalidates and returns the MediaConvert message when submit fails", async () => {
    staffClient({ user_id: USER.id });
    const { update } = encodeAdminClient({ source_key: sourceKey, encode_status: null });
    vi.mocked(submitEducationHlsJob).mockRejectedValueOnce(
      new Error("/outputGroups/0/outputs/0: nameModifier is a required property"),
    );
    await expect(startEducationLessonEncode({ lessonId: LESSON })).resolves.toEqual({
      error: "/outputGroups/0/outputs/0: nameModifier is a required property",
    });
    expect(update).toHaveBeenCalledWith({
      encode_status: "submit_failed",
      encode_error: "/outputGroups/0/outputs/0: nameModifier is a required property",
      encode_updated_at: expect.any(String),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/education/cos-smoke-2026-09-15");
  });

  it("refuses an in-flight encode even when source is present", async () => {
    staffClient({ user_id: USER.id });
    encodeAdminClient({ source_key: sourceKey, encode_status: "running" });
    await expect(startEducationLessonEncode({ lessonId: LESSON })).resolves.toEqual({
      error: EDUCATION_ADMIN.encodeFailed,
    });
    expect(submitEducationHlsJob).not.toHaveBeenCalled();
  });
});
