import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  SOCIAL_CATEGORY_ALL,
  SOCIAL_CATEGORY_LABELS,
  SOCIAL_CATEGORY_TOPICS,
  socialCategorySlug,
  socialHomeLensHref,
  sortTopicsAlpha,
} from "@/lib/social-categories";
import {
  socialTopicRailChipClass,
  SOCIAL_TOPIC_RAIL_CHIP_CLASS,
  SOCIAL_TOPIC_RAIL_CHIP_SELECTED_CLASS,
  SOCIAL_TOPIC_RAIL_ROWS,
} from "@/lib/social-chrome";
import { HOUSE_PILL_SELECTED_CLASS } from "@/lib/house-shell";
import { SOCIAL } from "@/lib/social";
import { SocialHomeTopics } from "./social-home-topics";

const src = readFileSync("src/components/social/social-home-topics.tsx", "utf8");

function topicChips(html: string): string[] {
  return [...html.matchAll(/data-social-home-topic="([^"]+)"/g)].map((match) => match[1]);
}

function chipMarkup(html: string, label: string): string {
  const match = html.match(new RegExp(`<a[^>]*data-social-home-topic="${label}"[^>]*>`));
  return match?.[0] ?? "";
}

describe("SocialHomeTopics bank", () => {
  it("renders All first, then the shared A-Z Topics bank on the one-row rail", () => {
    const html = renderToStaticMarkup(<SocialHomeTopics />);
    const chips = topicChips(html);
    expect(chips[0]).toBe(SOCIAL_CATEGORY_ALL);
    expect(chips).toEqual([...SOCIAL_CATEGORY_LABELS]);
    expect(chips.slice(1)).toEqual([...SOCIAL_CATEGORY_TOPICS]);
    expect(chips.slice(1)).toEqual(sortTopicsAlpha(chips.slice(1)));
    expect(src).toContain("SOCIAL_CATEGORY_LABELS");
    expect(src).not.toContain("socialInterestTopics");
    expect(src).not.toContain("if (labels.length === 0) return null");
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

  it("defaults All selected and paints the active chip with the house selected pill", () => {
    const html = renderToStaticMarkup(<SocialHomeTopics />);
    const allChip = chipMarkup(html, SOCIAL_CATEGORY_ALL);
    const actingChip = chipMarkup(html, "Acting");
    expect(allChip).toContain('data-social-home-topic-active=""');
    expect(allChip).toContain('aria-current="page"');
    expect(allChip).toContain(SOCIAL_TOPIC_RAIL_CHIP_SELECTED_CLASS);
    expect(allChip).toContain(HOUSE_PILL_SELECTED_CLASS);
    expect(allChip).toContain('href="/social"');
    expect(actingChip).not.toContain("data-social-home-topic-active");
    expect(actingChip).not.toContain("aria-current");
    expect(actingChip).toContain(SOCIAL_TOPIC_RAIL_CHIP_CLASS);
    expect(actingChip).not.toContain(HOUSE_PILL_SELECTED_CLASS);
    expect(actingChip).toContain(`href="${socialHomeLensHref("Acting", SOCIAL_CATEGORY_ALL)}"`);
    expect(src).toContain("socialTopicRailChipClass");
    expect(src).toContain("socialHomeLensHref");
    expect(socialTopicRailChipClass(true)).toBe(SOCIAL_TOPIC_RAIL_CHIP_SELECTED_CLASS);
    expect(socialTopicRailChipClass(false)).toBe(SOCIAL_TOPIC_RAIL_CHIP_CLASS);
  });

  it("selects the URL topic and re-taps it back to All", () => {
    const html = renderToStaticMarkup(<SocialHomeTopics active="Music" />);
    const musicChip = chipMarkup(html, "Music");
    const allChip = chipMarkup(html, SOCIAL_CATEGORY_ALL);
    expect(musicChip).toContain('data-social-home-topic-active=""');
    expect(musicChip).toContain(HOUSE_PILL_SELECTED_CLASS);
    expect(musicChip).toContain('href="/social"');
    expect(allChip).not.toContain("data-social-home-topic-active");
    expect(allChip).not.toContain(HOUSE_PILL_SELECTED_CLASS);
    expect(allChip).toContain('href="/social"');
    expect(chipMarkup(html, "Acting")).toContain(
      `href="/social?topic=${socialCategorySlug("Acting")}"`,
    );
  });
});
