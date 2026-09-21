import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SOCIAL_PROFILE_EDIT_HELP_CLASS } from "@/lib/social-chrome";
import { SocialProfileImdbEditor } from "./social-profile-imdb";

describe("SocialProfileImdbEditor", () => {
  it("renders a single IMDb field, house hint, and back", () => {
    const html = renderToStaticMarkup(
      <SocialProfileImdbEditor
        value="nm0000158"
        onChange={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(html).toContain("data-social-profile-imdb");
    expect(html).toContain("data-social-profile-imdb-back");
    expect(html).toContain("data-social-profile-edit-imdb");
    expect(html).toContain(SOCIAL.profile.imdb);
    expect(html).toContain('id="social-edit-imdb"');
    expect(html).toContain('value="nm0000158"');
    expect(html).toContain(SOCIAL.profile.imdbHint);
    expect(html).toContain(SOCIAL_PROFILE_EDIT_HELP_CLASS);
    expect(html).toContain(`placeholder="${SOCIAL.profile.imdbPlaceholder}"`);
    expect(html).toContain('data-social-icon="caret-left"');
    expect(html).not.toContain("uppercase");
  });
});
