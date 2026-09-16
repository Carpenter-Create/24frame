import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EDUCATION_ADMIN, EDUCATION_ENCODE_LABELS } from "@/lib/education";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("./actions", () => ({
  createEducationCourse: vi.fn(),
  createEducationLesson: vi.fn(),
  createEducationModule: vi.fn(),
  refreshEducationLessonEncode: vi.fn(),
  startEducationLessonEncode: vi.fn(),
  updateEducationCourse: vi.fn(),
  updateEducationLesson: vi.fn(),
  uploadEducationCover: vi.fn(),
  uploadEducationLessonCover: vi.fn(),
  uploadEducationLessonSource: vi.fn(),
}));

import { LessonAdminForm, NewLessonModal } from "./education-forms";

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

describe("LessonAdminForm encode status", () => {
  it("shows submit_failed with the encode error and keeps Start encode enabled", () => {
    const html = renderToStaticMarkup(
      createElement(LessonAdminForm, {
        courseId: "11111111-1111-4111-8111-111111111111",
        lessonId: "22222222-2222-4222-8222-222222222222",
        title: "CoS smoke",
        summary: "",
        durationSeconds: null,
        encodeLabel: EDUCATION_ENCODE_LABELS.submit_failed,
        encodeError: "/outputGroups/0/outputs/0: nameModifier is a required property",
        canStartEncode: true,
      }),
    );

    expect(html).toContain(EDUCATION_ENCODE_LABELS.submit_failed);
    expect(html).toContain("nameModifier is a required property");
    expect(html).toContain("data-education-encode-error");
    expect(html).not.toContain(EDUCATION_ADMIN.encodeNone);
    expect(html).toContain(EDUCATION_ADMIN.startEncode);
  });

  it("does not claim there is no source when source is present and status is empty", () => {
    const html = renderToStaticMarkup(
      createElement(LessonAdminForm, {
        courseId: "11111111-1111-4111-8111-111111111111",
        lessonId: "22222222-2222-4222-8222-222222222222",
        title: "CoS smoke",
        summary: "",
        durationSeconds: null,
        encodeLabel: EDUCATION_ADMIN.encodeSourceReady,
        encodeError: null,
        canStartEncode: true,
      }),
    );

    expect(html).toContain(EDUCATION_ADMIN.encodeSourceReady);
    expect(html).not.toContain(EDUCATION_ADMIN.encodeNone);
  });

  it("gates Start encode on canStartEncode, not source presence alone", () => {
    const src = readFileSync("src/app/(app)/(operator)/education/education-forms.tsx", "utf8");
    expect(src).toContain("disabled={saving || !canStartEncode}");
    expect(src).toContain("data-education-encode-error");
    expect(src).not.toContain("disabled={saving || !hasSource}");
  });
});
