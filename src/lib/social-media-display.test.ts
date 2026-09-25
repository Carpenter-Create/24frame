import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  isAnimatedRasterSrc,
  isLocalMediaPreviewSrc,
  isRejectedSocialVideoSrc,
  isSessionGatedSocialSrc,
  socialAvatarImageSizes,
  socialMediaFrameClass,
  socialStoryMediaFrameClass,
  socialMediaOrientation,
  socialVideoDisplaySrc,
} from "./social-media-display";

describe("social media display", () => {
  it("treats GIF paths as animated even with a signed query", () => {
    expect(isAnimatedRasterSrc("https://cf.example/posts/u/x.gif?X-Amz-Signature=a")).toBe(true);
    expect(isAnimatedRasterSrc("https://cf.example/posts/u/x.jpg?X-Amz-Signature=a")).toBe(false);
    expect(isAnimatedRasterSrc("/local.gif")).toBe(true);
  });

  it("refuses proxy, fragment, and raw object URLs as a Social video src", () => {
    expect(isRejectedSocialVideoSrc("/api/social/media?key=stories%2Forg%2Fclip.mp4")).toBe(true);
    expect(isRejectedSocialVideoSrc("/api/social/media?key=stories%2Forg%2Fclip.mp4#t=0.1")).toBe(true);
    expect(isRejectedSocialVideoSrc("https://cf.example/welcome.mp4?sig=1")).toBe(true);
    expect(isRejectedSocialVideoSrc("https://cf.example/welcome.mp4#t=2")).toBe(true);
    expect(isRejectedSocialVideoSrc("")).toBe(true);
    expect(socialVideoDisplaySrc("https://cf.example/welcome.mp4?sig=1")).toBe("");
    expect(socialVideoDisplaySrc("/api/social/media?key=clip.mp4#t=0.1")).toBe("");
    expect(socialVideoDisplaySrc("")).toBe("");
    expect(isRejectedSocialVideoSrc("https://stream.mux.com/uNbxnGLKJ00yfbijDO8COxT.m3u8")).toBe(false);
    expect(isLocalMediaPreviewSrc("blob:https://local/1")).toBe(true);
    expect(isLocalMediaPreviewSrc("https://s3.example/welcome.mp4")).toBe(false);
  });

  it("sizes profile faces for the 80px disk", () => {
    expect(socialAvatarImageSizes("profile")).toBe("80px");
    expect(socialAvatarImageSizes("sm")).toBe("36px");
  });

  it("treats same-origin Social signer routes as session-gated", () => {
    expect(isSessionGatedSocialSrc("/api/social/avatar/11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isSessionGatedSocialSrc("/api/social/media?key=posts/u/x.jpg")).toBe(true);
    expect(isSessionGatedSocialSrc("/api/social/media?key=posts/u/x.mp4#t=0.1")).toBe(true);
    expect(isSessionGatedSocialSrc("https://cf.example/posts/u/x.jpg")).toBe(false);
    expect(isSessionGatedSocialSrc("/api/account/photo")).toBe(false);
  });

  it("frames portrait 4:5 and landscape 16:9 from orientation, ratio, or kind default", () => {
    expect(socialMediaOrientation("portrait")).toBe("portrait");
    expect(socialMediaOrientation("landscape")).toBe("landscape");
    expect(socialMediaOrientation({ orientation: "portrait" })).toBe("portrait");
    expect(socialMediaOrientation({ width: 1080, height: 1350 })).toBe("portrait");
    expect(socialMediaOrientation({ width: 1920, height: 1080 })).toBe("landscape");
    expect(socialMediaOrientation({ aspect: 0.8 })).toBe("portrait");
    expect(socialMediaOrientation({ aspect: 16 / 9 })).toBe("landscape");
    expect(socialMediaOrientation({ kind: "image" })).toBe("portrait");
    expect(socialMediaOrientation({ kind: "video" })).toBe("landscape");
    expect(socialMediaFrameClass("portrait")).toBe("aspect-[4/5] w-full object-cover");
    expect(socialMediaFrameClass("landscape")).toBe("aspect-video w-full object-cover");
    expect(socialMediaFrameClass({ kind: "image" })).toContain("aspect-[4/5]");
    expect(socialMediaFrameClass({ kind: "video" })).toContain("aspect-video");
    expect(socialMediaFrameClass({ kind: "video" })).not.toContain("aspect-square");
    expect(socialMediaFrameClass({ kind: "image" })).not.toContain("aspect-square");
    expect(socialStoryMediaFrameClass()).toBe("aspect-[9/16] w-full object-cover");
    expect(socialStoryMediaFrameClass()).not.toContain("aspect-video");
    expect(socialStoryMediaFrameClass()).not.toContain("aspect-[4/5]");
  });

  it("keeps published Social video off the media proxy and native video element", () => {
    const files = [
      "src/components/social/social-feed-video.tsx",
      "src/components/social/social-story-viewer.tsx",
      "src/components/social/social-story-rail-cover.tsx",
      "src/components/social/social-welcome-video.tsx",
      "src/app/(app)/social/explore/page.tsx",
    ];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      expect(src).not.toContain("socialVideoDisplaySrc");
      expect(src).not.toContain("<video");
      expect(src).not.toContain("#t=0.1");
    }
    const player = readFileSync("src/components/social/social-mux-player.tsx", "utf8");
    expect(player).toContain("onLoadedData={paint}");
    expect(player).not.toContain("if (ready) onPaint?.()");
  });
});
