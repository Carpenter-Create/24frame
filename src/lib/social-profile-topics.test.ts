import { describe, expect, it } from "vitest";

import { SOCIAL_CATEGORY_TOPICS, sortTopicsAlpha } from "@/lib/social-categories";
import {
  SOCIAL_PROFILE_TOPICS,
  SOCIAL_PROFILE_TOPICS_MAX,
  filterSocialProfileTopics,
  parseSocialProfileTopics,
  socialProfileTopicsAtMax,
  socialProfileTopicsWrite,
  toggleSocialProfileTopic,
} from "./social-profile-topics";

describe("social profile topics", () => {
  it("is the locked Topics bank, not the Professions bank", () => {
    expect(SOCIAL_PROFILE_TOPICS).toEqual([...SOCIAL_CATEGORY_TOPICS]);
    expect([...SOCIAL_PROFILE_TOPICS]).toEqual(sortTopicsAlpha(SOCIAL_PROFILE_TOPICS));
    expect(SOCIAL_PROFILE_TOPICS).toContain("Acting");
    expect(SOCIAL_PROFILE_TOPICS).toContain("Cinematography");
    expect(SOCIAL_PROFILE_TOPICS).toContain("Financing");
    expect(SOCIAL_PROFILE_TOPICS).not.toContain("Actor");
    expect(SOCIAL_PROFILE_TOPICS).not.toContain("Investor");
    expect(SOCIAL_PROFILE_TOPICS).not.toContain("Attorney");
  });

  it("parses locked labels and slugs, and ignores profession slugs", () => {
    expect(parseSocialProfileTopics(["Acting", "Financing", "Acting", "nope"])).toEqual([
      "Acting",
      "Financing",
    ]);
    expect(parseSocialProfileTopics(["cinematography", "actor"])).toEqual(["Cinematography"]);
    expect(parseSocialProfileTopics('["Screenwriting","legal"]')).toEqual(["Screenwriting"]);
    expect(parseSocialProfileTopics("")).toEqual([]);
    expect(socialProfileTopicsWrite(["Music", "Producers"])).toEqual(["Music", "Producers"]);
  });

  it("toggles and filters without touching Professions labels", () => {
    expect(toggleSocialProfileTopic(["Acting"], "Financing")).toEqual(["Acting", "Financing"]);
    expect(toggleSocialProfileTopic(["Acting", "Financing"], "Acting")).toEqual(["Financing"]);
    expect(toggleSocialProfileTopic(["Acting"], "Actor")).toEqual(["Acting"]);
    expect(filterSocialProfileTopics("cine")).toEqual(["Cinematography"]);
    expect(filterSocialProfileTopics("")).toEqual([...SOCIAL_CATEGORY_TOPICS]);
    expect(filterSocialProfileTopics("")).toEqual(sortTopicsAlpha(SOCIAL_PROFILE_TOPICS));
  });

  it("caps a new Topics pick at 8 and keeps extras already saved", () => {
    const atCap = SOCIAL_CATEGORY_TOPICS.slice(0, SOCIAL_PROFILE_TOPICS_MAX);
    const over = SOCIAL_CATEGORY_TOPICS.slice(0, SOCIAL_PROFILE_TOPICS_MAX + 1);
    expect(SOCIAL_PROFILE_TOPICS_MAX).toBe(8);
    expect(socialProfileTopicsAtMax(atCap)).toBe(true);
    expect(socialProfileTopicsAtMax(atCap.slice(0, 7))).toBe(false);
    expect(parseSocialProfileTopics(over)).toEqual([...over]);
    expect(socialProfileTopicsWrite(over)).toEqual([...over]);
    expect(toggleSocialProfileTopic(atCap, over[8]!)).toEqual([...atCap]);
    expect(toggleSocialProfileTopic(over, over[0]!)).toEqual(over.slice(1));
  });
});
