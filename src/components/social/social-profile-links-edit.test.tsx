import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SocialProfileLinksEditor } from "./social-profile-links-edit";

describe("SocialProfileLinksEditor", () => {
  it("edits and removes URLs on the Links face, not the index", () => {
    const html = renderToStaticMarkup(
      <SocialProfileLinksEditor
        value={["https://instagram.com/ada", "https://youtube.com/@ada"]}
        onChange={() => undefined}
        onBack={() => undefined}
      />,
    );
    expect(html).toContain("data-social-profile-links");
    expect(html).toContain("data-social-profile-links-back");
    expect(html).toContain("data-social-profile-edit-links");
    expect(html).toContain(SOCIAL.profile.links);
    expect(html).toContain('value="https://instagram.com/ada"');
    expect(html).toContain('value="https://youtube.com/@ada"');
    expect(html).toContain("data-social-profile-edit-link-remove");
    expect(html).toContain(SOCIAL.profile.addLink);
    expect(html).toContain(SOCIAL.profile.removeLink);
    expect(html).toContain('data-social-icon="caret-left"');
    expect(html).not.toContain("t-label");
  });
});
