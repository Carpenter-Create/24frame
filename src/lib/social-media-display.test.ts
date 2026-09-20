import { describe, expect, it } from "vitest";

import {
  isAnimatedRasterSrc,
  isSessionGatedSocialSrc,
  socialAvatarImageSizes,
  socialVideoDisplaySrc,
} from "./social-media-display";

describe("social media display", () => {
  it("treats GIF paths as animated even with a signed query", () => {
    expect(isAnimatedRasterSrc("https://cf.example/posts/u/x.gif?X-Amz-Signature=a")).toBe(true);
    expect(isAnimatedRasterSrc("https://cf.example/posts/u/x.jpg?X-Amz-Signature=a")).toBe(false);
    expect(isAnimatedRasterSrc("/local.gif")).toBe(true);
  });

  it("adds a first-frame fragment without rewriting an existing hash or empty src", () => {
    expect(socialVideoDisplaySrc("https://cf.example/welcome.mp4?sig=1")).toBe(
      "https://cf.example/welcome.mp4?sig=1#t=0.1",
    );
    expect(socialVideoDisplaySrc("https://cf.example/welcome.mp4#t=2")).toBe(
      "https://cf.example/welcome.mp4#t=2",
    );
    expect(socialVideoDisplaySrc("")).toBe("");
  });

  it("sizes profile faces for the 72/88 disk", () => {
    expect(socialAvatarImageSizes("profile")).toBe("(max-width: 768px) 72px, 88px");
    expect(socialAvatarImageSizes("sm")).toBe("36px");
  });

  it("treats same-origin Social signer routes as session-gated", () => {
    expect(isSessionGatedSocialSrc("/api/social/avatar/11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isSessionGatedSocialSrc("/api/social/media?key=posts/u/x.jpg")).toBe(true);
    expect(isSessionGatedSocialSrc("/api/social/media?key=posts/u/x.mp4#t=0.1")).toBe(true);
    expect(isSessionGatedSocialSrc("https://cf.example/posts/u/x.jpg")).toBe(false);
    expect(isSessionGatedSocialSrc("/api/account/photo")).toBe(false);
  });
});
