import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  SOCIAL_PROFILE_COVER_HANG_DESKTOP_PX,
  SOCIAL_PROFILE_COVER_HANG_MOBILE_PX,
  SOCIAL_PROFILE_COVER_LOCK_A,
  socialProfileCoverPhoto,
  socialProfileRendersCoverBand,
} from "@/lib/social-profile-cover";

describe("SOCIAL_PROFILE_COVER_LOCK_A", () => {
  it("locks column width, banner heights, master still, and avatar hang", () => {
    expect(SOCIAL_PROFILE_COVER_LOCK_A.columnWidth).toBe(892);
    expect(SOCIAL_PROFILE_COVER_LOCK_A.heightMobile).toBe(112);
    expect(SOCIAL_PROFILE_COVER_LOCK_A.heightDesktop).toBe(224);
    expect(SOCIAL_PROFILE_COVER_LOCK_A.masterWidth).toBe(1784);
    expect(SOCIAL_PROFILE_COVER_LOCK_A.masterHeight).toBe(446);
    expect(SOCIAL_PROFILE_COVER_LOCK_A.coverFitWidth).toBe(1584);
    expect(SOCIAL_PROFILE_COVER_LOCK_A.coverFitHeight).toBe(396);
    expect(SOCIAL_PROFILE_COVER_HANG_MOBILE_PX).toBe(29);
    expect(SOCIAL_PROFILE_COVER_HANG_DESKTOP_PX).toBe(35);
  });

  it("keeps chrome tokens aligned with the numeric lock", () => {
    const chrome = readFileSync("src/lib/social-chrome.ts", "utf8");
    expect(chrome).toContain("h-[112px]");
    expect(chrome).toContain("md:h-[224px]");
    expect(chrome).toContain("bg-accent-wash");
    expect(chrome).toContain("-mt-[29px]");
    expect(chrome).toContain("md:-mt-[35px]");
    expect(chrome).toContain("SOCIAL_PROFILE_COVER_EDIT_CLASS");
  });

  it("omits the visitor band unless a real cover photo exists", () => {
    expect(socialProfileCoverPhoto(null)).toBeNull();
    expect(socialProfileCoverPhoto(undefined)).toBeNull();
    expect(socialProfileCoverPhoto("")).toBeNull();
    expect(socialProfileCoverPhoto("   ")).toBeNull();
    expect(socialProfileCoverPhoto("  https://cf.example/cover.jpg  ")).toBe(
      "https://cf.example/cover.jpg",
    );
    expect(socialProfileRendersCoverBand({ coverUrl: null, owner: false })).toBe(false);
    expect(socialProfileRendersCoverBand({ coverUrl: "   ", owner: false })).toBe(false);
    expect(
      socialProfileRendersCoverBand({
        coverUrl: "https://cf.example/cover.jpg",
        owner: false,
      }),
    ).toBe(true);
    expect(socialProfileRendersCoverBand({ coverUrl: null, owner: true })).toBe(true);
    expect(
      socialProfileRendersCoverBand({
        coverUrl: "https://cf.example/cover.jpg",
        owner: true,
      }),
    ).toBe(true);

    const banner = readFileSync("src/components/social/social-profile-banner.tsx", "utf8");
    const visitor = banner.slice(
      banner.indexOf("export function SocialProfileBanner"),
      banner.indexOf("export function SocialProfileCoverBlock"),
    );
    expect(visitor).toContain("if (!photo) return null");
    expect(visitor).not.toContain("SOCIAL_PROFILE_COVER_EMPTY_CLASS");
    expect(visitor).not.toContain("data-social-profile-cover-empty");
    const owner = banner.slice(banner.indexOf("export function SocialProfileCoverBlock"));
    expect(owner).toContain("SOCIAL_PROFILE_COVER_EMPTY_CLASS");
    expect(owner).toContain("data-social-profile-cover-empty");
  });

  it("labels master as LinkedIn header SoT", () => {
    const src = readFileSync("src/lib/social-profile-cover.ts", "utf8");
    expect(src).toContain("LinkedIn header SoT");
    expect(src).toContain("1784");
    expect(src).toContain("446");
  });

  it("keeps master dims in crop math and out of the profile UI", () => {
    const social = readFileSync("src/lib/social.ts", "utf8");
    expect(social).not.toContain("coverDims");
    expect(social).not.toContain("1784");
    expect(social).not.toContain("446 px");
    const upload = readFileSync("src/components/social/social-profile-cover-upload.tsx", "utf8");
    expect(upload).not.toContain("data-social-profile-cover-dims");
    expect(upload).not.toContain("masterWidth");
    expect(upload).not.toContain("masterHeight");
    expect(upload).toContain("COVER_CROP_OUTPUT_WIDTH");
    expect(upload).toContain("COVER_CROP_OUTPUT_HEIGHT");
    expect(upload).toContain("SOCIAL_PROFILE_COVER_PILL_ANCHOR_CLASS");
    expect(upload).not.toContain("bottom-3 right-3");
  });

  it("routes cover saves through the posts stills lane", () => {
    const media = readFileSync("src/lib/social-media.ts", "utf8");
    expect(media).toContain("profileCoverKeyFromMedia");
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    expect(actions).toContain("saveSocialProfileCover");
    expect(actions).toContain("cover_key");
    const upload = readFileSync("src/components/social/social-profile-cover-upload.tsx", "utf8");
    expect(upload).toContain("presignSocialMediaUpload");
    expect(upload).toContain('body.set("lane", "posts")');
    expect(upload).not.toContain("Mux");
  });
});
