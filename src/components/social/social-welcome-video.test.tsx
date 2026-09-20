import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL_WELCOME_VIDEO_CLASS } from "@/lib/social-chrome";
import { SocialWelcomeVideo } from "./social-welcome-video";

describe("SocialWelcomeVideo", () => {
  it("renders the player only when a signed URL exists", () => {
    const html = renderToStaticMarkup(<SocialWelcomeVideo src="https://s3.example/welcome.mp4" />);
    expect(html).toContain("data-social-welcome-video");
    expect(html).toContain("data-social-welcome-video-player");
    expect(html).toContain('src="https://s3.example/welcome.mp4"');
    expect(html).toContain(SOCIAL_WELCOME_VIDEO_CLASS);
    expect(SOCIAL_WELCOME_VIDEO_CLASS).toContain("rounded-[var(--radius-lg)]");
    expect(renderToStaticMarkup(<SocialWelcomeVideo src="" />)).toBe("");
  });
});
