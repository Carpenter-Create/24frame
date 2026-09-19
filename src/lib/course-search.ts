import type { CourseOutlineModule } from "@/lib/courses";
import { EDUCATION_HREF, EDUCATION_MANAGE_HREF } from "@/lib/education";

// Quiet Education header search. Course + video only. Copy lives here,
// not in JSX. Desktop mounts in the shared mid-lead slot with Social
// live Explore search (Facebook-compact). Phone mounts in a full-width
// row under HouseLeadChrome. Aggregation keeps no top search.
// Do not reuse HousePageSearch — Education is a GET form, not in-page debounce.

export const EDUCATION_SEARCH = {
  label: "Search courses and videos",
  placeholder: "Search courses and videos",
} as const;

export function parseEducationSearchQuery(raw: string | null | undefined): string {
  return raw?.trim() ?? "";
}

export function educationSearchAction(pathname: string): string {
  if (pathname === EDUCATION_MANAGE_HREF || pathname.startsWith(`${EDUCATION_MANAGE_HREF}/`)) {
    return EDUCATION_MANAGE_HREF;
  }
  if (pathname === EDUCATION_HREF || pathname.startsWith(`${EDUCATION_HREF}/`)) {
    return pathname === EDUCATION_HREF ? EDUCATION_HREF : pathname;
  }
  return EDUCATION_HREF;
}

export function educationSearchHaystack(
  ...parts: Array<string | null | undefined>
): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLowerCase();
}

export function educationSearchMatches(haystack: string, query: string): boolean {
  const q = parseEducationSearchQuery(query);
  if (!q) return true;
  return haystack.toLowerCase().includes(q.toLowerCase());
}

export function filterCoursesForEducationSearch<
  T extends {
    id: string;
    title: string;
    description?: string | null;
    catalog_code?: string | null;
  },
>(
  courses: readonly T[],
  query: string,
  lessonTitlesByCourseId: ReadonlyMap<string, readonly string[]> = new Map(),
): T[] {
  const q = parseEducationSearchQuery(query);
  if (!q) return [...courses];
  return courses.filter((course) =>
    educationSearchMatches(
      educationSearchHaystack(
        course.title,
        course.description,
        course.catalog_code,
        ...(lessonTitlesByCourseId.get(course.id) ?? []),
      ),
      q,
    ),
  );
}

export function filterEducationOutline(
  modules: readonly CourseOutlineModule[],
  query: string,
): CourseOutlineModule[] {
  const q = parseEducationSearchQuery(query);
  if (!q) return [...modules];
  return modules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter((lesson) =>
        educationSearchMatches(
          educationSearchHaystack(module.title, lesson.title, lesson.summary),
          q,
        ),
      ),
    }))
    .filter(
      (module) =>
        module.lessons.length > 0 ||
        educationSearchMatches(educationSearchHaystack(module.title), q),
    );
}
