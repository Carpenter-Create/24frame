import { z } from "zod";

// Education storage + staff admin contracts. Dedicated 24frame-education
// source/output pair. Never 24frame-media, never title film, never
// finance, never avatars. Staff writes are app-layer only.
// Staff CMS lives at /education under (operator). Member discover stays
// Route A /social/courses.

export const EDUCATION_HREF = "/education";

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
export const EDUCATION_NAME_MAX = 80;
export const EDUCATION_SUMMARY_MAX = 200;
export const EDUCATION_DURATION_MINUTES_MAX = 24 * 60;
export const EDUCATION_CATALOG_CODE_RE = /^EDU-\d{4,}$/;
export const COURSE_STATUSES = ["draft", "published", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];
export const EDUCATION_LESSON_TYPES = ["lesson"] as const;
export type EducationLessonType = (typeof EDUCATION_LESSON_TYPES)[number];

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
export type EducationUploadKind = "cover" | "source" | "lesson_cover";

export const COURSE_ENCODE_STATUSES = [
  "submitted",
  "running",
  "complete",
  "failed",
  "submit_failed",
] as const;

export type CourseEncodeStatus = (typeof COURSE_ENCODE_STATUSES)[number];

export const EDUCATION_ADMIN = {
  title: "Manage courses",
  subtitle: "Draft, publish, and place courses.",
  create: "Create course",
  newCourse: "New course",
  newLesson: "New lesson",
  save: "Save",
  saving: "Saving…",
  cancel: "Cancel",
  empty: "No courses yet.",
  error: "Education could not be loaded.",
  missing: "That course is not visible.",
  notAuthorized: "Not authorized.",
  notAuthenticated: "Not authenticated.",
  envUnset: "Education storage is not configured.",
  encodeUnset: "Encode is not configured.",
  slug: "Slug",
  slugHint: "Filled from the title. Change it only if you need a specific URL.",
  courseTitle: "Name",
  description: "Summary",
  catalogCode: "Catalog code",
  status: "Status",
  draft: "Draft",
  published: "Published",
  archived: "Archived",
  instructor: "Instructor",
  instructorHint: "Optional. Choose an existing instructor.",
  instructorNone: "None",
  position: "Position",
  flagship: "Flagship (free)",
  model: "Access",
  free: "Free",
  paid: "Paid",
  price: "Price (USD)",
  oneTime: "One-time",
  cover: "Cover",
  coverHint: "Drop a cover or click to upload.",
  uploadCover: "Upload cover",
  addModule: "Add module",
  addLesson: "Add lesson",
  moduleTitle: "Module title",
  lessonTitle: "Name",
  lessonSummary: "Summary",
  lessonType: "Lesson type",
  lessonTypeLesson: "Lesson",
  duration: "Duration (minutes)",
  modulePlacement: "Section",
  source: "Lesson source",
  uploadSource: "Upload source",
  startEncode: "Start encode",
  refreshEncode: "Refresh encode",
  encodeNone: "No source yet.",
  encodeSourceReady: "Source ready.",
  encodeReady: "Ready",
  encodePillNone: "No source",
  encodePillSourceReady: "Source ready",
  encodePillEncoding: "Encoding",
  encodePillComplete: "Complete",
  encodePillError: "Error",
  editSettings: "Edit settings",
  editLesson: "Edit lesson",
  settings: "Course settings",
  publish: "Publish",
  playlist: "Playlist",
  videos: "Videos",
  selectCourse: "Select a course.",
  selectVideo: "Select a video.",
  emptyOutline: "Add a module, then a lesson.",
  retry: "Retry",
  upload: "Upload",
  encode: "Encode",
  refresh: "Refresh",
  consume: "Open consume view",
  consumePath: "Consume path",
  manage: "Course management",
  invalid: "Check the fields and try again.",
  conflict: "That slug is already in use.",
  uploadFailed: "Upload could not start.",
  encodeFailed: "Encode could not start.",
  needsModule: "Add a section before you add a lesson.",
} as const;

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: EDUCATION_ADMIN.draft,
  published: EDUCATION_ADMIN.published,
  archived: EDUCATION_ADMIN.archived,
};

