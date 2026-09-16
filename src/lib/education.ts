import { z } from "zod";

// Education storage + staff admin contracts. Dedicated 24frame-education
// source/output pair. Never 24frame-media, never title film, never
// finance, never avatars. Staff writes are app-layer only.

export const EDUCATION_HREF = "/gc/education";

export const EDUCATION_AWS_ENV = [
  "EDUCATION_AWS_REGION",
  "EDUCATION_AWS_ACCESS_KEY_ID",
  "EDUCATION_AWS_SECRET_ACCESS_KEY",
] as const;

export const EDUCATION_S3_ENV = [
  "S3_EDUCATION_SOURCE_BUCKET",
  "S3_EDUCATION_OUTPUT_BUCKET",
] as const;

export const EDUCATION_MEDIACONVERT_ENV = [
  "EDUCATION_MEDIACONVERT_ENDPOINT",
  "EDUCATION_MEDIACONVERT_ROLE_ARN",
  "EDUCATION_MEDIACONVERT_QUEUE_ARN",
] as const;

export const EDUCATION_CLOUDFRONT_ENV = [
  "EDUCATION_CLOUDFRONT_DOMAIN",
  "EDUCATION_CLOUDFRONT_KEY_PAIR_ID",
  "EDUCATION_CLOUDFRONT_PRIVATE_KEY",
] as const;

/** Proposed buckets. Not created — Adam confirm. */
export const EDUCATION_BUCKETS = {
  source: {
    prod: "24frame-education-source-prod",
    dev: "24frame-education-source-dev",
  },
  output: {
    prod: "24frame-education-output-prod",
    dev: "24frame-education-output-dev",
  },
} as const;

export const EDUCATION_AWS_ACCOUNT = "405912452061";
export const EDUCATION_AWS_REGION = "us-west-2";

export const FORBIDDEN_EDUCATION_BUCKET_MARKERS = [
  "24frame-media",
  "gc-content-assets",
  "gc-avatars",
  "24frame-finance",
] as const;

export const FORBIDDEN_EDUCATION_KEY_MARKERS = [
  "orgs/",
  "titles/",
  "avatars/",
  "posts/",
  "stories/",
  "gc-content-assets",
  "24frame-media",
  "24frame-finance",
] as const;

export const EDUCATION_KEY_PREFIX = "courses";
export const EDUCATION_SIGNED_URL_TTL_SECONDS = 300;
export const EDUCATION_PUT_TTL_SECONDS = 900;
export const EDUCATION_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const EDUCATION_VIDEO_MAX_BYTES = 2 * 1024 * 1024 * 1024;
export const EDUCATION_SLUG_MAX = 80;
export const EDUCATION_TITLE_MAX = 160;

export const EDUCATION_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const EDUCATION_VIDEO_CONTENT_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type EducationImageContentType = (typeof EDUCATION_IMAGE_CONTENT_TYPES)[number];
export type EducationVideoContentType = (typeof EDUCATION_VIDEO_CONTENT_TYPES)[number];
export type EducationUploadKind = "cover" | "source";

export const COURSE_ENCODE_STATUSES = [
  "submitted",
  "running",
  "complete",
  "failed",
  "submit_failed",
] as const;

export type CourseEncodeStatus = (typeof COURSE_ENCODE_STATUSES)[number];

export const EDUCATION_ADMIN = {
  title: "Education",
  subtitle: "Courses, modules, and lesson source.",
  create: "Create course",
  save: "Save",
  saving: "Saving…",
  empty: "No courses yet.",
  error: "Education could not be loaded.",
  missing: "That course is not visible.",
  notAuthorized: "Not authorized.",
  notAuthenticated: "Not authenticated.",
  envUnset: "Education storage is not configured.",
  encodeUnset: "Encode is not configured.",
  slug: "Slug",
  courseTitle: "Title",
  description: "Description",
  flagship: "Flagship (free)",
  model: "Access",
  free: "Free",
  paid: "Paid",
  price: "Price (USD)",
  oneTime: "One-time",
  previewHint: "Visible without course access.",
  cover: "Cover",
  uploadCover: "Upload cover",
  addModule: "Add module",
  addLesson: "Add lesson",
  moduleTitle: "Module title",
  lessonTitle: "Lesson title",
  duration: "Duration (seconds)",
  preview: "Free preview",
  source: "Lesson source",
  uploadSource: "Upload source",
  startEncode: "Start encode",
  refreshEncode: "Refresh encode",
  encodeNone: "No source yet.",
  encodeReady: "Ready",
  consume: "Open consume view",
  invalid: "Check the fields and try again.",
  conflict: "That slug is already in use.",
  uploadFailed: "Upload could not start.",
  encodeFailed: "Encode could not start.",
} as const;

