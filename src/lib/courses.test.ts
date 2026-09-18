import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PRODUCT_NAME } from "@/lib/product";
import { SOCIAL, SOCIAL_ROUTES, socialCourseHref } from "@/lib/social";
import {
  COURSE_COVER_ASPECT_CLASS,
  COURSE_GLANCE_PLATE_CLASSES,
  courseAccessGranted,
  courseGlancePlateClass,
  courseGlanceProgressLabel,
  courseGlanceProgressPercent,
  courseDiscoverMetaLabel,
  courseHref,
  courseLessonDurationLabel,
  courseOutlineMeta,
  firstOutlineLesson,
  lessonInOutline,
  outlineForDisplay,
  visibleCourseLessons,
  type CourseLessonRow,
  type CourseModuleRow,
} from "./courses";

const moduleOne: CourseModuleRow = {
  id: "m1",
  course_id: "c1",
  title: "Orientation",
  position: 1,
};

const preview: CourseLessonRow = {
  id: "l1",
  module_id: "m1",
  title: "What this workspace is",
  position: 1,
  duration_seconds: null,
  free_preview: true,
  summary: null,
  cover_key: null,
  lesson_type: "lesson",
  education_video_id: null,
  source_key: null,
  hls_key: null,
  encode_status: null,
};

const body: CourseLessonRow = {
  id: "l2",
  module_id: "m1",
  title: "What comes later",
  position: 2,
  duration_seconds: null,
  free_preview: false,
  summary: null,
  cover_key: null,
  lesson_type: "lesson",
  education_video_id: null,
  source_key: null,
  hls_key: null,
  encode_status: null,
};

describe("has_course_access mirror", () => {
  it("is true for flagship and false for paid when member_tier_rank is 0", () => {
    expect(courseAccessGranted(true, 0)).toBe(true);
    expect(courseAccessGranted(false, 0)).toBe(false);
    expect(courseAccessGranted(false, 1)).toBe(true);
  });
});

describe("placeholder outline", () => {
  it("keeps every lesson when the member has access", () => {
    expect(visibleCourseLessons([preview, body], true)).toEqual([preview, body]);
    const outline = outlineForDisplay([moduleOne], [body, preview], true);
    expect(outline).toHaveLength(1);
    expect(outline[0].lessons.map((lesson) => lesson.id)).toEqual(["l1", "l2"]);
  });

  it("shows preview titles only when access is denied", () => {
    expect(visibleCourseLessons([preview, body], false)).toEqual([preview]);
    const outline = outlineForDisplay([moduleOne], [preview, body], false);
    expect(outline).toHaveLength(1);
    expect(outline[0].lessons).toEqual([preview]);
    expect(firstOutlineLesson(outline)?.id).toBe("l1");
    expect(lessonInOutline(outline, "l1")).toEqual(preview);
    expect(lessonInOutline(outline, "l2")).toBeNull();
  });

  it("labels real durations only", () => {
    expect(courseLessonDurationLabel(null)).toBeNull();
    expect(courseLessonDurationLabel(0)).toBeNull();
    expect(courseLessonDurationLabel(45)).toBe("45s");
    expect(courseLessonDurationLabel(120)).toBe("2m");
    expect(courseLessonDurationLabel(90)).toBe("1m 30s");
  });

  it("builds quiet discover meta from known lesson counts and durations", () => {
    expect(courseOutlineMeta([])).toEqual({ lessonCount: 0, durationSeconds: null });
    expect(courseDiscoverMetaLabel({ lessonCount: 0, durationSeconds: null })).toBeNull();
    expect(courseOutlineMeta([{ duration_seconds: 120 }])).toEqual({
      lessonCount: 1,
      durationSeconds: 120,
    });
    expect(courseDiscoverMetaLabel({ lessonCount: 1, durationSeconds: 120 })).toBe("1 lesson · 2m");
    expect(
      courseDiscoverMetaLabel(
        courseOutlineMeta([{ duration_seconds: 90 }, { duration_seconds: null }]),
      ),
    ).toBe("2 lessons · 1m 30s");
  });

  it("maps Home glance plates from course id and does not invent percent", () => {
    expect(COURSE_GLANCE_PLATE_CLASSES).toEqual([
      "bg-course-plate-1",
      "bg-course-plate-2",
      "bg-course-plate-3",
      "bg-course-plate-4",
      "bg-course-plate-5",
    ]);
    expect(courseGlancePlateClass("c1")).toBe(courseGlancePlateClass("c1"));
    expect(COURSE_GLANCE_PLATE_CLASSES).toContain(courseGlancePlateClass("c1"));
    expect(courseGlanceProgressPercent(undefined)).toBe(0);
    expect(courseGlanceProgressPercent(null)).toBe(0);
    expect(courseGlanceProgressPercent(Number.NaN)).toBe(0);
    expect(courseGlanceProgressPercent(-4)).toBe(0);
    expect(courseGlanceProgressPercent(140)).toBe(100);
    expect(courseGlanceProgressPercent(40.4)).toBe(40);
    expect(courseGlanceProgressLabel(undefined as unknown as number)).toBe("0% complete");
    expect(courseGlanceProgressLabel(40)).toBe("40% complete");
    expect(courseGlanceProgressLabel(62)).toBe("62% complete");
    expect(courseGlanceProgressLabel(62)).not.toBe(courseGlanceProgressLabel(0));
  });
});

