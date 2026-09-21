import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ src, className }: { src: string; className?: string }) =>
    createElement("img", { src, className, alt: "" }),
}));

import {
  SOCIAL_PROFILE_COVER_CLASS,
  SOCIAL_PROFILE_COVER_EMPTY_CLASS,
} from "@/lib/social-chrome";
import { SocialProfileBanner } from "./social-profile-banner";

describe("SocialProfileBanner", () => {
  it("renders the house wash when no cover is signed", () => {
    const html = renderToStaticMarkup(<SocialProfileBanner coverUrl={null} />);
    expect(html).toContain("data-social-profile-cover");
    expect(html).toContain("data-social-profile-cover-empty");
    expect(html).toContain(SOCIAL_PROFILE_COVER_CLASS);
    expect(html).toContain(SOCIAL_PROFILE_COVER_EMPTY_CLASS);
    expect(html).not.toContain("<img");
  });

  it("renders a signed cover and omits owner edit chrome by default", () => {
    const html = renderToStaticMarkup(
      <SocialProfileBanner coverUrl="https://cf.example/cover.jpg" />,
    );
    expect(html).toContain('src="https://cf.example/cover.jpg"');
    expect(html).not.toContain("data-social-profile-cover-empty");
    expect(html).not.toContain("data-social-profile-cover-edit");
  });

  it("shows owner edit chrome only when passed", () => {
    const html = renderToStaticMarkup(
      <SocialProfileBanner
        coverUrl={null}
        coverEdit={<button type="button" data-social-profile-cover-edit="">Edit</button>}
      />,
    );
    expect(html).toContain("data-social-profile-cover-edit");
  });
});
