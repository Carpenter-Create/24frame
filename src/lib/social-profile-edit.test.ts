import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { avatarObjectKey } from "@/lib/account-avatar";
import {
  SOCIAL_FIGMA_PROFILE_BIO,
  SOCIAL_FIGMA_PROFILE_EDIT,
  SOCIAL_FIGMA_PROFILE_OWN,
  SOCIAL_PROFILE_BIO_TEXTAREA_CLASS,
  SOCIAL_PROFILE_EDIT_FIELD_CLASS,
  SOCIAL_PROFILE_EDIT_HANDLE_CLASS,
  SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS,
} from "@/lib/social-chrome";
import {
  BIO_MAX,
  SOCIAL,
  SOCIAL_ROUTES,
  normalizeBio,
  socialBioCount,
  socialBioEnterSubmits,
  socialProfilePublicUrl,
} from "@/lib/social";
import { SOCIAL_PROFILE_EDIT_LOCK, socialProfileEditFace } from "@/lib/social-profile-edit";

const edit = readFileSync("src/components/social/social-profile-edit.tsx", "utf8");
const bio = readFileSync("src/components/social/social-profile-bio.tsx", "utf8");
const profile = readFileSync("src/app/(app)/social/profile/page.tsx", "utf8");
const editPage = readFileSync("src/app/(app)/social/profile/edit/page.tsx", "utf8");
const bioPage = readFileSync("src/app/(app)/social/profile/edit/bio/page.tsx", "utf8");