describe("course routes and copy", () => {
  it("uses Education land copy on Route A and stays browse-only", () => {
    expect(SOCIAL_ROUTES.courses).toBe("/social/courses");
    expect(socialCourseHref("welcome-to-24frame")).toBe("/social/courses/welcome-to-24frame");
    expect(courseHref("social-education")).toBe("/social/courses/social-education");
    expect(SOCIAL.courses.title).toBe("Education");
    expect(SOCIAL.courses.subtitle).toBe(`Education in ${PRODUCT_NAME}.`);
    expect(SOCIAL.courses.subtitle).not.toContain("Social+Education");
    expect(SOCIAL.courses.subtitle).not.toMatch(/placeholder/i);
    expect(SOCIAL.courses.empty).toBe("Nothing here yet.");
    expect(SOCIAL.courses.playlist).toBe("Playlist");
    expect(SOCIAL.courses.lessonOne).toBe("1 lesson");
    expect(SOCIAL.courses.lessons).toBe("lessons");
    expect(SOCIAL.courses.progressComplete).toBe("complete");
    expect(SOCIAL.courses.error).toBe("Education could not be loaded.");
    expect(SOCIAL.courses.denied).toBe("This course is not available.");
    expect(SOCIAL.courses.denied).not.toMatch(/LOCKED|Buy|price/i);
    expect(JSON.stringify(SOCIAL.courses)).not.toMatch(/—/);
    expect(JSON.stringify(SOCIAL.courses)).not.toContain("Courses");
  });
});

describe("course lock", () => {
  it("does not add a member publish path, deep-link, or entitlements table", () => {
    const list = readFileSync("src/app/(app)/social/courses/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/social/courses/[slug]/page.tsx", "utf8");
    const consume = readFileSync("src/components/courses/course-consume.tsx", "utf8");
    const lib = readFileSync("src/lib/courses.ts", "utf8");
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    const forms = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const migration = readFileSync("supabase/migrations/20260912240000_courses.sql", "utf8");

    expect(list).toContain("loadDiscoverableCourses");
    expect(list).toContain("loadDiscoverableCourseMeta");
    expect(list).toContain("data-course-grid");
    expect(list).toContain("CourseCard");
    expect(detail).toContain("loadCourseDetail");
    expect(detail).toContain("loadCourseInstructorName");
    expect(detail).toContain("data-course-denied");
    expect(detail).toContain("data-course-instructor");
    expect(detail).toContain("CourseConsume");
    expect(detail).toContain("mt-[var(--space-12)]");
    expect(detail).not.toContain("/lessons/");
    expect(detail).not.toContain("Resume");
    expect(consume).toContain("data-course-player");
    expect(consume).toContain("data-course-playlist");
    expect(consume).toContain("lg:flex-row");
    expect(consume).toContain("lg:w-[20rem]");
    expect(consume).toContain("p-[var(--space-4)]");
    expect(consume).toContain("setSelectedId(lesson.id)");
    expect(consume).not.toContain("/lessons/");
    expect(consume).not.toContain("Resume");
    expect(consume).not.toContain("lesson_progress");
    expect(consume).not.toMatch(/shadow-/);
    expect(COURSE_COVER_ASPECT_CLASS).toBe("aspect-video");
    expect(lib).toContain("has_course_access");
    expect(lib).toContain("cover_key");
    expect(lib).not.toContain('rpc("has_entitlement"');
    expect(lib).not.toContain("MediaConvert");
    expect(lib).not.toContain("m3u8");
    expect(lib).not.toContain("CloudFront");
    expect(lib).toContain("loadDiscoverableCourseMeta");
    expect(lib).toContain("loadCourseInstructorName");
    expect(lib).not.toContain("lesson_progress");
    expect(lib).not.toContain("Resume");
    expect(readFileSync("src/components/courses/course-cover.tsx", "utf8")).not.toContain("charAt");
    expect(readFileSync("src/components/courses/course-cover.tsx", "utf8")).not.toMatch(/shadow-/);
    expect(readFileSync("src/components/courses/course-card.tsx", "utf8")).toContain(
      "data-course-card-meta",
    );
    expect(readFileSync("src/components/courses/course-card.tsx", "utf8")).toContain(
      "data-course-progress-track",
    );
    expect(readFileSync("src/components/overview/overview-home.tsx", "utf8")).toContain(
      'density="home"',
    );
    expect(readFileSync("src/components/overview/overview-home.tsx", "utf8")).toContain(
      "progressPercent",
    );
    expect(readFileSync("src/app/(app)/home/page.tsx", "utf8")).not.toContain("62");
    expect(lib).toContain("COURSE_GLANCE_PROGRESS_FILL_CLASS");
    expect(lib).toContain("bg-accent");
    expect(readFileSync("src/components/courses/course-lesson-player.tsx", "utf8")).toContain(
      "data-course-playback",
    );
    expect(actions).not.toContain("from(\"courses\")");
    expect(actions).not.toContain("createSocialCourse");
    expect(forms).not.toContain("Course");
    expect(list).not.toContain("courses/new");
    expect(detail).not.toContain("courses/new");
    expect(migration).toContain("ADAM LOCK");
    expect(migration).toContain("Authenticated INSERT / UPDATE / DELETE is denied");
    expect(migration).toContain("has_entitlement must not exist in this slice");
    expect(migration).not.toContain("media_asset_id uuid");
    expect(migration).not.toMatch(/create table if not exists public\.lesson_progress/);
    expect(() => readFileSync("src/app/(app)/social/courses/new/page.tsx")).toThrow();
    expect(() => readFileSync("src/app/(app)/education/page.tsx")).toThrow();
    expect(() =>
      readFileSync("src/app/(app)/social/courses/lessons/[id]/page.tsx"),
    ).toThrow();
  });
});
