import { SOCIAL_ROUTES } from "@/lib/social";
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
  created_at: string;
};

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
  source_key: string | null;
  hls_key: string | null;
  encode_status: CourseEncodeStatus | null;
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

export async function loadDiscoverableCourses(
  supabase: ServerClient,
): Promise<CourseListResult> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, description, cover_key, is_flagship_free, created_at")
    .order("created_at", { ascending: true })
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
    .select("id, slug, title, description, cover_key, is_flagship_free, created_at")
    .eq("slug", decodeURIComponent(slug))
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
      "id, module_id, title, position, duration_seconds, free_preview, source_key, hls_key, encode_status",
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
