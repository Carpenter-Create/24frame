import type { createAdminClient } from "@/lib/supabase/admin";
import { UNPAGINATED_MAX, rangeFor } from "@/lib/list-bounds";
import {
  outlineForDisplay,
  type CourseDetail,
  type CourseLessonRow,
  type CourseModuleRow,
  type CourseRow,
} from "@/lib/courses";

// Staff-only outline. Uses the service-role client after a gc_staff check
// in the operator action/page. Course RLS stays free of is_gc_staff.

type AdminClient = ReturnType<typeof createAdminClient>;

export async function loadEducationAdminDetail(
  admin: AdminClient,
  slug: string,
): Promise<CourseDetail> {
  const { data: course, error } = await admin
    .from("courses")
    .select("id, slug, title, description, cover_key, is_flagship_free, price_cents, created_at")
    .eq("slug", decodeURIComponent(slug))
    .maybeSingle();

  if (error) {
    return { course: null, hasAccess: true, modules: [], failed: true };
  }
  if (!course) {
    return { course: null, hasAccess: true, modules: [], failed: false };
  }

  const { data: moduleRows, error: moduleError } = await admin
    .from("modules")
    .select("id, course_id, title, position")
    .eq("course_id", course.id)
    .order("position", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));

  if (moduleError) {
    return { course: course as CourseRow, hasAccess: true, modules: [], failed: true };
  }

  const modules = (moduleRows ?? []) as CourseModuleRow[];
  const moduleIds = modules.map((module) => module.id);
  if (moduleIds.length === 0) {
    return { course: course as CourseRow, hasAccess: true, modules: [], failed: false };
  }

  const { data: lessonRows, error: lessonError } = await admin
    .from("lessons")
    .select(
      "id, module_id, title, position, duration_seconds, free_preview, source_key, hls_key, encode_status",
    )
    .in("module_id", moduleIds)
    .order("position", { ascending: true })
    .range(...rangeFor(UNPAGINATED_MAX));

  if (lessonError) {
    return { course: course as CourseRow, hasAccess: true, modules: [], failed: true };
  }

  return {
    course: course as CourseRow,
    hasAccess: true,
    modules: outlineForDisplay(modules, (lessonRows ?? []) as CourseLessonRow[], true),
    failed: false,
  };
}