describe("Social Profile Edit profile + Bio lock", () => {
  it("keeps the locked Figma frames and sole Edit profile entry", () => {
    expect(SOCIAL_FIGMA_PROFILE_EDIT).toEqual(["180:206", "180:1946", "181:2184"]);
    expect(SOCIAL_FIGMA_PROFILE_BIO).toEqual(["180:2004", "180:2026"]);
    expect(SOCIAL_FIGMA_PROFILE_OWN).toEqual(["181:230", "181:2000"]);
    expect(SOCIAL_PROFILE_EDIT_LOCK.entry).toBe("Edit profile");
    expect(SOCIAL_PROFILE_EDIT_LOCK.editHref).toBe("/social/profile/edit");
    expect(SOCIAL_PROFILE_EDIT_LOCK.bioHref).toBe("/social/profile/edit/bio");
    expect(profile).toContain("SOCIAL_ROUTES.profileEdit");
    expect(profile).toContain("SocialShareButton");
    expect(profile).not.toContain("#social-profile-edit");
    expect(profile).not.toContain("<details");
    expect(profile).not.toContain("<summary");
    expect(profile).not.toContain("Education");
    expect(edit).toContain("data-social-profile-edit");
    expect(edit).toContain(SOCIAL.profile.username);
    expect(edit).toContain("socialProfilePublicUrl");
    expect(edit).toContain("uploadAccountPhoto");
    expect(edit).toContain("data-social-profile-edit-links");
    expect(edit).toContain("SocialProfileBioEditor");
    expect(edit).toContain("data-social-profile-edit-bio-open");
    expect(edit).not.toContain("SOCIAL_ROUTES.profileBio");
    expect(edit.slice(edit.indexOf("data-social-profile-edit-links"))).not.toContain("<Link");
    expect(SOCIAL_PROFILE_EDIT_LOCK.keepsDraftOnBio).toBe(true);
    expect(socialProfileEditFace(true)).toBe("bio");
    expect(socialProfileEditFace(false)).toBe("edit");
    expect(edit).not.toContain("Instagram");
    expect(edit).not.toContain("Reels");
  });

  it("locks handle UX and the empty-handle error", () => {
    expect(SOCIAL.profile.handleRequired).toBe("Handle is required");
    expect(SOCIAL_PROFILE_EDIT_LOCK.handleRequired).toBe("Handle is required");
    expect(SOCIAL_PROFILE_EDIT_LOCK.emptyPreview).toBe("https://24frame.co/@");
    expect(socialProfilePublicUrl("")).toBe("https://24frame.co/@");
    expect(edit).toContain("data-social-handle-url");
    expect(edit).toContain("data-social-handle-required");
    expect(edit).toContain("socialHandleRequiredError");
    expect(edit).not.toContain("app.24frame.co");
  });

  it("locks Bio to 150 chars, house privacy copy, and Sporty Blue check Done", () => {
    expect(BIO_MAX).toBe(150);
    expect(SOCIAL.profile.bioPrivacy).toBe("Your bio shows on your public profile.");
    expect(bio).toContain("data-social-bio-done");
    expect(bio).toContain('name="check"');
    expect(bio).toContain("SOCIAL_PROFILE_BIO_DONE_CLASS");
    expect(bio).toContain("data-social-bio-privacy");
    expect(bio).toContain("maxLength={BIO_MAX}");
    expect(bio).toContain('type="button"');
    expect(bio).not.toContain("onKeyDown");
    expect(bio).not.toContain("preventDefault");
    expect(bio).toContain("normalizeBio(value)");
    expect(bio).not.toContain("<form");
    expect(socialBioEnterSubmits()).toBe(false);
    expect(normalizeBio("Founder\nInvestor")).toBe("Founder\nInvestor");
    expect(socialBioCount("Founder\nInvestor")).toBe(16);
  });

  it("reuses the app-wide avatar SoT and does not invent a links editor", () => {
    expect(avatarObjectKey("11111111-1111-4111-8111-111111111111")).toBe(
      "avatars/11111111-1111-4111-8111-111111111111/avatar",
    );
    expect(editPage).toContain("signedAvatarUrl");
    expect(editPage).not.toContain("putAvatarObject");
    expect(editPage).not.toContain("S3_AVATARS_BUCKET");
    expect(edit).toContain("uploadAccountPhoto");
    expect(edit).toContain("SOCIAL.profile.editPicture");
    expect(edit).toContain("SOCIAL.profile.addLink");
    expect(edit).not.toContain("SOCIAL_ROUTES.profileBio}/link");
    expect(bioPage).toContain("SocialProfileBioEditor");
    expect(SOCIAL_ROUTES.profileEdit).toBe("/social/profile/edit");
  });

  it("locks Edit/Bio Name, Username, and Bio fields at 16px so iOS Safari does not zoom", () => {
    const globals = readFileSync("src/app/globals.css", "utf8");
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(globals).toMatch(/\.t-body\s*\{[\s\S]*?font-size:\s*var\(--text-base\)/);
    expect(globals).toMatch(/\.t-body-sm\s*\{[\s\S]*?font-size:\s*var\(--text-sm\)/);
    expect(SOCIAL_PROFILE_EDIT_FIELD_CLASS).toContain("text-[16px]");
    expect(SOCIAL_PROFILE_EDIT_FIELD_CLASS).not.toContain("t-body-sm");
    expect(SOCIAL_PROFILE_EDIT_HANDLE_CLASS).toContain("text-[16px]");
    expect(SOCIAL_PROFILE_EDIT_HANDLE_CLASS).not.toContain("t-body-sm");
    expect(SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS).toContain("text-[16px]");
    expect(SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS).not.toContain("t-body-sm");
    expect(SOCIAL_PROFILE_BIO_TEXTAREA_CLASS).toContain("text-[16px]");
    expect(SOCIAL_PROFILE_BIO_TEXTAREA_CLASS).not.toContain("t-body-sm");
    expect(edit).toContain("SOCIAL_PROFILE_EDIT_FIELD_CLASS");
    expect(edit).toContain('id="social-edit-name"');
    expect(edit).toContain('id="social-edit-handle"');
    expect(bio).toContain("SOCIAL_PROFILE_BIO_TEXTAREA_CLASS");
    expect(bio).toContain("data-social-bio-textarea");
    expect(edit).not.toContain("maximum-scale");
    expect(bio).not.toContain("maximum-scale");
    expect(layout).not.toContain("maximum-scale");
  });
});
