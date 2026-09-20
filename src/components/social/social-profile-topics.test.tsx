import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SocialProfileTopicsField } from "./social-profile-topics";

describe("SocialProfileTopicsField", () => {
  it("renders Topics search and selected chips, never Professions slugs", () => {
    const html = renderToStaticMarkup(
      <SocialProfileTopicsField value={["Acting", "Financing"]} onChange={() => undefined} />,
    );
    expect(html).toContain("data-social-profile-edit-topics");
    expect(html).toContain(SOCIAL.profile.topics);
    expect(SOCIAL.profile.topics).toBe("Topics");
    expect(html).toContain(SOCIAL.profile.topicsSearch);
    expect(html).toContain(SOCIAL.profile.topicsHint);
    expect(html).toContain('id="social-edit-topics-search"');
    expect(html).toContain('aria-label="Search topics"');
    expect(html).toContain("data-social-profile-edit-topics-selected");
    expect(html).toContain('data-social-profile-topic-chip="Acting"');
    expect(html).toContain("Acting");
    expect(html).toContain("Financing");
    expect(html).not.toContain("Professions");
    expect(html).not.toContain("Actor");
    expect(html).not.toContain(SOCIAL.profile.roles);
  });

  it("omits selected chips when empty", () => {
    const html = renderToStaticMarkup(
      <SocialProfileTopicsField value={[]} onChange={() => undefined} />,
    );
    expect(html).toContain(SOCIAL.profile.topics);
    expect(html).not.toContain("data-social-profile-edit-topics-selected");
  });
});