export const EDUCATION_ENCODE_LABELS: Record<CourseEncodeStatus, string> = {
  submitted: "Submitted",
  running: "Running",
  complete: "Complete",
  failed: "Failed",
  submit_failed: "Submit failed",
};

export const EDUCATION_ENCODE_PILLS = {
  none: EDUCATION_ADMIN.encodePillNone,
  source_ready: EDUCATION_ADMIN.encodePillSourceReady,
  encoding: EDUCATION_ADMIN.encodePillEncoding,
  complete: EDUCATION_ADMIN.encodePillComplete,
  error: EDUCATION_ADMIN.encodePillError,
} as const;

export type EducationEncodePill = (typeof EDUCATION_ENCODE_PILLS)[keyof typeof EDUCATION_ENCODE_PILLS];

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

const COVER_TYPE_ALIASES: Record<string, EducationImageContentType> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};

const COVER_EXT_TYPES: Record<string, EducationImageContentType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Browsers sometimes send `image/jpg` or an empty type; infer from the name. */
export function normalizeEducationCoverContentType(contentType: string, fileName = ""): string {
  const raw = contentType.trim().toLowerCase();
  if (isEducationImageContentType(raw)) return raw;
  if (raw in COVER_TYPE_ALIASES) return COVER_TYPE_ALIASES[raw];
  const ext = fileName.trim().toLowerCase().split(".").pop() ?? "";
  return COVER_EXT_TYPES[ext] ?? contentType;
}

export function isEducationVideoContentType(value: string): value is EducationVideoContentType {
  return (EDUCATION_VIDEO_CONTENT_TYPES as readonly string[]).includes(value);
}

const SOURCE_TYPE_ALIASES: Record<string, EducationVideoContentType> = {
  "video/x-m4v": "video/mp4",
  "video/x-mp4": "video/mp4",
};

const SOURCE_EXT_TYPES: Record<string, EducationVideoContentType> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/** Browsers sometimes send an empty type for MP4; infer from the name. */
export function normalizeEducationSourceContentType(contentType: string, fileName = ""): string {
  const raw = contentType.trim().toLowerCase();
  if (isEducationVideoContentType(raw)) return raw;
  if (raw in SOURCE_TYPE_ALIASES) return SOURCE_TYPE_ALIASES[raw];
  const ext = fileName.trim().toLowerCase().split(".").pop() ?? "";
  return SOURCE_EXT_TYPES[ext] ?? contentType;
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
    /^courses\/[0-9a-f-]{36}\/lessons\/[0-9a-f-]{36}\/cover\.(jpg|jpeg|png|webp)$/i.test(key) ||
    /^courses\/[0-9a-f-]{36}\/lessons\/[0-9a-f-]{36}\/source\.(mp4|mov|webm)$/i.test(key) ||
    /^courses\/[0-9a-f-]{36}\/lessons\/[0-9a-f-]{36}\/hls\/source\.m3u8$/i.test(key)
  );
}

