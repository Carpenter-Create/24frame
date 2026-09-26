import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import type { CourseRow } from "@/lib/courses";
import { SOCIAL } from "@/lib/social";
import { SocialForYouRail } from "./social-for-you";

const COURSE: CourseRow = {
  id: "c1",
  slug: "catalog-basics",
  title: "Catalog basics",
  description: null,
  cover_key: "courses/c1/cover.png",
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

  it("does not preload a signed course cover inside the hidden rail", () => {
    const html = renderToStaticMarkup(
      <SocialForYouRail
        people={[]}
        faces={new Map()}
        latestCourse={COURSE}
        latestCourseCoverUrl="https://s3.example/courses/c1/cover.png"
      />,
    );
    expect(html).toContain('src="https://s3.example/courses/c1/cover.png"');
    expect(html).toContain('loading="lazy"');
    expect(html).not.toContain('rel="preload"');
    expect(html).toContain("data-social-latest-course");
  });
});
