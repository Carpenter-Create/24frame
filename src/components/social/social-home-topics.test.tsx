import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/social-role-affinity", () => ({
  socialInterestTopics: () => [],
}));

import { SOCIAL_CATEGORY_TOPICS } from "@/lib/social-categories";
import { SOCIAL } from "@/lib/social";
import { SocialHomeTopics } from "./social-home-topics";

const src = readFileSync("src/components/social/social-home-topics.tsx", "utf8");

describe("SocialHomeTopics empty bank", () => {
  it("omits the Topics. shell when the serving bank is empty", () => {
    expect(renderToStaticMarkup(<SocialHomeTopics />)).toBe("");
    expect(renderToStaticMarkup(<SocialHomeTopics topics={["Acting"]} crafts={["actor"]} />)).toBe(
      "",
    );
    expect(src).toContain("if (labels.length === 0) return null");
    expect(src).not.toContain("SOCIAL_FOR_YOU_CARD_CLASS");
    expect(src).not.toContain("flex-wrap");
    expect(src).not.toContain("No trending");
    expect(SOCIAL.forYou.topics).toBe("Topics.");
    expect(SOCIAL_CATEGORY_TOPICS.length).toBeGreaterThan(0);
  });
});
