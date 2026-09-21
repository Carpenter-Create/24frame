import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  SOCIAL_PROFILE_COVER_HANG_DESKTOP_PX,
  SOCIAL_PROFILE_COVER_HANG_MOBILE_PX,
  SOCIAL_PROFILE_COVER_LOCK_A,
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
