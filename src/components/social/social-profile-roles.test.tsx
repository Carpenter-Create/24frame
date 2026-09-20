import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SOCIAL_TOPIC_CHIP_CLASS } from "@/lib/social-chrome";
import { SocialProfileRolesField } from "./social-profile-roles";

describe("SocialProfileRolesField", () => {
  it("renders Roles search, grouped bank, and selected house chips in order", () => {
    const html = renderToStaticMarkup(
      <SocialProfileRolesField value={["investor", "actor"]} onChange={() => undefined} />,
    );
    expect(html).toContain("data-social-profile-edit-roles");
    expect(html).toContain(SOCIAL.profile.roles);
    expect(html).toContain(SOCIAL.profile.rolesSearch);
    expect(html).toContain(SOCIAL.profile.rolesHint);
    expect(html).toContain('id="social-edit-roles-search"');
    expect(html).toContain("data-social-profile-edit-roles-selected");
    expect(html).toContain('data-social-profile-role-chip="investor"');
    expect(html).toContain('data-social-profile-role-chip="actor"');
    expect(html.indexOf('data-social-profile-role-chip="investor"')).toBeLessThan(
      html.indexOf('data-social-profile-role-chip="actor"'),
    );
    expect(html).toContain(SOCIAL_TOPIC_CHIP_CLASS);
    expect(html).toContain('data-social-profile-role-group="cast"');
    expect(html).toContain('data-social-profile-role-group="business_capital_rep"');
    expect(html).toContain('data-social-profile-role="actor"');
    expect(html).toContain('data-social-profile-role-selected=""');
    expect(html).toContain("Actor");
    expect(html).not.toContain("Actress");
    expect(html).not.toContain("Category");
    expect(html).toContain("break-words");
    expect(html).not.toContain("truncate");
  });

  it("omits the selected-chip row when none are chosen", () => {
    const html = renderToStaticMarkup(
      <SocialProfileRolesField value={[]} onChange={() => undefined} />,
    );
    expect(html).toContain(SOCIAL.profile.roles);
    expect(html).not.toContain("data-social-profile-edit-roles-selected");
  });
});
