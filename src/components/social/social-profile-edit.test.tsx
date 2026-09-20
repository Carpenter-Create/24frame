import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SOCIAL, socialProfilePublicUrl } from "@/lib/social";
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
  it("renders First, Middle, Last name, Username @ field, live URL, Bio row, and Add link", () => {
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
    expect(html).toContain('id="social-edit-last-name"');
    expect(html).toContain("Ada");
    expect(html).toContain("Lovelace");
    expect(html).not.toContain('id="social-edit-name"');
    expect(html).toContain("flex-col");
    expect(html).toContain(SOCIAL.profile.username);
    expect(html).toContain("data-social-handle-field");
    expect(html).toContain('value="ada"');
    expect(html).toContain("data-social-handle-url");
    expect(html).toContain(socialProfilePublicUrl("ada"));
    expect(html).toContain("https://24frame.co/@ada");
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
    expect(html).toContain("data-social-profile-edit-roles");
    expect(html).toContain(SOCIAL.profile.roles);
    expect(html).toContain(SOCIAL.profile.rolesSearch);
    expect(html).toContain('id="social-edit-roles-search"');
    expect(html).not.toContain("data-social-profile-edit-roles-selected");
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
    expect(cased).toContain("https://24frame.co/@AdamC");
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

  it("shows selected Roles chips from persisted crafts and never a Category label", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm
        handle="ada"
        displayName="Ada Lovelace"
        bio=""
        photoUrl={null}
        crafts={["actor", "producer", "screenwriter"]}
      />,
    );
    expect(html).toContain("data-social-profile-edit-roles-selected");
    expect(html).toContain('data-social-profile-role-chip="actor"');
    expect(html).toContain('data-social-profile-role-chip="producer"');
    expect(html).toContain('data-social-profile-role-chip="screenwriter"');
    expect(html.indexOf('data-social-profile-role-chip="actor"')).toBeLessThan(
      html.indexOf('data-social-profile-role-chip="producer"'),
    );
    expect(html).not.toContain("Category");
    expect(html).not.toContain("Actress");
  });

  it("shows the empty-handle preview URL", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm handle="" displayName="" bio="" photoUrl={null} />,
    );
    expect(html).toContain("https://24frame.co/@");
    expect(html).toContain(`placeholder="${SOCIAL.profile.usernamePlaceholder}"`);
  });
});
