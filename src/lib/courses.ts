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
  is_flagship_free: boolean;
  created_at: string;
};

export type CourseModuleRow = {
  id: string;
  course_id: string;
  title: string;
  position: number;
};

export type CourseLessonRow = {
  id: string;
  module_id: string;
  title: string;
  position: number;
  duration_seconds: number | null;
  free_preview: boolean;
};

export type CourseOutlineModule = CourseModuleRow & { lessons: CourseLessonRow[] };

export type CourseDetail = {
  course: CourseRow | null;
  hasAccess: boolean;
  modules: CourseOutlineModule[];
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

export async function loadDiscoverableCourses(
  supabase: ServerClient,
): Promise<CourseRow[]> {
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, description, is_flagship_free, created_at")
    .order("created_at", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));
  return (data ?? []) as CourseRow[];
}

export async function loadCourseDetail(
  supabase: ServerClient,
  slug: string,
  userId: string,
): Promise<CourseDetail> {
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, description, is_flagship_free, created_at")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();

  if (!course) {
    return { course: null, hasAccess: false, modules: [] };
  }

  const { data: access } = await supabase.rpc("has_course_access", {
    p_user: userId,
    p_course: course.id,
  });
  const hasAccess = access === true;

  const { data: moduleRows } = await supabase
    .from("modules")
    .select("id, course_id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));

  const modules = (moduleRows ?? []) as CourseModuleRow[];
  const moduleIds = modules.map((module) => module.id);
  if (moduleIds.length === 0) {
    return { course, hasAccess, modules: [] };
  }

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("id, module_id, title, position, duration_seconds, free_preview")
    .in("module_id", moduleIds)
    .order("position", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));

  return {
    course,
    hasAccess,
    modules: outlineForDisplay(modules, (lessonRows ?? []) as CourseLessonRow[], hasAccess),
  };
}