export const EDUCATION_ENCODE_LABELS: Record<CourseEncodeStatus, string> = {
  submitted: "Submitted",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  submit_failed: "Submit failed",
};

const uuidSchema = z.string().uuid();

const EXT_BY_IMAGE: Record<EducationImageContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const EXT_BY_VIDEO: Record<EducationVideoContentType, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export function isEducationImageContentType(value: string): value is EducationImageContentType {
  return (EDUCATION_IMAGE_CONTENT_TYPES as readonly string[]).includes(value);
}

export function isEducationVideoContentType(value: string): value is EducationVideoContentType {
  return (EDUCATION_VIDEO_CONTENT_TYPES as readonly string[]).includes(value);
}

export function isForbiddenEducationKey(key: string): boolean {
  if (!key || key.includes("..") || key.includes("\\") || key.startsWith("/") || key.includes("//")) {
    return true;
  }
  const lower = key.toLowerCase();
  return FORBIDDEN_EDUCATION_KEY_MARKERS.some((marker) => lower.includes(marker));
}

export function isForbiddenEducationBucket(name: string): boolean {
  const bucket = name.trim().toLowerCase();
  if (!bucket) return true;
  if (FORBIDDEN_EDUCATION_BUCKET_MARKERS.some((marker) => bucket.includes(marker))) {
    return true;
  }
  const titles = (process.env.S3_BUCKET ?? "").toLowerCase();
  const avatars = (process.env.S3_AVATARS_BUCKET ?? "").toLowerCase();
  const mediaSource = (process.env.S3_MEDIA_SOURCE_BUCKET ?? "").toLowerCase();
  const mediaOutput = (process.env.S3_MEDIA_OUTPUT_BUCKET ?? "").toLowerCase();
  const finance = (process.env.S3_FINANCE_BUCKET ?? "").toLowerCase();
  return (
    (titles !== "" && bucket === titles) ||
    (avatars !== "" && bucket === avatars) ||
    (mediaSource !== "" && bucket === mediaSource) ||
    (mediaOutput !== "" && bucket === mediaOutput) ||
    (finance !== "" && bucket === finance)
  );
}

export function assertEducationBucketName(bucket: string, envName: (typeof EDUCATION_S3_ENV)[number]): string {
  if (!bucket) throw new Error(`${envName} environment variable is not set`);
  if (isForbiddenEducationBucket(bucket)) {
    throw new Error(`${envName} must be a dedicated 24Frame education bucket`);
  }
  return bucket;
}

export function isEducationObjectKey(key: string): boolean {
  if (isForbiddenEducationKey(key)) return false;
  return (
    /^courses\/[0-9a-f-]{36}\/cover\.(jpg|jpeg|png|webp)$/i.test(key) ||
    /^courses\/[0-9a-f-]{36}\/lessons\/[0-9a-f-]{36}\/source\.(mp4|mov|webm)$/i.test(key) ||
    /^courses\/[0-9a-f-]{36}\/lessons\/[0-9a-f-]{36}\/hls\/source\.m3u8$/i.test(key)
  );
}

export function educationCoverKey(courseId: string, contentType: string): string {
  const course = uuidSchema.safeParse(courseId);
  if (!course.success) throw new Error("Education cover key requires a course id");
  if (!isEducationImageContentType(contentType)) {
    throw new Error("Unsupported education cover type");
  }
  return `${EDUCATION_KEY_PREFIX}/${course.data}/cover.${EXT_BY_IMAGE[contentType]}`;
}

export function educationLessonSourceKey(
  courseId: string,
  lessonId: string,
  contentType: string,
): string {
  const course = uuidSchema.safeParse(courseId);
  const lesson = uuidSchema.safeParse(lessonId);
  if (!course.success || !lesson.success) {
    throw new Error("Education source key requires course and lesson ids");
  }
  if (!isEducationVideoContentType(contentType)) {
    throw new Error("Unsupported education source type");
  }
  return `${EDUCATION_KEY_PREFIX}/${course.data}/lessons/${lesson.data}/source.${EXT_BY_VIDEO[contentType]}`;
}

