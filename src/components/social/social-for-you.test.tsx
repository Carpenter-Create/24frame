import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));

import { SOCIAL } from "@/lib/social";
import { SocialForYouRail } from "./social-for-you";

describe("SocialForYouRail person identity", () => {
  it("uses the house person row: handle over name, Member omitted, Follow kept", () => {
    const html = renderToStaticMarkup(
      <SocialForYouRail
        people={[
          { id: "u2", handle: "joshua", display_name: "Member" },
          { id: "u3", handle: "maya", display_name: "Maya Chen" },
        ]}
        faces={new Map()}
        viewerId="u1"
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
        viewerId="u1"
      />,
    );
    expect(html).toContain("data-social-person-row");
    expect(html).toContain('src="https://s3.example/joshua-face"');
    expect(html).not.toContain("JA");
    expect(html).not.toContain("Actor");
  });
});
