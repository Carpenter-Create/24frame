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
import { EDUCATION_ADMIN, educationCoverKey, educationLessonSourceKey } from "@/lib/education";

import {
  createEducationCourse,
  presignEducationUpload,
  uploadEducationCover,
  uploadEducationLessonSource,
} from "./actions";

const USER = { id: "11111111-1111-4111-8111-111111111111" };
const COURSE = "22222222-2222-4222-8222-222222222222";
const LESSON = "33333333-3333-4333-8333-333333333333";

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

function adminClient(insertError: { code?: string; message?: string } | null = null) {
  const insert = vi.fn(async () => ({ error: insertError }));
  const from = vi.fn(() => ({ insert }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, insert };
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
        slug: "member-write",
        title: "Nope",
        model: "free",
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.notAuthorized });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("inserts a course through the service-role client for gc_staff", async () => {
    staffClient({ user_id: USER.id });
    const admin = adminClient();
    await expect(
      createEducationCourse({
        slug: "Welcome To 24Frame Two",
        title: "Welcome",
        model: "free",
        price: "49",
      }),
    ).resolves.toEqual({ slug: "welcome-to-24frame-two" });
    expect(createAdminClient).toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledWith("courses");
    expect(admin.insert).toHaveBeenCalledWith({
      slug: "welcome-to-24frame-two",
      title: "Welcome",
      description: null,
      is_flagship_free: true,
      price_cents: null,
    });
  });

  it("persists a one-time price on Paid and rejects a Paid course without a price", async () => {
    staffClient({ user_id: USER.id });
    const admin = adminClient();
    await expect(
      createEducationCourse({
        slug: "paid-course",
        title: "Paid fixture",
        model: "paid",
        price: "49.00",
      }),
    ).resolves.toEqual({ slug: "paid-course" });
    expect(admin.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_flagship_free: false,
        price_cents: 4900,
      }),
    );
    await expect(
      createEducationCourse({
        slug: "paid-empty",
        title: "Paid empty",
        model: "paid",
        price: "",
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.invalid });
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
    const otherCourse = "44444444-4444-4444-8444-444444444444";
    const { update } = sourceAdminClient(otherCourse);
    const file = new File([new Uint8Array([1])], "smoke.mp4", { type: "video/mp4" });
    await expect(uploadEducationLessonSource(sourceForm(file))).resolves.toEqual({
      error: EDUCATION_ADMIN.missing,
    });
    expect(putEducationSourceObject).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
