import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CourseCard } from "./course-card";
import {
  COURSE_GLANCE_PLATE_CLASSES,
  courseGlancePlateClass,
  courseGlanceProgressLabel,
  type CourseRow,
} from "@/lib/courses";

const COURSE: CourseRow = {
  id: "c1",
  slug: "catalog-basics",
  title: "Catalog basics",
  description: null,
  cover_key: "cover.jpg",
  is_flagship_free: true,
  price_cents: null,
  catalog_code: "EDU-1",
  status: "published",
  position: 1,
  instructor_id: null,
  created_at: "2026-09-01T12:00:00.000Z",
};

describe("CourseCard home density", () => {
  it("keeps the title inside the cover plate and shows an honest progress track", () => {
    const html = renderToStaticMarkup(
      createElement(CourseCard, {
        course: COURSE,
        density: "home",
        coverUrl: "https://cover.example/photo.jpg",
        metaLabel: "3 lessons",
      }),
    );
    const coverAt = html.indexOf("data-course-cover=");
    const titleAt = html.indexOf("data-course-cover-title");
    const coverCloseAt = html.indexOf("</div>", coverAt);
    const progressAt = html.indexOf("data-course-progress-track");
    const belowTitleAt = html.indexOf("t-body font-medium text-ink");

    expect(html).toContain('data-course-card-density="home"');
    expect(html).toContain('data-course-cover-tone="plate"');
    expect(html).toContain("data-course-cover-orb");
    expect(html).toContain(courseGlancePlateClass(COURSE.id));
    expect(coverAt).toBeGreaterThan(-1);
    expect(titleAt).toBeGreaterThan(coverAt);
    expect(titleAt).toBeLessThan(coverCloseAt);
    expect(progressAt).toBeGreaterThan(coverCloseAt);
    expect(html).toContain(courseGlanceProgressLabel(0));
    expect(html).toContain("width:0%");
    expect(html).not.toContain("https://cover.example/photo.jpg");
    expect(html).not.toContain("3 lessons");
    expect(html).not.toContain("data-course-card-meta");
    expect(belowTitleAt).toBe(-1);
    expect(html).not.toContain("62%");
  });

  it("fills the Sporty Blue track from real progress only", () => {
    const html = renderToStaticMarkup(
      createElement(CourseCard, {
        course: COURSE,
        density: "home",
        progressPercent: 40,
      }),
    );
    expect(html).toContain(courseGlanceProgressLabel(40));
    expect(html).toContain("width:40%");
    expect(html).toContain("bg-accent");
    expect(html).not.toContain("62%");
  });
});

describe("CourseCard discover density", () => {
  it("keeps the title below the photo cover", () => {
    const html = renderToStaticMarkup(
      createElement(CourseCard, {
        course: COURSE,
        coverUrl: "https://cover.example/photo.jpg",
        metaLabel: "3 lessons",
      }),
    );
    const coverAt = html.indexOf("data-course-cover=");
    const coverCloseAt = html.indexOf("</div>", coverAt);
    const belowTitleAt = html.indexOf("t-body font-medium text-ink");

    expect(html).toContain('data-course-card-density="discover"');
    expect(html).toContain('data-course-cover-tone="photo"');
    expect(html).toContain("https://cover.example/photo.jpg");
    expect(html).toContain("data-course-card-meta");
    expect(html).toContain("3 lessons");
    expect(html).not.toContain("data-course-cover-title");
    expect(html).not.toContain("data-course-progress-track");
    expect(belowTitleAt).toBeGreaterThan(coverCloseAt);
    expect(COURSE_GLANCE_PLATE_CLASSES).toHaveLength(5);
  });
});