export function educationLessonCoverKey(
  courseId: string,
  lessonId: string,
  contentType: string,
): string {
  const course = uuidSchema.safeParse(courseId);
  const lesson = uuidSchema.safeParse(lessonId);
  if (!course.success || !lesson.success) {
    throw new Error("Education lesson cover key requires course and lesson ids");
  }
  if (!isEducationImageContentType(contentType)) {
    throw new Error("Unsupported education cover type");
  }
  return `${EDUCATION_KEY_PREFIX}/${course.data}/lessons/${lesson.data}/cover.${EXT_BY_IMAGE[contentType]}`;
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

/** Cookie Path / Resource stem. No trailing slash. */
export function educationHlsCookiePath(courseId: string, lessonId: string): string {
  return `/${educationHlsPrefix(courseId, lessonId).replace(/\/$/, "")}`;
}

export function educationHlsCookieResource(
  origin: string,
  courseId: string,
  lessonId: string,
): string {
  return `${origin.replace(/\/+$/, "")}${educationHlsCookiePath(courseId, lessonId)}/*`;
}

export function educationHlsPlaybackHref(courseId: string, lessonId: string): string {
  educationHlsPrefix(courseId, lessonId);
  return `/api/education/hls/${courseId}/${lessonId}/source.m3u8`;
}

export function educationHlsAssetKey(
  courseId: string,
  lessonId: string,
  assetPath: string,
): string | null {
  let prefix: string;
  try {
    prefix = educationHlsPrefix(courseId, lessonId);
  } catch {
    return null;
  }
  const rest = assetPath.replace(/^\/+/, "");
  if (!rest || rest.includes("..") || rest.includes("\\") || rest.includes("//")) {
    return null;
  }
  if (!/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(rest)) {
    return null;
  }
  const key = `${prefix}${rest}`;
  if (isForbiddenEducationKey(key)) return null;
  return key;
}

export function educationHlsContentType(assetPath: string): string {
  const name = assetPath.toLowerCase();
  if (name.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (name.endsWith(".ts")) return "video/mp2t";
  if (name.endsWith(".m4s")) return "video/iso.segment";
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".aac")) return "audio/aac";
  if (name.endsWith(".vtt")) return "text/vtt";
  return "application/octet-stream";
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
  if (input.kind === "cover" || input.kind === "lesson_cover") {
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

export function educationEncodeLabel(
  status: CourseEncodeStatus | string | null | undefined,
  hasSource = false,
): string {
  if (status && (COURSE_ENCODE_STATUSES as readonly string[]).includes(status)) {
    return EDUCATION_ENCODE_LABELS[status as CourseEncodeStatus];
  }
  if (hasSource) return EDUCATION_ADMIN.encodeSourceReady;
  return EDUCATION_ADMIN.encodeNone;
}

export function educationEncodePill(
  status: CourseEncodeStatus | string | null | undefined,
  hasSource = false,
): EducationEncodePill {
  if (status === "complete") return EDUCATION_ENCODE_PILLS.complete;
  if (status === "submitted" || status === "running") return EDUCATION_ENCODE_PILLS.encoding;
  if (status === "failed" || status === "submit_failed") return EDUCATION_ENCODE_PILLS.error;
  if (hasSource) return EDUCATION_ENCODE_PILLS.source_ready;
  return EDUCATION_ENCODE_PILLS.none;
}

export function canRefreshEducationEncode(status: CourseEncodeStatus | string | null | undefined): boolean {
  return status === "submitted" || status === "running" || status === "failed" || status === "submit_failed";
}

export function educationQuietDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function moveOrderedIds(ids: readonly string[], fromIndex: number, toIndex: number): string[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= ids.length ||
    toIndex >= ids.length
  ) {
    return [...ids];
  }
  const next = [...ids];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return [...ids];
  next.splice(toIndex, 0, moved);
  return next;
}

const EDUCATION_ENCODE_RESUBMIT_STATUSES = ["failed", "submit_failed"] as const;

export function canStartEducationEncode(lesson: {
  source_key?: string | null;
  encode_status?: CourseEncodeStatus | string | null;
}): boolean {
  if (!lesson.source_key) return false;
  const status = lesson.encode_status;
  if (!status) return true;
  return (EDUCATION_ENCODE_RESUBMIT_STATUSES as readonly string[]).includes(status);
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

export function isEducationCatalogCode(value: string): boolean {
  return EDUCATION_CATALOG_CODE_RE.test(value);
}

export function isCourseStatus(value: string): value is CourseStatus {
  return (COURSE_STATUSES as readonly string[]).includes(value);
}

export function educationCharCount(value: string, max: number): string {
  return `${value.length}/${max}`;
}

export function minutesToDurationSeconds(minutes: number): number | null {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > EDUCATION_DURATION_MINUTES_MAX) {
    return null;
  }
  return minutes * 60;
}

export function durationSecondsToMinutesInput(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "";
  return String(Math.max(1, Math.round(seconds / 60)));
}

export function allocateCourseSlug(
  title: string,
  existing: string[],
  override?: string,
): string | null {
  const raw = override?.trim() ? override : title;
  const base = normalizeCourseSlug(raw);
  if (!base) return null;
  const taken = new Set(existing.map((slug) => slug.toLowerCase()));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n += 1) {
    const suffix = `-${n}`;
    const trimmed = base.slice(0, Math.max(1, EDUCATION_SLUG_MAX - suffix.length)).replace(/-+$/g, "");
    const candidate = normalizeCourseSlug(`${trimmed}${suffix}`);
    if (candidate && !taken.has(candidate)) return candidate;
  }
  return null;
}
