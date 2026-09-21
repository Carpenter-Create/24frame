import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_TOPIC_CHIP_BANK_CLASS,
  SOCIAL_TOPIC_CHIP_SELECT_ON_CLASS,
} from "@/lib/social-chrome";
import { SocialProfileRolesEditor, SocialProfileRolesField } from "./social-profile-roles";

describe("SocialProfileRolesField", () => {
  it("renders Professions search, grouped pill bank, and selected house chips in order", () => {
    const html = renderToStaticMarkup(
      <SocialProfileRolesField value={["investor", "actor"]} onChange={() => undefined} />,
    );
    expect(html).toContain("data-social-profile-edit-roles");
    expect(html).toContain(SOCIAL.profile.roles);
    expect(html).toContain(SOCIAL.profile.rolesSearch);
    expect(html).toContain(SOCIAL.profile.rolesHint);
    expect(html).toContain("data-social-profile-edit-roles-count");
    expect(html).toContain("2 / 5");
    expect(html).toContain("draggable");
    expect(html).toContain('id="social-edit-roles-search"');
    expect(html).toContain("data-social-profile-edit-roles-selected");
    expect(html).toContain('data-social-profile-role-chip="investor"');
    expect(html).toContain('data-social-profile-role-chip="actor"');
    expect(html.indexOf('data-social-profile-role-chip="investor"')).toBeLessThan(
      html.indexOf('data-social-profile-role-chip="actor"'),
    );
    expect(html).toContain(SOCIAL_TOPIC_CHIP_SELECT_ON_CLASS);
    expect(html).toContain(SOCIAL_TOPIC_CHIP_BANK_CLASS);
    expect(html).toContain('data-social-profile-role-group="actor"');
    expect(html).toContain('data-social-profile-role-group="writer"');
    expect(html).toContain('data-social-profile-role-group="business"');
    expect(html).toContain('data-social-profile-role="actor"');
    expect(html).toContain('data-social-profile-role-selected=""');
    expect(html).toContain("Actor");
    expect(html).toContain("Actress");
    expect(html).toContain("Writer: Screenplay");
    expect(html).toContain("Writer: Story");
    expect(html).not.toContain("Category");
    expect(html).toContain("whitespace-nowrap");
    expect(html).toContain("t-body-sm");
    expect(html).not.toContain("text-[11px]");
    expect(html).not.toContain("truncate");
    expect(html).not.toContain("type=\"checkbox\"");
  });

  it("omits the selected-chip row when none are chosen", () => {
    const html = renderToStaticMarkup(
      <SocialProfileRolesField value={[]} onChange={() => undefined} />,
    );
    expect(html).toContain(SOCIAL.profile.roles);
    expect(html).toContain("0 / 5");
    expect(html).not.toContain("data-social-profile-edit-roles-selected");
    expect(html).not.toContain(SOCIAL.profile.rolesLimit);
    expect(html).not.toContain("type=\"checkbox\"");
  });

  it("shows the professions cap notice at 5 and keeps house chips", () => {
    const html = renderToStaticMarkup(
      <SocialProfileRolesField
        value={["actor", "producer", "director", "editor", "investor"]}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain(SOCIAL.profile.rolesLimit);
    expect(html).toContain("5 / 5");
    expect(html).toContain("You can select up to 5 professions");
    expect(html).not.toContain(SOCIAL.profile.rolesHint);
    expect(html).toContain('data-social-profile-role-chip="investor"');
    expect(html).toContain("disabled");
  });

  it("keeps the existing chip bank on the professions select face with a back affordance", () => {
    const html = renderToStaticMarkup(
      <SocialProfileRolesEditor
        value={["investor", "actor"]}
        onChange={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(html).toContain("data-social-profile-roles");
    expect(html).toContain("data-social-profile-roles-back");
    expect(html).toContain("data-social-profile-edit-roles");
    expect(html).toContain(SOCIAL.profile.rolesSearch);
    expect(html).toContain('id="social-edit-roles-search"');
    expect(html).toContain("data-social-profile-edit-roles-selected");
    expect(html).toContain('data-social-profile-role-group="writer"');
    expect(html).toContain('data-social-icon="caret-left"');
  });
});
