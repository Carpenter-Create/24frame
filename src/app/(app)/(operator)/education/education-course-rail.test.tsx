import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EDUCATION_ADMIN, EDUCATION_HREF } from "@/lib/education";
import type { EducationAdminCourseRow } from "@/lib/education-admin";
import { HOUSE_CARD_PAD, HOUSE_RAIL_ACTIVE_CLASS } from "@/lib/house-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/education/orientation",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("./actions", () => ({
  reorderEducationCourses: vi.fn(),
  createEducationCourse: vi.fn(),
  uploadEducationCover: vi.fn(),
}));

import { EducationCourseRail } from "./education-course-rail";

const courses: EducationAdminCourseRow[] = [
  {
    id: "c1",
    slug: "orientation",
    title: "Orientation",
    description: null,
    cover_key: null,
    is_flagship_free: true,
    price_cents: null,
    catalog_code: "EDU-0001",
    status: "published",
    position: 1,
    instructor_id: null,
    created_at: "2026-09-12T14:00:00.000Z",
    instructor_name: null,
  },
  {
    id: "c2",
    slug: "paid-fixture",
    title: "Paid fixture",
    description: null,
    cover_key: null,
    is_flagship_free: false,
    price_cents: 4900,
    catalog_code: "EDU-0002",
    status: "draft",
    position: 2,
    instructor_id: null,
    created_at: "2026-09-12T15:00:00.000Z",
    instructor_name: null,
  },
];

describe("EducationCourseRail copy lock", () => {
  it("lists course names and New course only — no Welcome, Home, or New & For You", () => {
    const html = renderToStaticMarkup(<EducationCourseRail courses={courses} instructors={[]} />);
    expect(html).toContain("data-education-course-rail");
    expect(html).toContain("data-education-create");
    expect(html).toContain(EDUCATION_ADMIN.newCourse);
    expect(html).toContain("Orientation");
    expect(html).toContain("Paid fixture");
    expect(html).toContain(`${EDUCATION_HREF}/orientation`);
    expect(html).toContain("data-education-course-name");
    expect(html).toContain("data-education-drag");
    expect(html).toContain(HOUSE_RAIL_ACTIVE_CLASS);
    expect(html).toContain(HOUSE_CARD_PAD);
    expect(html).not.toContain("Welcome");
    expect(html).not.toContain("New & For You");
    expect(html).not.toContain("Home");
    expect(html).not.toContain("data-education-home");
    expect(html).not.toContain("data-education-lesson-row");
    expect(html).not.toContain("data-education-encode-pill");
    expect(html).not.toContain("Sequence");

    const src = readFileSync("src/app/(app)/(operator)/education/education-course-rail.tsx", "utf8");
    expect(src).toContain("NewCourseButton");
    expect(src).not.toMatch(/Welcome|New & For You|\bHome\b/);
    expect(src).not.toContain("EDUCATION_ADMIN.title");
  });
});
