import { describe, expect, it } from "vitest";

import { SOCIAL_CATEGORY_TOPICS } from "@/lib/social-categories";
import {
  ROLE_INTEREST_AFFINITY,
  rankSocialSuggestedPeople,
  socialCourseAffinityScore,
  socialPostAffinityScore,
  socialRoleAffinityTopics,
  socialRolePersonScore,
} from "./social-role-affinity";
import { SOCIAL_PROFILE_ROLES } from "./social-profile-roles";

describe("ROLE_INTEREST_AFFINITY", () => {
  it("covers every role slug and keeps Art Director / Investor on design and capital topics", () => {
    expect(Object.keys(ROLE_INTEREST_AFFINITY)).toHaveLength(SOCIAL_PROFILE_ROLES.length);
    expect(ROLE_INTEREST_AFFINITY.art_director.topics).toEqual(["Animation", "Post-production"]);
    expect(ROLE_INTEREST_AFFINITY.art_director.neighbors).toContain("production_designer");
    expect(ROLE_INTEREST_AFFINITY.investor.topics[0]).toBe("Financing");
    expect(ROLE_INTEREST_AFFINITY.investor.neighbors).toContain("financier");
    expect(ROLE_INTEREST_AFFINITY.actor.topics).toContain("Acting");
  });

  it("reorders Topics. by affinity and falls back to the locked default", () => {
    expect(socialRoleAffinityTopics([])).toEqual([...SOCIAL_CATEGORY_TOPICS]);
    const topics = socialRoleAffinityTopics(["art_director"]);
    expect(topics[0]).toBe("Animation");
    expect(topics[1]).toBe("Post-production");
    expect(topics).toEqual([...new Set(topics)]);
    expect(topics).toHaveLength(SOCIAL_CATEGORY_TOPICS.length);
  });

  it("scores shared roles above neighbors and ranks suggested people without dropping anyone", () => {
    expect(socialRolePersonScore(["art_director"], ["art_director"])).toBeGreaterThan(
      socialRolePersonScore(["art_director"], ["production_designer"]),
    );
    expect(socialRolePersonScore(["art_director"], ["investor"])).toBe(0);
    const ranked = rankSocialSuggestedPeople(
      [
        { handle: "zoe", crafts: ["investor"] },
        { handle: "ada", crafts: ["art_director"] },
        { handle: "maya", crafts: ["production_designer"] },
      ],
      ["art_director"],
    );
    expect(ranked.map((row) => row.handle)).toEqual(["ada", "maya", "zoe"]);
    expect(rankSocialSuggestedPeople([{ handle: "zoe" }, { handle: "ada" }], []).map((row) => row.handle)).toEqual([
      "zoe",
      "ada",
    ]);
  });

  it("soft-boosts matching courses and post topics without inventing a match", () => {
    const design = {
      id: "c1",
      slug: "design-desk",
      title: "Production design desk",
      description: "For the art director track",
      cover_key: null,
      is_flagship_free: true,
      price_cents: null,
      catalog_code: "EDU-9",
      status: "published" as const,
      position: 1,
      instructor_id: null,
      created_at: "2026-09-01T12:00:00.000Z",
    };
    const other = { ...design, id: "c2", title: "Rights desk", description: null, slug: "rights" };
    expect(socialCourseAffinityScore(design, ["art_director"])).toBeGreaterThan(
      socialCourseAffinityScore(other, ["art_director"]),
    );
    expect(socialCourseAffinityScore(other, [])).toBe(0);
    expect(socialPostAffinityScore("Animation", ["art_director"])).toBe(1);
    expect(socialPostAffinityScore("Financing", ["art_director"])).toBe(0);
  });
});
