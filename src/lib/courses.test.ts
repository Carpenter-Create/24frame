import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { PRODUCT_NAME } from "@/lib/product";
import { SOCIAL, SOCIAL_ROUTES, socialCourseHref } from "@/lib/social";
import {
  courseAccessGranted,
  courseHref,
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
};

const body: CourseLessonRow = {
  id: "l2",
  module_id: "m1",
  title: "What comes later",
  position: 2,
  duration_seconds: null,
  free_preview: false,
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
  });
});

describe("course routes and copy", () => {
  it("uses 24Frame Social+Education language and stays browse-only", () => {
    expect(SOCIAL_ROUTES.courses).toBe("/social/courses");
    expect(socialCourseHref("welcome-to-24frame")).toBe("/social/courses/welcome-to-24frame");
    expect(courseHref("social-education")).toBe("/social/courses/social-education");
    expect(SOCIAL.courses.subtitle).toContain(PRODUCT_NAME);
    expect(SOCIAL.courses.subtitle).toContain("Social+Education");
    expect(SOCIAL.courses.denied).toBe("This course is not available.");
    expect(SOCIAL.courses.denied).not.toMatch(/LOCKED|Buy|price/i);
    expect(JSON.stringify(SOCIAL.courses)).not.toMatch(/—/);
  });
});

describe("course lock", () => {
  it("does not add a member publish path, player, or entitlements table", () => {
    const list = readFileSync("src/app/(app)/social/courses/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/social/courses/[slug]/page.tsx", "utf8");
    const lib = readFileSync("src/lib/courses.ts", "utf8");
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    const forms = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const migration = readFileSync("supabase/migrations/20260912240000_courses.sql", "utf8");

    expect(list).toContain("loadDiscoverableCourses");
    expect(detail).toContain("loadCourseDetail");
    expect(detail).toContain("data-course-denied");
    expect(lib).toContain("has_course_access");
    expect(lib).not.toContain("has_entitlement");
    expect(lib).not.toContain("MediaConvert");
    expect(lib).not.toContain("m3u8");
    expect(lib).not.toContain("CloudFront");
    expect(actions).not.toContain("from(\"courses\")");
    expect(actions).not.toContain("createSocialCourse");
    expect(forms).not.toContain("Course");
    expect(list).not.toContain("courses/new");
    expect(detail).not.toContain("courses/new");
    expect(migration).toContain("ADAM LOCK");
    expect(migration).toContain("authenticated INSERT / UPDATE / DELETE is denied");
    expect(migration).not.toContain("has_entitlement");
    expect(migration).not.toContain("media_asset_id");
    expect(migration).not.toContain("lesson_progress");
    expect(() => readFileSync("src/app/(app)/social/courses/new/page.tsx")).toThrow();
  });
});
