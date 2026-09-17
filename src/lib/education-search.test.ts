import { describe, expect, it } from "vitest";

import {
  EDUCATION_SEARCH,
  educationSearchAction,
  educationSearchHaystack,
  educationSearchMatches,
  filterCoursesForEducationSearch,
  filterEducationOutline,
  parseEducationSearchQuery,
} from "@/lib/education-search";
import type { CourseOutlineModule } from "@/lib/courses";

describe("Education quiet search", () => {
  it("keeps course/video copy in lib and routes staff vs consume", () => {
    expect(EDUCATION_SEARCH.label).toBe("Search courses and videos");
    expect(EDUCATION_SEARCH.placeholder).toBe("Search courses and videos");
    expect(educationSearchAction("/education")).toBe("/education");
    expect(educationSearchAction("/education/orientation")).toBe("/education");
    expect(educationSearchAction("/social/courses")).toBe("/social/courses");
    expect(educationSearchAction("/social/courses/orientation")).toBe(
      "/social/courses/orientation",
    );
    expect(parseEducationSearchQuery("  cut  ")).toBe("cut");
    expect(parseEducationSearchQuery(null)).toBe("");
  });

  it("matches courses by title or lesson and filters a playlist", () => {
    const courses = [
      { id: "c1", title: "Orientation", description: "Start here", catalog_code: "EDU-0001" },
      { id: "c2", title: "Delivery", description: "Later", catalog_code: "EDU-0002" },
    ];
    const lessons = new Map<string, string[]>([["c2", ["Cut the master"]]]);
    expect(filterCoursesForEducationSearch(courses, "orient").map((row) => row.id)).toEqual(["c1"]);
    expect(filterCoursesForEducationSearch(courses, "master", lessons).map((row) => row.id)).toEqual([
      "c2",
    ]);
    expect(educationSearchMatches(educationSearchHaystack("Cut the master"), "cut")).toBe(true);

    const outline: CourseOutlineModule[] = [
      {
        id: "m1",
        course_id: "c1",
        title: "Open",
        position: 1,
        lessons: [
          {
            id: "l1",
            module_id: "m1",
            title: "Welcome",
            position: 1,
            duration_seconds: 60,
            free_preview: true,
            summary: null,
            cover_key: null,
            lesson_type: "lesson",
            education_video_id: null,
            source_key: null,
            hls_key: null,
            encode_status: null,
          },
          {
            id: "l2",
            module_id: "m1",
            title: "Cut the master",
            position: 2,
            duration_seconds: 90,
            free_preview: false,
            summary: null,
            cover_key: null,
            lesson_type: "lesson",
            education_video_id: null,
            source_key: null,
            hls_key: null,
            encode_status: null,
          },
        ],
      },
    ];
    const filtered = filterEducationOutline(outline, "cut");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.lessons.map((lesson) => lesson.id)).toEqual(["l2"]);
  });
});
