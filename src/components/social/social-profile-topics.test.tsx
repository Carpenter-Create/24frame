import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL } from "@/lib/social";
import { SOCIAL_CATEGORY_TOPICS } from "@/lib/social-categories";
import {
  SOCIAL_TOPIC_CHIP_BANK_CLASS,
  SOCIAL_TOPIC_CHIP_SELECT_IDLE_CLASS,
  SOCIAL_TOPIC_CHIP_SELECT_ON_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_PROFILE_TOPICS_MAX } from "@/lib/social-profile-topics";
import { SocialProfileTopicsField } from "./social-profile-topics";

describe("SocialProfileTopicsField", () => {
  it("renders Topics search and selected house chips, never Professions slugs or checkboxes", () => {
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
    expect(html).toContain(SOCIAL_TOPIC_CHIP_BANK_CLASS);
    expect(html).toContain(SOCIAL_TOPIC_CHIP_SELECT_ON_CLASS);
    expect(html).toContain(SOCIAL_TOPIC_CHIP_SELECT_IDLE_CLASS);
    expect(html).toContain("break-words");
    expect(html).not.toContain("truncate");
    expect(html).not.toContain("type=\"checkbox\"");
    expect(html).not.toContain("Professions");
    expect(html).not.toContain("Actor");
    expect(html).not.toContain(SOCIAL.profile.roles);
  });

  it("omits selected chips when empty", () => {
    const html = renderToStaticMarkup(
      <SocialProfileTopicsField value={[]} onChange={() => undefined} />,
    );
    expect(html).toContain(SOCIAL.profile.topics);
    expect(html).toContain(SOCIAL.profile.topicsHint);
    expect(html).not.toContain("data-social-profile-edit-topics-selected");
    expect(html).not.toContain(SOCIAL.profile.topicsLimit);
    expect(html).not.toContain("type=\"checkbox\"");
  });

  it("blocks a ninth Topics pick with the locked notice and keeps extras already saved", () => {
    const atCap = SOCIAL_CATEGORY_TOPICS.slice(0, SOCIAL_PROFILE_TOPICS_MAX);
    const over = SOCIAL_CATEGORY_TOPICS.slice(0, SOCIAL_PROFILE_TOPICS_MAX + 1);
    const capped = renderToStaticMarkup(
      <SocialProfileTopicsField value={atCap} onChange={() => undefined} />,
    );
    expect(capped).toContain(SOCIAL.profile.topicsLimit);
    expect(capped).toContain("You can select up to 8 topics");
    expect(capped).not.toContain(SOCIAL.profile.topicsHint);
    expect(capped).toContain("disabled");
    expect(capped).toContain('data-social-profile-topic-chip="Acting"');

    const kept = renderToStaticMarkup(
      <SocialProfileTopicsField value={over} onChange={() => undefined} />,
    );
    expect(kept).toContain(`data-social-profile-topic-chip="${over[8]}"`);
    expect(kept).toContain(SOCIAL.profile.topicsLimit);
  });
});
