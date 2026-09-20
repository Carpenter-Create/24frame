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
}));

describe("SocialProfileEditForm", () => {
  it("renders First name, Last name, Username @ field, live URL, Bio row, and Add link", () => {
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
    expect(html).toContain(SOCIAL.profile.lastName);
    expect(html).toContain('id="social-edit-first-name"');
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
    expect(html).toContain(SOCIAL.profile.editPicture);
    expect(html).toContain('data-social-icon="camera"');
    expect(html).toContain('data-social-icon="caret-left"');
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Reels");
    expect(html).not.toContain("#1769ff");
    expect(html).toContain("t-control");
    expect(html).not.toMatch(/id="social-edit-first-name"[^>]*t-body-sm/);
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

  it("shows the empty-handle preview URL", () => {
    const html = renderToStaticMarkup(
      <SocialProfileEditForm handle="" displayName="" bio="" photoUrl={null} />,
    );
    expect(html).toContain("https://24frame.co/@");
    expect(html).toContain(`placeholder="${SOCIAL.profile.usernamePlaceholder}"`);
  });
});
