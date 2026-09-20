import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SOCIAL_CATEGORY_TOPICS, sortTopicsAlpha } from "@/lib/social-categories";
import { SOCIAL_TOPIC_RAIL_ROWS } from "@/lib/social-chrome";
import { SOCIAL } from "@/lib/social";
import { SocialHomeTopics } from "./social-home-topics";

const src = readFileSync("src/components/social/social-home-topics.tsx", "utf8");

describe("SocialHomeTopics bank", () => {
  it("renders the shared Topics bank in A-Z order on the one-row rail", () => {
    const html = renderToStaticMarkup(<SocialHomeTopics />);
    const chips = [...html.matchAll(/data-social-home-topic="([^"]+)"/g)].map((match) => match[1]);
    expect(chips).toEqual([...SOCIAL_CATEGORY_TOPICS]);
    expect(chips).toEqual(sortTopicsAlpha(chips));
    expect(src).toContain("SOCIAL_CATEGORY_TOPICS");
    expect(src).not.toContain("socialInterestTopics");
    expect(src).toContain("if (labels.length === 0) return null");
    expect(src).not.toContain("SOCIAL_FOR_YOU_CARD_CLASS");
    expect(src).not.toContain("flex-wrap");
    expect(src).not.toContain("No trending");
    expect(src).toContain("HouseChipRail");
    expect(src).toContain("rows={SOCIAL_TOPIC_RAIL_ROWS}");
    expect(src).not.toMatch(/Coinbase|Predict/i);
    expect(SOCIAL_TOPIC_RAIL_ROWS).toBe(1);
    expect(SOCIAL.forYou.topics).toBe("Topics");
    expect(SOCIAL_CATEGORY_TOPICS.length).toBeGreaterThan(0);
  });
});
