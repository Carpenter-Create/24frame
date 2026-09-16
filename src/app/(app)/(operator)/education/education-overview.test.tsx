import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EDUCATION_ADMIN } from "@/lib/education";
import type { CourseOutlineModule } from "@/lib/courses";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/education/orientation",
}));

vi.mock("./actions", () => ({
  reorderEducationLessons: vi.fn(),
  reorderEducationModules: vi.fn(),
  updateEducationCourse: vi.fn(),
  createEducationLesson: vi.fn(),
  createEducationModule: vi.fn(),
  refreshEducationLessonEncode: vi.fn(),
  startEducationLessonEncode: vi.fn(),
  updateEducationLesson: vi.fn(),
  uploadEducationCover: vi.fn(),
  uploadEducationLessonCover: vi.fn(),
  uploadEducationLessonSource: vi.fn(),
}));

import { EducationCourseOverview } from "./education-overview";

const modules: CourseOutlineModule[] = [
  {
    id: "m1",
    course_id: "c1",
    title: "Orientation",
    position: 1,
    lessons: [
      {
        id: "l1",
        module_id: "m1",
        title: "What this workspace is",
        position: 1,
        duration_seconds: 1320,
        free_preview: false,
        summary: "A short summary",
        cover_key: null,
        lesson_type: "lesson",
        education_video_id: "video-1",
        source_key: "courses/c1/lessons/l1/source.mp4",
        hls_key: null,
        encode_status: null,
        encode_error: null,
      },
    ],
  },
];

describe("EducationCourseOverview V1 workspace", () => {
  it("keeps videos in the main workspace, not a course-name rail", () => {
    const html = renderToStaticMarkup(
      <EducationCourseOverview
        course={{
          id: "c1",
          slug: "orientation",
          title: "Orientation",
          description: "Placeholder orientation",
          catalogCode: "EDU-0001",
          status: "published",
          isFlagshipFree: true,
          priceCents: null,
          instructorId: null,
        }}
        modules={modules}
        instructors={[]}
      />,
    );

    expect(html).toContain("data-education-overview");
    expect(html).toContain("data-education-workspace");
    expect(html).toContain("data-education-videos");
    expect(html).toContain("data-education-video-pane");
    expect(html).toContain("data-education-cover-card");
    expect(html).toContain("data-education-edit-settings");
    expect(html).toContain("EDU-0001");
    expect(html).toContain(EDUCATION_ADMIN.free);
    expect(html).toContain(EDUCATION_ADMIN.videos);
    expect(html).toContain("What this workspace is");
    expect(html).toContain(EDUCATION_ADMIN.encodePillSourceReady);
    expect(html).toContain("data-education-encode-pill");
    expect(html).toContain(EDUCATION_ADMIN.editLesson);
    expect(html).toContain(EDUCATION_ADMIN.uploadSource);
    expect(html).not.toContain("data-education-course-rail");
    expect(html).not.toContain("data-education-edit>");
    expect(html).not.toContain('name="instructorName"');
    expect(html).not.toContain("Sequence");
    expect(html).not.toMatch(/free.?taste/i);
  });
});
