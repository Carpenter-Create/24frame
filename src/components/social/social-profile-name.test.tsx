import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SETTINGS_DIALOG_LABEL_CLASS } from "@/lib/settings";
import { SOCIAL } from "@/lib/social";
import { SOCIAL_PROFILE_EDIT_LABEL_CLASS } from "@/lib/social-chrome";
import { SocialProfileNameEditor } from "./social-profile-name";

describe("SocialProfileNameEditor", () => {
  it("renders First / Middle / Last on the Name face with house Done", () => {
    const html = renderToStaticMarkup(
      <SocialProfileNameEditor
        firstName="Ada"
        middleName=""
        lastName="Lovelace"
        onSave={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(html).toContain("data-social-profile-name");
    expect(html).toContain(SOCIAL.profile.name);
    expect(html).toContain("data-social-profile-edit-names");
    expect(html).toContain(SOCIAL.profile.firstName);
    expect(html).toContain(SOCIAL.profile.middleName);
    expect(html).toContain(SOCIAL.profile.lastName);
    expect(html).toContain('id="social-edit-first-name"');
    expect(html).toContain('id="social-edit-middle-name"');
    expect(html).toContain('id="social-edit-last-name"');
    expect(html).toContain('value="Ada"');
    expect(html).toContain('value="Lovelace"');
    expect(html).not.toContain('id="social-edit-name"');
    expect(html).toContain("data-social-profile-name-done");
    expect(html).toContain(SOCIAL.profile.done);
    expect(html).toContain(SOCIAL_PROFILE_EDIT_LABEL_CLASS);
    expect(SOCIAL_PROFILE_EDIT_LABEL_CLASS).toContain(SETTINGS_DIALOG_LABEL_CLASS);
    expect(html).toContain("flex-col");
    expect(html).toContain("t-control");
    expect(html).not.toMatch(/id="social-edit-first-name"[^>]*t-body-sm/);
    expect(html).not.toContain("truncate");
  });

  it("splits a three-part name into First / Middle / Last on the face", () => {
    const html = renderToStaticMarkup(
      <SocialProfileNameEditor
        firstName="Adam"
        middleName="James"
        lastName="Carpenter"
        onSave={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(html).toContain('value="Adam"');
    expect(html).toContain('value="James"');
    expect(html).toContain('value="Carpenter"');
  });
});
