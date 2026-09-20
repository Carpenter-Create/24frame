import { describe, expect, it } from "vitest";

import { SOCIAL_CATEGORY_TOPICS } from "@/lib/social-categories";
import {
  SOCIAL_PROFILE_TOPICS,
  filterSocialProfileTopics,
  parseSocialProfileTopics,
  socialProfileTopicsWrite,
  toggleSocialProfileTopic,
} from "./social-profile-topics";

describe("social profile topics", () => {
  it("is the locked Topics bank, not the Professions bank", () => {
    expect(SOCIAL_PROFILE_TOPICS).toEqual([...SOCIAL_CATEGORY_TOPICS]);
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
    expect(filterSocialProfileTopics("")).toHaveLength(SOCIAL_CATEGORY_TOPICS.length);
  });
});
