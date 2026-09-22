import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import { courseGlancePlateClass, type CourseRow } from "@/lib/courses";
import { SOCIAL } from "@/lib/social";
import { SocialForYouRail } from "./social-for-you";

const COURSE: CourseRow = {
  id: "c1",
  slug: "catalog-basics",
  title: "Catalog basics",
  description: null,
  cover_key: "covers/catalog-basics.jpg",
  is_flagship_free: true,
  price_cents: null,
  catalog_code: "EDU-1",
  status: "published",
  position: 1,
  instructor_id: null,
  created_at: "2026-09-01T12:00:00.000Z",
};

describe("SocialForYouRail person identity", () => {
  it("uses the house person row: handle over name, Member omitted, Follow kept", () => {
    const html = renderToStaticMarkup(
      <SocialForYouRail
        people={[
          { id: "u2", handle: "joshua", display_name: "Member" },
          { id: "u3", handle: "maya", display_name: "Maya Chen" },
        ]}
        faces={new Map()}
      />,
    );
    expect(html).toContain(SOCIAL.forYou.people);
    expect(html).toContain('data-social-for-you-person="u2"');
    expect(html).toContain("data-social-person-row");
    expect(html).toContain("@joshua");
    expect(html).not.toContain(">Member<");
    expect(html).toContain("@maya");
    expect(html).toContain("Maya Chen");
    expect(html.indexOf("@maya")).toBeLessThan(html.indexOf("Maya Chen"));
    expect(html).toContain("data-social-follow");
    expect(html).toContain(SOCIAL.follow.follow);
    expect(html).not.toContain("Member");
    expect(SOCIAL.member.title).toBe("Member");
  });

  it("shows the signed profile photo on Suggested people when a URL exists", () => {
    const html = renderToStaticMarkup(
      <SocialForYouRail
        people={[{ id: "u3", handle: "joshua", display_name: "Joshua A" }]}
        faces={new Map([["u3", "https://s3.example/joshua-face"]])}
      />,
    );
    expect(html).toContain("data-social-person-row");
    expect(html).toContain("https%3A%2F%2Fs3.example%2Fjoshua-face");
    expect(html).not.toContain("JA");
    expect(html).not.toContain("Actor");
  });

  it("paints the glance plate when the latest course has no signed cover", () => {
    const html = renderToStaticMarkup(
      <SocialForYouRail
        people={[]}
        faces={new Map()}
        latestCourse={COURSE}
        latestCourseCoverUrl={null}
      />,
    );
    const coverAt = html.indexOf("data-course-cover=");
    const coverCloseAt = html.indexOf("</div>", coverAt);
    const belowTitleAt = html.indexOf("t-body font-medium text-ink");

    expect(html).toContain('data-course-card-density="discover"');
    expect(html).toContain('data-course-cover-tone="plate"');
    expect(html).toContain("data-course-cover-orb");
    expect(html).toContain(courseGlancePlateClass(COURSE.id));
    expect(html).toContain(COURSE.title);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("data-course-cover-title");
    expect(html).not.toContain("data-course-progress-track");
    expect(belowTitleAt).toBeGreaterThan(coverCloseAt);
  });

  it("keeps the signed photo when a latest-course cover URL exists", () => {
    const html = renderToStaticMarkup(
      <SocialForYouRail
        people={[]}
        faces={new Map()}
        latestCourse={COURSE}
        latestCourseCoverUrl="https://cover.example/photo.jpg"
      />,
    );
    expect(html).toContain('data-course-card-density="discover"');
    expect(html).toContain('data-course-cover-tone="photo"');
    expect(html).toContain("https://cover.example/photo.jpg");
    expect(html).toContain("<img");
    expect(html).not.toContain("data-course-cover-orb");
    expect(html).not.toContain("data-course-progress-track");
  });
});
