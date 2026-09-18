"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  COURSE_STATUSES,
  EDUCATION_ADMIN,
  EDUCATION_HREF,
  EDUCATION_NAME_MAX,
  EDUCATION_SUMMARY_MAX,
  EDUCATION_TITLE_MAX,
  allocateCourseSlug,
  educationCoverKey,
  canStartEducationEncode,
  educationHlsManifestKey,
  educationHlsPrefix,
  educationLessonCoverKey,
  educationLessonSourceKey,
  isCourseStatus,
  isEducationObjectKey,
  minutesToDurationSeconds,
  normalizeEducationCoverContentType,
  normalizeEducationSourceContentType,
  parseEducationPriceDollars,
  resolveEducationProduct,
  validateEducationUpload,
  type CourseStatus,
  type EducationProductModel,
} from "@/lib/education";
import {
  getEducationEncodeJob,
  isEducationMediaconvertConfigured,
  submitEducationHlsJob,
} from "@/lib/education-mediaconvert";
import {
  isEducationAwsConfigured,
  presignEducationSourcePut,
  putEducationSourceObject,
} from "@/lib/s3-education";
import { SOCIAL_ROUTES } from "@/lib/social";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

function revalidateEducation(slug?: string) {
  revalidatePath(EDUCATION_HREF);
  revalidatePath(SOCIAL_ROUTES.courses);
  if (slug) {
    revalidatePath(`${EDUCATION_HREF}/${encodeURIComponent(slug)}`);
    revalidatePath(`${SOCIAL_ROUTES.courses}/${encodeURIComponent(slug)}`);
  }
}

