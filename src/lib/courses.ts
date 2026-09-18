import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import type { CourseStatus } from "@/lib/education";
import type { createClient } from "@/lib/supabase/server";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";

// Course placeholders. Members browse and consume titles only.
// Company / admin / service / migration seed publish. No member write.

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_key: string | null;
  is_flagship_free: boolean;
  price_cents: number | null;
  catalog_code: string;
  status: CourseStatus;
  position: number;
  instructor_id: string | null;
  created_at: string;
};

export const COURSE_MEMBER_SELECT =
  "id, slug, title, description, cover_key, is_flagship_free, price_cents, catalog_code, status, position, instructor_id, created_at";

export const COURSE_COVER_ASPECT_CLASS = "aspect-video";

export type CourseModuleRow = {
  id: string;
  course_id: string;
  title: string;
  position: number;
};

export type CourseEncodeStatus =
  | "submitted"
  | "running"
  | "complete"
  | "failed"
  | "submit_failed";

export type CourseLessonRow = {
  id: string;
  module_id: string;
  title: string;
  position: number;
  duration_seconds: number | null;
  free_preview: boolean;
  summary: string | null;
  cover_key: string | null;
  lesson_type: string;
  education_video_id: string | null;
  source_key: string | null;
  hls_key: string | null;
  encode_status: CourseEncodeStatus | null;
  encode_error?: string | null;
  playbackUrl?: string | null;
};

export type CourseOutlineModule = CourseModuleRow & { lessons: CourseLessonRow[] };

export type CourseDetail = {
  course: CourseRow | null;
  hasAccess: boolean;
  modules: CourseOutlineModule[];
  failed: boolean;
};

export type CourseListResult = {
  courses: CourseRow[];
  failed: boolean;
};

export function courseHref(slug: string): string {
  return `${SOCIAL_ROUTES.courses}/${encodeURIComponent(slug)}`;
}

// Mirrors has_course_access while member_tier_rank is the Pack 1 stub (0).
// Do not invent an entitlements lookup or a buy path.
export function courseAccessGranted(
  isFlagshipFree: boolean,
  memberTierRank: number,
): boolean {
  return isFlagshipFree || memberTierRank >= 1;
}

export function visibleCourseLessons(
  lessons: CourseLessonRow[],
  hasAccess: boolean,
): CourseLessonRow[] {
  if (hasAccess) return lessons;
  return lessons.filter((lesson) => lesson.free_preview);
}

export function outlineForDisplay(
  modules: CourseModuleRow[],
  lessons: CourseLessonRow[],
  hasAccess: boolean,
): CourseOutlineModule[] {
  const visible = visibleCourseLessons(lessons, hasAccess);
  const grouped = modules
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((module) => ({
      ...module,
      lessons: visible
        .filter((lesson) => lesson.module_id === module.id)
        .sort((a, b) => a.position - b.position),
    }));
  if (hasAccess) return grouped;
  return grouped.filter((module) => module.lessons.length > 0);
}

export function firstOutlineLesson(
  modules: CourseOutlineModule[],
): CourseLessonRow | null {
  for (const courseModule of modules) {
    const lesson = courseModule.lessons[0];
    if (lesson) return lesson;
  }
  return null;
}

