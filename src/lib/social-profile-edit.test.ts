import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import { avatarObjectKey } from "@/lib/account-avatar";
import { FORM_CONTROL_TEXT_CLASS } from "@/lib/form-control";
import {
  SOCIAL_FIGMA_PROFILE_BIO,
  SOCIAL_FIGMA_PROFILE_EDIT,
  SOCIAL_FIGMA_PROFILE_OWN,
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
import {
  SOCIAL_PROFILE_EDIT_LOCK,
  applySocialProfileOptimistic,
  checkSocialProfileEditSave,
  clearSocialProfileOptimistic,
  mergeSocialProfileIdentity,
  readSocialProfileOptimistic,
  socialProfileEditFace,
  socialProfileEditFormData,
  socialProfileEditSeed,
  socialProfileOptimisticFail,
  socialProfileOptimisticMatches,
  socialProfileSaveFieldError,
} from "@/lib/social-profile-edit";

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
    expect(edit).toContain("checkSocialProfileEditSave");
    expect(edit).toContain("handleInvalid");
    const saveSoT = readFileSync("src/lib/social-profile-edit.ts", "utf8");
    expect(saveSoT).toContain("socialHandleRequiredError");
    expect(saveSoT).toContain("normalizeHandle");
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
    expect(bio.indexOf("onSaved(next)")).toBeLessThan(bio.indexOf("updateSocialBio(form)"));
    expect(bio).not.toContain("<form");
    expect(socialBioEnterSubmits()).toBe(false);
    expect(normalizeBio("Founder\nInvestor")).toBe("Founder\nInvestor");
    expect(socialBioCount("Founder\nInvestor")).toBe(16);
  });

  it("reuses the app-wide avatar SoT and edits links in place", () => {
    expect(avatarObjectKey("11111111-1111-4111-8111-111111111111")).toBe(
      "avatars/11111111-1111-4111-8111-111111111111/avatar",
    );
    expect(editPage).toContain("signedAvatarUrl");
    expect(editPage).not.toContain("putAvatarObject");
    expect(editPage).not.toContain("S3_AVATARS_BUCKET");
    expect(edit).toContain("uploadAccountPhoto");
    expect(edit).toContain("SOCIAL.profile.editPicture");
    expect(edit).toContain("SOCIAL.profile.addLink");
    expect(edit).toContain("parseSocialWebsiteUrlField");
    expect(edit).toContain("checkSocialProfileEditSave");
    expect(edit).toContain("router.push(SOCIAL_ROUTES.profile)");
    expect(edit).not.toContain("router.refresh()");
    expect(edit.indexOf("router.push(SOCIAL_ROUTES.profile)")).toBeLessThan(
      edit.indexOf("createSocialProfile(checked.form)"),
    );
    expect(readFileSync("src/lib/social-profile-edit.ts", "utf8")).toContain('form.set("links"');
    expect(edit).not.toContain("SOCIAL_ROUTES.profileBio}/link");
    expect(bioPage).toContain("SocialProfileBioEditor");
    expect(SOCIAL_ROUTES.profileEdit).toBe("/social/profile/edit");
  });

  it("puts Edit/Bio Name, Username, and Bio on the shared form-control primitive", () => {
    const globals = readFileSync("src/app/globals.css", "utf8");
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(globals).toMatch(/\.t-control\s*\{[\s\S]*?font-size:\s*16px/);
    expect(globals).toMatch(/\.t-body\s*\{[\s\S]*?font-size:\s*var\(--text-base\)/);
    expect(globals).toMatch(/\.t-body-sm\s*\{[\s\S]*?font-size:\s*var\(--text-sm\)/);
    expect(FORM_CONTROL_TEXT_CLASS).toBe("t-control");
    expect(SOCIAL_PROFILE_EDIT_HANDLE_CLASS).toContain(FORM_CONTROL_TEXT_CLASS);
    expect(SOCIAL_PROFILE_EDIT_HANDLE_CLASS).not.toContain("t-body-sm");
    expect(SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS).toContain(FORM_CONTROL_TEXT_CLASS);
    expect(SOCIAL_PROFILE_EDIT_HANDLE_ERROR_CLASS).not.toContain("t-body-sm");
    expect(edit).toContain("<Input");
    expect(edit).toContain('variant="bare"');
    expect(edit).toContain('id="social-edit-first-name"');
    expect(edit).toContain('id="social-edit-middle-name"');
    expect(edit).toContain('id="social-edit-last-name"');
    expect(edit).not.toContain('id="social-edit-name"');
    expect(edit).toContain('id="social-edit-handle"');
    expect(edit).toContain("SocialProfileRolesField");
    expect(edit).toContain("SocialProfileTopicsField");
    expect(edit).toContain("checkSocialProfileEditSave");
    expect(edit).toContain('id="social-edit-imdb"');
    const saveSoT = readFileSync("src/lib/social-profile-edit.ts", "utf8");
    expect(saveSoT).toContain('form.set("crafts"');
    expect(saveSoT).toContain('form.set("topics"');
    expect(saveSoT).toContain('form.set("imdb_url"');
    expect(edit).toContain("AccountAvatarCrop");
    expect(edit).toContain("accountAvatarPickError");
    expect(edit).toContain("data-social-profile-edit-avatar-drop");
    expect(edit).toContain("SOCIAL_PROFILE_EDIT_AVATAR_DROPPING_CLASS");
    expect(edit).toContain("data-dropping");
    expect(bio).toContain("<Textarea");
    expect(bio).toContain("data-social-bio-textarea");
    expect(edit).not.toContain("maximum-scale");
    expect(bio).not.toContain("maximum-scale");
    expect(layout).not.toContain("maximum-scale");
    expect(readFileSync("src/app/(app)/social/profile/loading.tsx", "utf8")).toContain(
      "SocialProfileOptimisticShell",
    );
  });
});

describe("Social profile optimistic Save SoT", () => {
  afterEach(() => {
    clearSocialProfileOptimistic();
  });

  const draft = {
    username: "@ada",
    firstName: "Ada",
    middleName: "",
    lastName: "Lovelace",
    bio: "Writes engines.",
    crafts: ["director"],
    topics: ["Directors"],
    imdbUrl: "nm1234567",
    links: ["https://example.com"],
    photoUrl: "blob:photo",
    welcomeVideoUrl: null,
  };

  const server = {
    handle: "ada",
    displayName: "Ada Lovelace",
    bio: "Writes engines.",
    photoUrl: "https://s3.example/old",
    welcomeVideoUrl: null,
    crafts: ["director"],
    topics: ["Directors"],
    imdbUrl: "https://www.imdb.com/name/nm1234567/",
    websiteUrl: "https://example.com/",
  };

  it("applies the draft immediately and classifies handle vs form errors", () => {
    const checked = checkSocialProfileEditSave(draft);
    expect(checked.ok).toBe(true);
    if (!checked.ok) return;
    expect(checked.snapshot.handle).toBe("ada");
    expect(checked.snapshot.displayName).toBe("Ada Lovelace");
    expect(checked.form.get("handle")).toBe("@ada");
    expect(checked.form.get("crafts")).toBe(JSON.stringify(["director"]));
    expect(checked.form.get("topics")).toBe(JSON.stringify(["Directors"]));
    expect(socialProfileEditFormData(draft).get("imdb_url")).toBe("nm1234567");
    expect(SOCIAL_PROFILE_EDIT_LOCK.optimisticSave).toBe(true);

    applySocialProfileOptimistic(checked.snapshot);
    expect(readSocialProfileOptimistic()?.displayName).toBe("Ada Lovelace");
    const merged = mergeSocialProfileIdentity(
      { ...server, displayName: "Old Name", photoUrl: "https://s3.example/old" },
      checked.snapshot,
    );
    expect(merged.displayName).toBe("Ada Lovelace");
    expect(merged.photoUrl).toBe("blob:photo");

    expect(socialProfileSaveFieldError(SOCIAL.profile.handleTaken)).toBe("handle");
    expect(socialProfileSaveFieldError(SOCIAL.profile.imdbInvalid)).toBe("form");
    const failed = socialProfileOptimisticFail(checked.snapshot, SOCIAL.profile.handleTaken);
    expect(failed.handleError).toBe(SOCIAL.profile.handleTaken);
    expect(failed.error).toBe("");
    applySocialProfileOptimistic(failed);
    const seeded = socialProfileEditSeed({ ...server, displayName: "Old Name" });
    expect(seeded.displayName).toBe("Ada Lovelace");
    expect(seeded.handleError).toBe(SOCIAL.profile.handleTaken);
    expect(
      mergeSocialProfileIdentity({ ...server, displayName: "Old Name" }, failed).displayName,
    ).toBe("Old Name");
    expect(socialProfileOptimisticMatches(server, { ...checked.snapshot, photoUrl: server.photoUrl })).toBe(
      true,
    );
    expect(socialProfileOptimisticMatches(server, checked.snapshot)).toBe(false);
    clearSocialProfileOptimistic();
    expect(readSocialProfileOptimistic()).toBeNull();
  });

  it("rejects empty handle and invalid IMDb before persist", () => {
    expect(checkSocialProfileEditSave({ ...draft, username: "@" }).ok).toBe(false);
    expect(checkSocialProfileEditSave({ ...draft, username: "@" })).toEqual({
      ok: false,
      handleError: SOCIAL.profile.handleRequired,
    });
    expect(checkSocialProfileEditSave({ ...draft, imdbUrl: "not-imdb" })).toEqual({
      ok: false,
      error: SOCIAL.profile.imdbInvalid,
    });
    const missingName = checkSocialProfileEditSave({ ...draft, firstName: "" });
    expect(missingName.ok).toBe(false);
    if (missingName.ok) return;
    expect(missingName.error).toBe(SOCIAL.profile.firstNameRequired);
  });
});