async function requireEducationStaff(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const user = await getAuthUser();
  if (!user) return { ok: false, error: EDUCATION_ADMIN.notAuthenticated };
  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("gc_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!staff) return { ok: false, error: EDUCATION_ADMIN.notAuthorized };
  return { ok: true, userId: user.id };
}

function uniqueConflict(error: { code?: string | null; message?: string | null }): boolean {
  return error.code === "23505" || (error.message ?? "").includes("courses_slug");
}

function parseEducationProduct(raw: {
  model: EducationProductModel;
  price?: string;
}): ReturnType<typeof resolveEducationProduct> {
  const priceCents = raw.model === "paid" ? parseEducationPriceDollars(raw.price ?? "") : null;
  return resolveEducationProduct({ model: raw.model, priceCents });
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function nextCoursePosition(admin: AdminClient): Promise<number> {
  const { data } = await admin
    .from("courses")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? 0) + 1;
}

async function allocateUniqueCourseSlug(admin: AdminClient, title: string): Promise<string | null> {
  const { data } = await admin.from("courses").select("slug");
  return allocateCourseSlug(
    title,
    (data ?? []).map((row) => row.slug),
  );
}

async function resolveInstructorId(
  admin: AdminClient,
  input: { instructorId?: string; instructorName?: string },
): Promise<{ ok: true; instructorId: string | null } | { ok: false; error: string }> {
  if (input.instructorId) {
    const { data } = await admin
      .from("instructors")
      .select("id")
      .eq("id", input.instructorId)
      .maybeSingle();
    if (!data) return { ok: false, error: EDUCATION_ADMIN.invalid };
    return { ok: true, instructorId: data.id };
  }
  const name = input.instructorName?.trim() ?? "";
  if (!name) return { ok: true, instructorId: null };
  const { data: existing } = await admin
    .from("instructors")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return { ok: true, instructorId: existing.id };
  const { data: created, error } = await admin
    .from("instructors")
    .insert({ name })
    .select("id")
    .maybeSingle();
  if (error || !created) return { ok: false, error: error?.message ?? EDUCATION_ADMIN.invalid };
  return { ok: true, instructorId: created.id };
}

function courseSlugFromJoin(courses: { slug: string } | { slug: string }[] | null | undefined): string | undefined {
  const course = Array.isArray(courses) ? courses[0] : courses;
  return course?.slug;
}

export async function createEducationCourse(
  raw: unknown,
): Promise<{ error?: string; slug?: string; courseId?: string }> {
  const parsed = z
    .object({
      title: z.string().trim().min(1).max(EDUCATION_NAME_MAX),
      description: z.string().trim().max(EDUCATION_SUMMARY_MAX).optional(),
      model: z.enum(["free", "paid"]),
      price: z.string().optional(),
      status: z.enum(COURSE_STATUSES).optional(),
      instructorId: z.string().uuid().optional(),
      instructorName: z.string().trim().max(EDUCATION_TITLE_MAX).optional(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };
  const product = parseEducationProduct(parsed.data);
  if (!product.ok) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const admin = createAdminClient();
  const slug = await allocateUniqueCourseSlug(admin, parsed.data.title);
  if (!slug) return { error: EDUCATION_ADMIN.invalid };
  const instructor = await resolveInstructorId(admin, parsed.data);
  if (!instructor.ok) return { error: instructor.error };
  const position = await nextCoursePosition(admin);

  const { data: created, error } = await admin
    .from("courses")
    .insert({
      slug,
      title: parsed.data.title,
      description: parsed.data.description || null,
      is_flagship_free: product.is_flagship_free,
      price_cents: product.price_cents,
      status: parsed.data.status ?? "draft",
      position,
      instructor_id: instructor.instructorId,
    })
    .select("id")
    .maybeSingle();
  if (error || !created) {
    if (error && uniqueConflict(error)) return { error: EDUCATION_ADMIN.conflict };
    return { error: error?.message ?? EDUCATION_ADMIN.invalid };
  }
  revalidateEducation(slug);
  return { slug, courseId: created.id };
}

export async function updateEducationCourse(raw: unknown): Promise<{ error?: string; slug?: string }> {
  const parsed = z
    .object({
      courseId: z.string().uuid(),
      title: z.string().trim().min(1).max(EDUCATION_NAME_MAX),
      description: z.string().trim().max(EDUCATION_SUMMARY_MAX).optional(),
      model: z.enum(["free", "paid"]),
      price: z.string().optional(),
      status: z.enum(COURSE_STATUSES),
      instructorId: z.string().uuid().optional(),
      instructorName: z.string().trim().max(EDUCATION_TITLE_MAX).optional(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };
  const product = parseEducationProduct(parsed.data);
  if (!product.ok) return { error: EDUCATION_ADMIN.invalid };
  if (!isCourseStatus(parsed.data.status)) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const admin = createAdminClient();
  const { data: course, error: readError } = await admin
    .from("courses")
    .select("slug")
    .eq("id", parsed.data.courseId)
    .maybeSingle();
  if (readError || !course) return { error: EDUCATION_ADMIN.missing };

  const instructor = await resolveInstructorId(admin, parsed.data);
  if (!instructor.ok) return { error: instructor.error };

  const { error } = await admin
    .from("courses")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      is_flagship_free: product.is_flagship_free,
      price_cents: product.price_cents,
      status: parsed.data.status,
      instructor_id: instructor.instructorId,
    })
    .eq("id", parsed.data.courseId);
  if (error) return { error: error.message };
  revalidateEducation(course.slug);
  return { slug: course.slug };
}

export async function createEducationModule(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      courseId: z.string().uuid(),
      title: z.string().trim().min(1).max(EDUCATION_TITLE_MAX),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("slug")
    .eq("id", parsed.data.courseId)
    .maybeSingle();
  if (!course) return { error: EDUCATION_ADMIN.missing };

  const { data: existing } = await admin
    .from("modules")
    .select("position")
    .eq("course_id", parsed.data.courseId)
    .order("position", { ascending: false })
    .limit(1);
  const position = (existing?.[0]?.position ?? 0) + 1;
  const { error } = await admin.from("modules").insert({
    course_id: parsed.data.courseId,
    title: parsed.data.title,
    position,
  });
  if (error) return { error: error.message };
  revalidateEducation(course.slug);
  return {};
}

export async function createEducationLesson(
  raw: unknown,
): Promise<{ error?: string; lessonId?: string }> {
  const parsed = z
    .object({
      moduleId: z.string().uuid(),
      title: z.string().trim().min(1).max(EDUCATION_NAME_MAX),
      summary: z.string().trim().max(EDUCATION_SUMMARY_MAX).optional(),
      durationMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
      lessonType: z.literal("lesson").optional(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const durationSeconds =
    parsed.data.durationMinutes == null ? null : minutesToDurationSeconds(parsed.data.durationMinutes);
  if (parsed.data.durationMinutes != null && durationSeconds == null) {
    return { error: EDUCATION_ADMIN.invalid };
  }

  const admin = createAdminClient();
  const { data: moduleRow } = await admin
    .from("modules")
    .select("id, course_id, courses(slug)")
    .eq("id", parsed.data.moduleId)
    .maybeSingle();
  if (!moduleRow) return { error: EDUCATION_ADMIN.missing };
  const slug = courseSlugFromJoin(moduleRow.courses);

  const { data: existing } = await admin
    .from("lessons")
    .select("position")
    .eq("module_id", parsed.data.moduleId)
    .order("position", { ascending: false })
    .limit(1);
  const position = (existing?.[0]?.position ?? 0) + 1;
  const { data: lesson, error } = await admin
    .from("lessons")
    .insert({
      module_id: parsed.data.moduleId,
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      position,
      duration_seconds: durationSeconds,
      lesson_type: "lesson",
      free_preview: false,
    })
    .select("id")
    .maybeSingle();
  if (error || !lesson) return { error: error?.message ?? EDUCATION_ADMIN.invalid };

  const { data: video, error: videoError } = await admin
    .from("education_videos")
    .insert({
      course_id: moduleRow.course_id,
      lesson_id: lesson.id,
    })
    .select("id")
    .maybeSingle();
  if (videoError || !video) return { error: videoError?.message ?? EDUCATION_ADMIN.invalid };

  const { error: linkError } = await admin
    .from("lessons")
    .update({ education_video_id: video.id })
    .eq("id", lesson.id);
  if (linkError) return { error: linkError.message };

  if (slug) revalidateEducation(slug);
  return { lessonId: lesson.id };
}

export async function updateEducationLesson(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      lessonId: z.string().uuid(),
      title: z.string().trim().min(1).max(EDUCATION_NAME_MAX),
      summary: z.string().trim().max(EDUCATION_SUMMARY_MAX).optional(),
      durationMinutes: z.number().int().min(1).max(24 * 60).nullable().optional(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const durationSeconds =
    parsed.data.durationMinutes == null ? null : minutesToDurationSeconds(parsed.data.durationMinutes);
  if (parsed.data.durationMinutes != null && durationSeconds == null) {
    return { error: EDUCATION_ADMIN.invalid };
  }

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, module_id, modules(course_id, courses(slug))")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (!lesson) return { error: EDUCATION_ADMIN.missing };

  const { error } = await admin
    .from("lessons")
    .update({
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      duration_seconds: durationSeconds,
    })
    .eq("id", parsed.data.lessonId);
  if (error) return { error: error.message };

  const moduleRow = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
  const slug = courseSlugFromJoin(moduleRow?.courses);
  if (slug) revalidateEducation(slug);
  return {};
}

export async function presignEducationUpload(raw: unknown): Promise<{
  error?: string;
  key?: string;
  url?: string;
}> {
  const parsed = z
    .object({
      kind: z.enum(["cover", "source", "lesson_cover"]),
      courseId: z.string().uuid(),
      lessonId: z.string().uuid().optional(),
      contentType: z.string(),
      byteLength: z.number().int().positive(),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };
  if (!isEducationAwsConfigured()) return { error: EDUCATION_ADMIN.envUnset };
  if ((parsed.data.kind === "source" || parsed.data.kind === "lesson_cover") && !parsed.data.lessonId) {
    return { error: EDUCATION_ADMIN.invalid };
  }

  const checked = validateEducationUpload({
    kind: parsed.data.kind,
    contentType: parsed.data.contentType,
    byteLength: parsed.data.byteLength,
  });
  if (!checked.ok) return { error: EDUCATION_ADMIN.invalid };

  let key: string;
  try {
    key =
      parsed.data.kind === "cover"
        ? educationCoverKey(parsed.data.courseId, checked.contentType)
        : parsed.data.kind === "lesson_cover"
          ? educationLessonCoverKey(
              parsed.data.courseId,
              parsed.data.lessonId ?? "",
              checked.contentType,
            )
          : educationLessonSourceKey(
              parsed.data.courseId,
              parsed.data.lessonId ?? "",
              checked.contentType,
            );
  } catch {
    return { error: EDUCATION_ADMIN.invalid };
  }

  try {
    const url = await presignEducationSourcePut(key, checked.contentType);
    return { key, url };
  } catch (err) {
    if (err instanceof Error && /environment variable is not set/.test(err.message)) {
      return { error: EDUCATION_ADMIN.envUnset };
    }
    return { error: EDUCATION_ADMIN.uploadFailed };
  }
}

export async function uploadEducationCover(formData: FormData): Promise<{ error?: string }> {
  const courseId = String(formData.get("courseId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: EDUCATION_ADMIN.invalid };
  const parsed = z.object({ courseId: z.string().uuid() }).safeParse({ courseId });
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };
  if (!isEducationAwsConfigured()) return { error: EDUCATION_ADMIN.envUnset };

  const contentType = normalizeEducationCoverContentType(file.type, file.name);
  const checked = validateEducationUpload({
    kind: "cover",
    contentType,
    byteLength: file.size,
  });
  if (!checked.ok) return { error: EDUCATION_ADMIN.invalid };

  let key: string;
  try {
    key = educationCoverKey(parsed.data.courseId, checked.contentType);
  } catch {
    return { error: EDUCATION_ADMIN.invalid };
  }
  if (!isEducationObjectKey(key) || !key.startsWith(`courses/${parsed.data.courseId}/cover.`)) {
    return { error: EDUCATION_ADMIN.invalid };
  }

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("slug")
    .eq("id", parsed.data.courseId)
    .maybeSingle();
  if (!course) return { error: EDUCATION_ADMIN.missing };

  try {
    const body = new Uint8Array(await file.arrayBuffer());
    await putEducationSourceObject(key, body, checked.contentType);
  } catch (err) {
    if (err instanceof Error && /environment variable is not set/.test(err.message)) {
      return { error: EDUCATION_ADMIN.envUnset };
    }
    return { error: EDUCATION_ADMIN.uploadFailed };
  }

  const { error } = await admin
    .from("courses")
    .update({ cover_key: key })
    .eq("id", parsed.data.courseId);
  if (error) return { error: error.message };
  revalidateEducation(course.slug);
  return {};
}

export async function uploadEducationLessonCover(formData: FormData): Promise<{ error?: string }> {
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: EDUCATION_ADMIN.invalid };
  const parsed = z
    .object({ courseId: z.string().uuid(), lessonId: z.string().uuid() })
    .safeParse({ courseId, lessonId });
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };
  if (!isEducationAwsConfigured()) return { error: EDUCATION_ADMIN.envUnset };

  const contentType = normalizeEducationCoverContentType(file.type, file.name);
  const checked = validateEducationUpload({
    kind: "lesson_cover",
    contentType,
    byteLength: file.size,
  });
  if (!checked.ok) return { error: EDUCATION_ADMIN.invalid };

  let key: string;
  try {
    key = educationLessonCoverKey(parsed.data.courseId, parsed.data.lessonId, checked.contentType);
  } catch {
    return { error: EDUCATION_ADMIN.invalid };
  }
  if (
    !isEducationObjectKey(key) ||
    !key.startsWith(`courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}/cover.`)
  ) {
    return { error: EDUCATION_ADMIN.invalid };
  }

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, modules(courses(slug))")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (!lesson) return { error: EDUCATION_ADMIN.missing };

  try {
    const body = new Uint8Array(await file.arrayBuffer());
    await putEducationSourceObject(key, body, checked.contentType);
  } catch (err) {
    if (err instanceof Error && /environment variable is not set/.test(err.message)) {
      return { error: EDUCATION_ADMIN.envUnset };
    }
    return { error: EDUCATION_ADMIN.uploadFailed };
  }

  const { error } = await admin
    .from("lessons")
    .update({ cover_key: key })
    .eq("id", parsed.data.lessonId);
  if (error) return { error: error.message };

  const moduleRow = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
  const slug = courseSlugFromJoin(moduleRow?.courses);
  if (slug) revalidateEducation(slug);
  return {};
}

export async function attachEducationCover(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      courseId: z.string().uuid(),
      key: z.string().min(1),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };
  if (!isEducationObjectKey(parsed.data.key)) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const expected = parsed.data.key.startsWith(`courses/${parsed.data.courseId}/cover.`);
  if (!expected) return { error: EDUCATION_ADMIN.invalid };

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("slug")
    .eq("id", parsed.data.courseId)
    .maybeSingle();
  if (!course) return { error: EDUCATION_ADMIN.missing };
  const { error } = await admin
    .from("courses")
    .update({ cover_key: parsed.data.key })
    .eq("id", parsed.data.courseId);
  if (error) return { error: error.message };
  revalidateEducation(course.slug);
  return {};
}

export async function uploadEducationLessonSource(formData: FormData): Promise<{ error?: string }> {
  const courseId = String(formData.get("courseId") ?? "");
  const lessonId = String(formData.get("lessonId") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: EDUCATION_ADMIN.invalid };
  const parsed = z
    .object({ courseId: z.string().uuid(), lessonId: z.string().uuid() })
    .safeParse({ courseId, lessonId });
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };
  if (!isEducationAwsConfigured()) return { error: EDUCATION_ADMIN.envUnset };

  const contentType = normalizeEducationSourceContentType(file.type, file.name);
  const checked = validateEducationUpload({
    kind: "source",
    contentType,
    byteLength: file.size,
  });
  if (!checked.ok) return { error: EDUCATION_ADMIN.invalid };

  let key: string;
  try {
    key = educationLessonSourceKey(parsed.data.courseId, parsed.data.lessonId, checked.contentType);
  } catch {
    return { error: EDUCATION_ADMIN.invalid };
  }
  if (
    !isEducationObjectKey(key) ||
    !key.startsWith(`courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}/source.`)
  ) {
    return { error: EDUCATION_ADMIN.invalid };
  }

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, education_video_id, modules(course_id, courses(slug))")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (!lesson) return { error: EDUCATION_ADMIN.missing };

  const moduleRow = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
  const course = moduleRow && (Array.isArray(moduleRow.courses) ? moduleRow.courses[0] : moduleRow.courses);
  if (moduleRow?.course_id !== parsed.data.courseId) return { error: EDUCATION_ADMIN.missing };

  try {
    const body = new Uint8Array(await file.arrayBuffer());
    await putEducationSourceObject(key, body, checked.contentType);
  } catch (err) {
    if (err instanceof Error && /environment variable is not set/.test(err.message)) {
      return { error: EDUCATION_ADMIN.envUnset };
    }
    return { error: EDUCATION_ADMIN.uploadFailed };
  }

  const now = new Date().toISOString();
  const { error } = await admin
    .from("lessons")
    .update({
      source_key: key,
      encode_status: null,
      encode_job_id: null,
      encode_error: null,
      hls_key: null,
      encode_updated_at: now,
    })
    .eq("id", parsed.data.lessonId);
  if (error) return { error: error.message };

  if (lesson.education_video_id) {
    await admin
      .from("education_videos")
      .update({
        source_key: key,
        encode_status: null,
        encode_job_id: null,
        encode_error: null,
        hls_key: null,
        encode_updated_at: now,
      })
      .eq("id", lesson.education_video_id);
  }

  if (course?.slug) revalidateEducation(course.slug);
  return {};
}

export async function attachEducationLessonSource(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      lessonId: z.string().uuid(),
      courseId: z.string().uuid(),
      key: z.string().min(1),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };
  if (!isEducationObjectKey(parsed.data.key)) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const expected = parsed.data.key.startsWith(
    `courses/${parsed.data.courseId}/lessons/${parsed.data.lessonId}/source.`,
  );
  if (!expected) return { error: EDUCATION_ADMIN.invalid };

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, education_video_id, modules(courses(slug))")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (!lesson) return { error: EDUCATION_ADMIN.missing };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("lessons")
    .update({
      source_key: parsed.data.key,
      encode_status: null,
      encode_job_id: null,
      encode_error: null,
      hls_key: null,
      encode_updated_at: now,
    })
    .eq("id", parsed.data.lessonId);
  if (error) return { error: error.message };

  if (lesson.education_video_id) {
    await admin
      .from("education_videos")
      .update({
        source_key: parsed.data.key,
        encode_status: null,
        encode_job_id: null,
        encode_error: null,
        hls_key: null,
        encode_updated_at: now,
      })
      .eq("id", lesson.education_video_id);
  }

  const moduleRow = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
  const slug = courseSlugFromJoin(moduleRow?.courses);
  if (slug) revalidateEducation(slug);
  return {};
}

export async function startEducationLessonEncode(raw: unknown): Promise<{ error?: string }> {
  const parsed = z.object({ lessonId: z.string().uuid() }).safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };
  if (!isEducationMediaconvertConfigured()) return { error: EDUCATION_ADMIN.encodeUnset };

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, source_key, encode_status, education_video_id, modules(course_id, courses(slug))")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (!lesson?.source_key) return { error: EDUCATION_ADMIN.encodeNone };
  if (!canStartEducationEncode(lesson)) return { error: EDUCATION_ADMIN.encodeFailed };

  const moduleRow = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
  const courseId = moduleRow?.course_id;
  const slug = courseSlugFromJoin(moduleRow?.courses);
  if (!courseId) return { error: EDUCATION_ADMIN.missing };

  const hlsKey = educationHlsManifestKey(courseId, lesson.id);
  try {
    const { externalJobId } = await submitEducationHlsJob({
      sourceKey: lesson.source_key,
      destinationPrefix: educationHlsPrefix(courseId, lesson.id),
    });
    const now = new Date().toISOString();
    const { error } = await admin
      .from("lessons")
      .update({
        encode_status: "submitted",
        encode_job_id: externalJobId,
        encode_error: null,
        hls_key: hlsKey,
        encode_updated_at: now,
      })
      .eq("id", lesson.id);
    if (error) return { error: error.message };
    if (lesson.education_video_id) {
      await admin
        .from("education_videos")
        .update({
          encode_status: "submitted",
          encode_job_id: externalJobId,
          encode_error: null,
          hls_key: hlsKey,
          encode_updated_at: now,
        })
        .eq("id", lesson.education_video_id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : EDUCATION_ADMIN.encodeFailed;
    await admin
      .from("lessons")
      .update({
        encode_status: "submit_failed",
        encode_error: message,
        encode_updated_at: new Date().toISOString(),
      })
      .eq("id", lesson.id);
    if (lesson.education_video_id) {
      await admin
        .from("education_videos")
        .update({
          encode_status: "submit_failed",
          encode_error: message,
          encode_updated_at: new Date().toISOString(),
        })
        .eq("id", lesson.education_video_id);
    }
    if (slug) revalidateEducation(slug);
    if (/environment variable is not set/.test(message)) return { error: EDUCATION_ADMIN.encodeUnset };
    return { error: message };
  }

  if (slug) revalidateEducation(slug);
  return {};
}

export async function refreshEducationLessonEncode(raw: unknown): Promise<{ error?: string }> {
  const parsed = z.object({ lessonId: z.string().uuid() }).safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };
  if (!isEducationMediaconvertConfigured()) return { error: EDUCATION_ADMIN.encodeUnset };

  const admin = createAdminClient();
  const { data: lesson } = await admin
    .from("lessons")
    .select("id, encode_job_id, education_video_id, modules(courses(slug))")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (!lesson?.encode_job_id) return { error: EDUCATION_ADMIN.encodeNone };

  try {
    const job = await getEducationEncodeJob(lesson.encode_job_id);
    if (!job.status) return {};
    const now = new Date().toISOString();
    const { error } = await admin
      .from("lessons")
      .update({
        encode_status: job.status,
        encode_error: job.errorMessage,
        encode_updated_at: now,
      })
      .eq("id", lesson.id);
    if (error) return { error: error.message };
    if (lesson.education_video_id) {
      await admin
        .from("education_videos")
        .update({
          encode_status: job.status,
          encode_error: job.errorMessage,
          encode_updated_at: now,
        })
        .eq("id", lesson.education_video_id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : EDUCATION_ADMIN.encodeFailed;
    if (/environment variable is not set/.test(message)) return { error: EDUCATION_ADMIN.encodeUnset };
    return { error: EDUCATION_ADMIN.encodeFailed };
  }

  const moduleRow = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
  const slug = courseSlugFromJoin(moduleRow?.courses);
  if (slug) revalidateEducation(slug);
  return {};
}

async function applyEducationPositions(
  admin: AdminClient,
  table: "courses" | "modules" | "lessons",
  orderedIds: string[],
): Promise<{ error?: string }> {
  for (const [index, id] of orderedIds.entries()) {
    const { error } = await admin.from(table).update({ position: index + 1 }).eq("id", id);
    if (error) return { error: error.message };
  }
  return {};
}

export async function reorderEducationCourses(raw: unknown): Promise<{ error?: string }> {
  const parsed = z.object({ orderedIds: z.array(z.string().uuid()).min(1) }).safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const admin = createAdminClient();
  const { data, error } = await admin.from("courses").select("id");
  if (error) return { error: error.message };
  const known = new Set((data ?? []).map((row) => row.id));
  if (parsed.data.orderedIds.some((id) => !known.has(id))) return { error: EDUCATION_ADMIN.invalid };

  const applied = await applyEducationPositions(admin, "courses", parsed.data.orderedIds);
  if (applied.error) return applied;
  revalidateEducation();
  return {};
}

export async function reorderEducationModules(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      courseId: z.string().uuid(),
      orderedIds: z.array(z.string().uuid()).min(1),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("slug")
    .eq("id", parsed.data.courseId)
    .maybeSingle();
  if (!course) return { error: EDUCATION_ADMIN.missing };

  const { data, error } = await admin
    .from("modules")
    .select("id")
    .eq("course_id", parsed.data.courseId);
  if (error) return { error: error.message };
  const known = new Set((data ?? []).map((row) => row.id));
  if (parsed.data.orderedIds.some((id) => !known.has(id))) return { error: EDUCATION_ADMIN.invalid };

  const applied = await applyEducationPositions(admin, "modules", parsed.data.orderedIds);
  if (applied.error) return applied;
  revalidateEducation(course.slug);
  return {};
}

export async function reorderEducationLessons(raw: unknown): Promise<{ error?: string }> {
  const parsed = z
    .object({
      moduleId: z.string().uuid(),
      orderedIds: z.array(z.string().uuid()).min(1),
    })
    .safeParse(raw);
  if (!parsed.success) return { error: EDUCATION_ADMIN.invalid };

  const staff = await requireEducationStaff();
  if (!staff.ok) return { error: staff.error };

  const admin = createAdminClient();
  const { data: moduleRow } = await admin
    .from("modules")
    .select("id, courses(slug)")
    .eq("id", parsed.data.moduleId)
    .maybeSingle();
  if (!moduleRow) return { error: EDUCATION_ADMIN.missing };

  const { data, error } = await admin
    .from("lessons")
    .select("id")
    .eq("module_id", parsed.data.moduleId);
  if (error) return { error: error.message };
  const known = new Set((data ?? []).map((row) => row.id));
  if (parsed.data.orderedIds.some((id) => !known.has(id))) return { error: EDUCATION_ADMIN.invalid };

  const applied = await applyEducationPositions(admin, "lessons", parsed.data.orderedIds);
  if (applied.error) return applied;
  const slug = courseSlugFromJoin(moduleRow.courses);
  if (slug) revalidateEducation(slug);
  return {};
}

export type { CourseStatus };