export function educationHlsPrefix(courseId: string, lessonId: string): string {
  const course = uuidSchema.safeParse(courseId);
  const lesson = uuidSchema.safeParse(lessonId);
  if (!course.success || !lesson.success) {
    throw new Error("Education output prefix requires course and lesson ids");
  }
  return `${EDUCATION_KEY_PREFIX}/${course.data}/lessons/${lesson.data}/hls/`;
}

export function educationHlsManifestKey(courseId: string, lessonId: string): string {
  return `${educationHlsPrefix(courseId, lessonId)}source.m3u8`;
}

export function normalizeCourseSlug(raw: string): string | null {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug || slug.length > EDUCATION_SLUG_MAX) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

export function validateEducationUpload(input: {
  kind: EducationUploadKind;
  contentType: string;
  byteLength: number;
}):
  | { ok: true; contentType: EducationImageContentType | EducationVideoContentType }
  | { ok: false; error: "type" | "missing" | "tooLarge" } {
  if (!Number.isFinite(input.byteLength) || input.byteLength <= 0) {
    return { ok: false, error: "missing" };
  }
  if (input.kind === "cover") {
    if (!isEducationImageContentType(input.contentType)) return { ok: false, error: "type" };
    if (input.byteLength > EDUCATION_IMAGE_MAX_BYTES) return { ok: false, error: "tooLarge" };
    return { ok: true, contentType: input.contentType };
  }
  if (!isEducationVideoContentType(input.contentType)) return { ok: false, error: "type" };
  if (input.byteLength > EDUCATION_VIDEO_MAX_BYTES) return { ok: false, error: "tooLarge" };
  return { ok: true, contentType: input.contentType };
}

export function lessonPlaybackReady(lesson: {
  encode_status?: CourseEncodeStatus | string | null;
  hls_key?: string | null;
}): boolean {
  return lesson.encode_status === "complete" && Boolean(lesson.hls_key) && !isForbiddenEducationKey(lesson.hls_key ?? "");
}

export function educationEncodeLabel(status: CourseEncodeStatus | string | null | undefined): string {
  if (!status) return EDUCATION_ADMIN.encodeNone;
  if ((COURSE_ENCODE_STATUSES as readonly string[]).includes(status)) {
    return EDUCATION_ENCODE_LABELS[status as CourseEncodeStatus];
  }
  return EDUCATION_ADMIN.encodeNone;
}

export function mapMediaConvertJobStatus(status: string): CourseEncodeStatus | null {
  switch (status) {
    case "SUBMITTED":
      return "submitted";
    case "PROGRESSING":
      return "running";
    case "COMPLETE":
      return "complete";
    case "ERROR":
    case "CANCELED":
      return "failed";
    default:
      return null;
  }
}

export function educationCourseHref(slug: string): string {
  return `${EDUCATION_HREF}/${encodeURIComponent(slug)}`;
}

export const EDUCATION_PRODUCT_MODELS = ["free", "paid"] as const;
export type EducationProductModel = (typeof EDUCATION_PRODUCT_MODELS)[number];
export const EDUCATION_PRICE_CENTS_MAX = 9_999_999;

export function parseEducationPriceDollars(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const cents = Math.round(Number(value) * 100);
  if (!Number.isInteger(cents) || cents < 1 || cents > EDUCATION_PRICE_CENTS_MAX) return null;
  return cents;
}

export function educationPriceInputValue(cents: number | null | undefined): string {
  if (cents == null || cents < 1) return "";
  return (cents / 100).toFixed(2);
}

export function formatEducationPriceCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function resolveEducationProduct(input: {
  model: EducationProductModel;
  priceCents: number | null;
}):
  | { ok: true; is_flagship_free: boolean; price_cents: number | null }
  | { ok: false } {
  if (input.model === "free") {
    return { ok: true, is_flagship_free: true, price_cents: null };
  }
  if (
    input.priceCents == null ||
    !Number.isInteger(input.priceCents) ||
    input.priceCents < 1 ||
    input.priceCents > EDUCATION_PRICE_CENTS_MAX
  ) {
    return { ok: false };
  }
  return { ok: true, is_flagship_free: false, price_cents: input.priceCents };
}

export function educationProductModel(isFlagshipFree: boolean): EducationProductModel {
  return isFlagshipFree ? "free" : "paid";
}

export function educationCommercialLabel(
  isFlagshipFree: boolean,
  priceCents?: number | null,
): string {
  if (isFlagshipFree) return EDUCATION_ADMIN.free;
  if (priceCents != null && priceCents > 0) {
    return `${EDUCATION_ADMIN.paid} · ${formatEducationPriceCents(priceCents)}`;
  }
  return EDUCATION_ADMIN.paid;
}