export function lessonInOutline(
  modules: CourseOutlineModule[],
  lessonId: string,
): CourseLessonRow | null {
  for (const courseModule of modules) {
    const lesson = courseModule.lessons.find((row) => row.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

export function courseLessonDurationLabel(seconds: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes === 0) return `${remainder}s`;
  if (remainder === 0) return `${minutes}m`;
  return `${minutes}m ${remainder}s`;
}

export type CourseDiscoverMeta = {
  lessonCount: number;
  durationSeconds: number | null;
};

export function courseOutlineMeta(
  lessons: Pick<CourseLessonRow, "duration_seconds">[],
): CourseDiscoverMeta {
  const durations = lessons
    .map((lesson) => lesson.duration_seconds)
    .filter((seconds): seconds is number => seconds != null && seconds > 0);
  return {
    lessonCount: lessons.length,
    durationSeconds: durations.length > 0 ? durations.reduce((sum, seconds) => sum + seconds, 0) : null,
  };
}

export function courseDiscoverMetaLabel(meta: CourseDiscoverMeta): string | null {
  const parts: string[] = [];
  if (meta.lessonCount === 1) parts.push(SOCIAL.courses.lessonOne);
  if (meta.lessonCount > 1) parts.push(`${meta.lessonCount} ${SOCIAL.courses.lessons}`);
  const duration = courseLessonDurationLabel(meta.durationSeconds);
  if (duration) parts.push(duration);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export async function loadDiscoverableCourseMeta(
  supabase: ServerClient,
  courses: CourseRow[],
): Promise<Map<string, CourseDiscoverMeta>> {
  const meta = new Map<string, CourseDiscoverMeta>();
  if (courses.length === 0) return meta;

  const { data: moduleRows, error: moduleError } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("course_id", courses.map((course) => course.id))
    .range(...rangeFor(UNPAGINATED_MAX));
  if (moduleError || !moduleRows?.length) return meta;

  const modules = moduleRows as { id: string; course_id: string }[];
  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select("id, module_id, duration_seconds")
    .in(
      "module_id",
      modules.map((module) => module.id),
    )
    .range(...rangeFor(UNPAGINATED_MAX));
  if (lessonError || !lessonRows) return meta;

  const lessonsByModule = new Map<string, Pick<CourseLessonRow, "duration_seconds">[]>();
  for (const lesson of lessonRows as {
    id: string;
    module_id: string;
    duration_seconds: number | null;
  }[]) {
    const list = lessonsByModule.get(lesson.module_id) ?? [];
    list.push({ duration_seconds: lesson.duration_seconds });
    lessonsByModule.set(lesson.module_id, list);
  }

  const lessonsByCourse = new Map<string, Pick<CourseLessonRow, "duration_seconds">[]>();
  for (const courseModule of modules) {
    const list = lessonsByCourse.get(courseModule.course_id) ?? [];
    list.push(...(lessonsByModule.get(courseModule.id) ?? []));
    lessonsByCourse.set(courseModule.course_id, list);
  }

  for (const course of courses) {
    const lessons = lessonsByCourse.get(course.id) ?? [];
    if (lessons.length > 0) meta.set(course.id, courseOutlineMeta(lessons));
  }
  return meta;
}

export async function loadCourseInstructorName(
  supabase: ServerClient,
  instructorId: string | null,
): Promise<string | null> {
  if (!instructorId) return null;
  const { data, error } = await supabase
    .from("instructors")
    .select("name")
    .eq("id", instructorId)
    .maybeSingle();
  if (error || !data) return null;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  return name || null;
}

export async function loadDiscoverableLessonTitles(
  supabase: ServerClient,
  courses: CourseRow[],
): Promise<Map<string, string[]>> {
  const titles = new Map<string, string[]>();
  if (courses.length === 0) return titles;

  const { data: moduleRows, error: moduleError } = await supabase
    .from("modules")
    .select("id, course_id")
    .in("course_id", courses.map((course) => course.id))
    .range(...rangeFor(UNPAGINATED_MAX));
  if (moduleError || !moduleRows?.length) return titles;

  const modules = moduleRows as { id: string; course_id: string }[];
  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select("id, module_id, title")
    .in(
      "module_id",
      modules.map((module) => module.id),
    )
    .range(...rangeFor(UNPAGINATED_MAX));
  if (lessonError || !lessonRows) return titles;

  const titlesByModule = new Map<string, string[]>();
  for (const lesson of lessonRows as { id: string; module_id: string; title: string }[]) {
    const list = titlesByModule.get(lesson.module_id) ?? [];
    if (lesson.title) list.push(lesson.title);
    titlesByModule.set(lesson.module_id, list);
  }

  for (const courseModule of modules) {
    const list = titles.get(courseModule.course_id) ?? [];
    list.push(...(titlesByModule.get(courseModule.id) ?? []));
    titles.set(courseModule.course_id, list);
  }
  return titles;
}

export async function loadDiscoverableCourses(
  supabase: ServerClient,
): Promise<CourseListResult> {
  const { data, error } = await supabase
    .from("courses")
    .select(COURSE_MEMBER_SELECT)
    .eq("status", "published")
    .order("position", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));
  if (error) return { courses: [], failed: true };
  return { courses: (data ?? []) as CourseRow[], failed: false };
}

export async function loadCourseDetail(
  supabase: ServerClient,
  slug: string,
  userId: string,
): Promise<CourseDetail> {
  const { data: course, error } = await supabase
    .from("courses")
    .select(COURSE_MEMBER_SELECT)
    .eq("slug", decodeURIComponent(slug))
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    return { course: null, hasAccess: false, modules: [], failed: true };
  }

  if (!course) {
    return { course: null, hasAccess: false, modules: [], failed: false };
  }

  const { data: access } = await supabase.rpc("has_course_access", {
    p_user: userId,
    p_course: course.id,
  });
  const hasAccess = access === true;

  const { data: moduleRows, error: moduleError } = await supabase
    .from("modules")
    .select("id, course_id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));

  if (moduleError) {
    return { course, hasAccess, modules: [], failed: true };
  }

  const modules = (moduleRows ?? []) as CourseModuleRow[];
  const moduleIds = modules.map((module) => module.id);
  if (moduleIds.length === 0) {
    return { course, hasAccess, modules: [], failed: false };
  }

  const { data: lessonRows, error: lessonError } = await supabase
    .from("lessons")
    .select(
      "id, module_id, title, position, duration_seconds, free_preview, summary, cover_key, lesson_type, education_video_id, source_key, hls_key, encode_status",
    )
    .in("module_id", moduleIds)
    .order("position", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));

  if (lessonError) {
    return { course, hasAccess, modules: [], failed: true };
  }

  return {
    course,
    hasAccess,
    modules: outlineForDisplay(modules, (lessonRows ?? []) as CourseLessonRow[], hasAccess),
    failed: false,
  };
}
