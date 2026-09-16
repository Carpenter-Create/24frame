import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

import { EDUCATION_ADMIN } from "@/lib/education";

import { NewLessonModal } from "./education-forms";

describe("New lesson modal miss list A v1.1", () => {
  it("renders Passion-house fields without Sequence or a free-taste toggle", () => {
    const html = renderToStaticMarkup(
      <NewLessonModal
        open
        onClose={() => undefined}
        courseId="22222222-2222-4222-8222-222222222222"
        modules={[{ id: "m1", course_id: "c1", title: "Orientation", position: 1 }]}
      />,
    );
    expect(html).toContain("data-education-new-lesson");
    expect(html).toContain("data-education-cover-dropzone");
    expect(html).toContain('data-education-lesson-type="lesson"');
    expect(html).toContain(EDUCATION_ADMIN.lessonTypeLesson);
    expect(html).toContain("0/80");
    expect(html).toContain("0/200");
    expect(html).toContain(EDUCATION_ADMIN.duration);
    expect(html).toContain('name="durationMinutes"');
    expect(html).toContain(EDUCATION_ADMIN.modulePlacement);
    expect(html).toContain(EDUCATION_ADMIN.cancel);
    expect(html).toContain(EDUCATION_ADMIN.addLesson);
    expect(html).toContain("bg-accent");
    expect(html).not.toContain("Sequence");
    expect(html).not.toContain("freePreview");
    expect(html).not.toMatch(/free.?taste|Free preview/i);
    expect(html).not.toMatch(/#e91e63|#d500f9|#ff00ff|magenta/i);
    expect(html).not.toContain("1769FF");
  });
});
