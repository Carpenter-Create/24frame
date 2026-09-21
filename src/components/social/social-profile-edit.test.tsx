import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    className,
  }: {
    src: string;
    className?: string;
  }) => createElement("img", { src, className, alt: "" }),
}));

import { SETTINGS_DIALOG_LABEL_CLASS, SETTINGS_DRILL_ROW_CLASS } from "@/lib/settings";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_PROFILE_EDIT_LABEL_CLASS } from "@/lib/social-chrome";
import { socialProfileRolesRowSummary } from "@/lib/social-profile-roles";
import { SocialProfileEditForm } from "./social-profile-edit";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/app/(app)/account/actions", () => ({
  uploadAccountPhoto: vi.fn(),
}));
vi.mock("@/app/(app)/social/actions", () => ({
  createSocialProfile: vi.fn(),
  presignSocialMediaUpload: vi.fn(),
  saveSocialWelcomeVideo: vi.fn(),
  clearSocialWelcomeVideo: vi.fn(),
}));

describe("SocialProfileEditForm", () => {
  it("renders First, Middle, Last name, Username @ field, Bio row, and Add link", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm
        handle="ada"
        displayName="Ada Lovelace"
        bio={"Writes engines.\nSecond line."}
        photoUrl={null}
      />,
    );
    expect(html).toContain("data-social-profile-edit");
    expect(html).toContain(SOCIAL.profile.edit);
    expect(html).toContain(SOCIAL.profile.done);
    expect(html).toContain("data-social-profile-edit-names");
    expect(html).toContain(SOCIAL.profile.firstName);
    expect(html).toContain(SOCIAL.profile.middleName);
    expect(html).toContain(SOCIAL.profile.lastName);
    expect(html).toContain('id="social-edit-first-name"');
    expect(html).toContain('id="social-edit-middle-name"');
    expect(html).toContain(SOCIAL_PROFILE_EDIT_LABEL_CLASS);
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).toContain(SETTINGS_DIALOG_LABEL_CLASS);
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).toContain("whitespace-nowrap");
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).toContain("w-32");
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).not.toContain("t-label");
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).not.toContain("uppercase");
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).not.toContain("w-[88px]");
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).not.toContain("truncate");
    expect(html).not.toContain("type=\"checkbox\"");
    expect(html).toContain('id="social-edit-last-name"');
    expect(html).toContain("Ada");
    expect(html).toContain("Lovelace");
    expect(html).not.toContain('id="social-edit-name"');
    expect(html).toContain("flex-col");
    expect(html).toContain(SOCIAL.profile.username);
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain('value="ada"');
    expect(html).not.toContain("data-social-handle-url");
    expect(html).not.toContain("https://24frame.co/@ada");
    expect(html).not.toContain("https://24frame.co/@");
    expect(html).toContain("Writes engines.");
    expect(html).toContain("Second line.");
    expect(html).toContain("whitespace-pre-wrap");
    expect(html).toContain("data-social-profile-edit-bio-open");
    expect(html).not.toContain('href="/social/profile/edit/bio"');
    expect(html).toContain(SOCIAL.profile.links);
    expect(html).toContain(SOCIAL.profile.addLink);
    expect(html).toContain("data-social-profile-edit-links");
    expect(html).toContain('id="social-edit-link-0"');
    expect(html).toContain(SOCIAL.profile.linkPlaceholder);
    expect(html).toContain(SOCIAL.profile.editPicture);
    expect(html).toContain("data-social-profile-edit-avatar-drop");
    expect(html).toContain("data-social-profile-edit-welcome");
    expect(html).toContain(SOCIAL.profile.welcomeAdd);
    expect(html).not.toContain(SOCIAL.profile.welcomeRemove);
    expect(html).toContain("data-social-profile-edit-roles-open");
    expect(html).toContain("data-social-profile-edit-topics");
    expect(html).toContain(SOCIAL.profile.roles);
    expect(html).toContain(SOCIAL.profile.topics);
    expect(html).toContain(SOCIAL.profile.rolesAdd);
    expect(html).toContain(socialProfileRolesRowSummary([]));
    expect(html).toContain(SETTINGS_DRILL_ROW_CLASS);
    expect(html).toContain(SOCIAL.profile.topicsSearch);
    expect(html).not.toContain(SOCIAL.profile.rolesSearch);
    expect(html).not.toContain('id="social-edit-roles-search"');
    expect(html).not.toContain("data-social-profile-edit-roles-selected");
    expect(html).not.toContain("data-social-profile-edit-roles-count");
    expect(html).not.toContain(SOCIAL.profile.rolesHint);
    expect(html).not.toContain(SOCIAL.profile.rolesLimit);
    expect(html).toContain("data-social-profile-edit-imdb");
    expect(html).toContain(SOCIAL.profile.imdb);
    expect(html).toContain('id="social-edit-imdb"');
    expect(html).toContain("flex-col");
    expect(html).toContain("data-social-avatar");
    expect(html).toContain("AL");
    expect(html).not.toContain("<img");
    expect(html).toContain('data-social-icon="caret-left"');
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Reels");
    expect(html).not.toContain("#1769ff");
    expect(html).toContain("t-control");
    expect(html).not.toMatch(/id="social-edit-first-name"[^>]*t-body-sm/);
    expect(html).not.toMatch(/id="social-edit-middle-name"[^>]*t-body-sm/);
    expect(html).not.toMatch(/id="social-edit-last-name"[^>]*t-body-sm/);
    expect(html).not.toMatch(/id="social-edit-handle"[^>]*t-body-sm/);
    expect(html).not.toContain("/social/@");

    const cased = renderToStaticMarkup(
      <SocialProfileEditForm
        handle="AdamC"
        displayName="Ada Lovelace"
        bio=""
        photoUrl={null}
      />,
    );
    expect(cased).toContain('value="AdamC"');
    expect(cased).not.toContain("https://24frame.co/@AdamC");
    expect(cased).not.toContain("/social/@");
  });

  it("splits a three-part display name into First / Middle / Last", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm
        handle="adam"
        displayName="Adam James Carpenter"
        bio=""
        photoUrl="https://s3.example/adam-face"
      />,
    );
    expect(html).toContain('value="Adam"');
    expect(html).toContain('value="James"');
    expect(html).toContain('value="Carpenter"');
    expect(html).toContain('src="https://s3.example/adam-face"');
    expect(html).not.toContain("AC");
  });

  it("shows replace and remove when a welcome video URL exists, and omits the public empty band", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm
        handle="ada"
        displayName="Ada Lovelace"
        bio=""
        photoUrl={null}
        welcomeVideoUrl="https://s3.example/welcome.mp4"
      />,
    );
    expect(html).toContain("data-social-profile-edit-welcome");
    expect(html).toContain(SOCIAL.profile.welcomeReplace);
    expect(html).toContain(SOCIAL.profile.welcomeRemove);
    expect(html).toContain('src="https://s3.example/welcome.mp4"');
    expect(html).not.toContain("data-social-welcome-video");
  });

  it("shows one Professions drill-in row from persisted crafts and never a Category label", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm
        handle="ada"
        displayName="Ada Lovelace"
        bio=""
        photoUrl={null}
        crafts={["actor", "producer", "screenwriter"]}
      />,
    );
    expect(html).toContain("data-social-profile-edit-roles-open");
    expect(html).toContain(socialProfileRolesRowSummary(["actor", "producer", "screenwriter"]));
    expect(html).toContain("Actor +2");
    expect(html).toContain(SETTINGS_DRILL_ROW_CLASS);
    expect(html).not.toContain("data-social-profile-edit-roles-count");
    expect(html).not.toContain("3 / 5");
    expect(html).not.toContain("data-social-profile-edit-roles-selected");
    expect(html).not.toContain('data-social-profile-role-chip="actor"');
    expect(html).not.toContain('id="social-edit-roles-search"');
    expect(html).not.toContain(SOCIAL.profile.rolesSearch);
    expect(html).not.toContain(SOCIAL.profile.rolesHint);
    expect(html).not.toContain("Category");
    expect(html).not.toContain("Actress");
    expect(html).not.toContain("Writer: Screenplay");
  });

  it("loads persisted website_url links so they can be edited or removed", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm
        handle="ada"
        displayName="Ada Lovelace"
        bio=""
        photoUrl={null}
        websiteUrl={JSON.stringify(["https://instagram.com/ada", "https://youtube.com/@ada"])}
      />,
    );
    expect(html).toContain('value="https://instagram.com/ada"');
    expect(html).toContain('value="https://youtube.com/@ada"');
    expect(html).toContain("data-social-profile-edit-link-remove");
    expect(html).toContain(SOCIAL.profile.addLink);
  });

  it("keeps Username and omits a derived Profile URL on the Edit face", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm handle="" displayName="" bio="" photoUrl={null} />,
    );
    expect(html).toContain(`placeholder="${SOCIAL.profile.usernamePlaceholder}"`);
    expect(html).toContain(SOCIAL.profile.username);
    expect(html).not.toContain("https://24frame.co/@");
    expect(html).not.toContain("data-social-handle-url");
  });
});
