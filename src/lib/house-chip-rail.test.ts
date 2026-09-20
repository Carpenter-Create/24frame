import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL_CATEGORY_TOPICS } from "@/lib/social-categories";
import {
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_PILL_CLASS,
  HOUSE_FILTER_PILL_CLUSTER_CLASS,
  HOUSE_RELATED_GAP_CLASS,
  HOUSE_SCROLL_ROW_CLASS,
} from "@/lib/house-shell";
import {
  HOUSE_CHIP_RAIL_CHIP_CLASS,
  HOUSE_CHIP_RAIL_CLASS,
  HOUSE_CHIP_RAIL_ROW_CLASS,
  HOUSE_CHIP_RAIL_ROWS,
  HOUSE_CHIP_RAIL_STACK_CLASS,
  splitChipRailRows,
} from "./house-chip-rail";

const src = readFileSync("src/lib/house-chip-rail.ts", "utf8");
const component = readFileSync("src/components/chrome/house-chip-rail.tsx", "utf8");

describe("splitChipRailRows", () => {
  it("interleaves so both lanes fill, and drops empty lanes", () => {
    expect(splitChipRailRows([])).toEqual([]);
    expect(splitChipRailRows(["Acting"])).toEqual([["Acting"]]);
    expect(splitChipRailRows(["Acting", "Animation"])).toEqual([["Acting"], ["Animation"]]);
    const [top, bottom] = splitChipRailRows(SOCIAL_CATEGORY_TOPICS);
    expect(HOUSE_CHIP_RAIL_ROWS).toBe(2);
    expect(top).toEqual([
      "Acting",
      "Animation",
      "Cinematography",
      "Content creator",
      "Distribution",
      "Financing",
      "Producers",
      "Vertical micro dramas",
    ]);
    expect(bottom).toEqual([
      "AI filmmaking",
      "Casting",
      "Music",
      "Directors",
      "Film Festivals",
      "Post-production",
      "Screenwriting",
    ]);
    expect([...(top ?? []), ...(bottom ?? [])]).toHaveLength(SOCIAL_CATEGORY_TOPICS.length);
  });
});

describe("house chip rail tokens", () => {
  it("aliases house scroll-row and filter pills — no local lookalike", () => {
    expect(HOUSE_CHIP_RAIL_CLASS).toBe(HOUSE_SCROLL_ROW_CLASS);
    expect(HOUSE_CHIP_RAIL_CLASS).toContain("overflow-x-auto");
    expect(HOUSE_CHIP_RAIL_STACK_CLASS).toContain("flex-col");
    expect(HOUSE_CHIP_RAIL_STACK_CLASS).toContain("w-max");
    expect(HOUSE_CHIP_RAIL_STACK_CLASS).toContain(HOUSE_RELATED_GAP_CLASS);
    expect(HOUSE_CHIP_RAIL_ROW_CLASS).toBe(HOUSE_FILTER_PILL_CLUSTER_CLASS);
    expect(HOUSE_CHIP_RAIL_CHIP_CLASS).toContain(HOUSE_FILTER_PILL_CLASS);
    expect(HOUSE_CHIP_RAIL_CHIP_CLASS).toContain(HOUSE_FILTER_OFF_CLASS);
    expect(HOUSE_CHIP_RAIL_CHIP_CLASS).toContain("whitespace-nowrap");
    expect(HOUSE_CHIP_RAIL_CHIP_CLASS).not.toContain("truncate");
    expect(HOUSE_CHIP_RAIL_CLASS).not.toContain("flex-wrap");
    expect(HOUSE_CHIP_RAIL_STACK_CLASS).not.toContain("flex-wrap");
    expect(HOUSE_CHIP_RAIL_ROW_CLASS).not.toContain("flex-wrap");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(`${src}\n${component}`).not.toMatch(/Coinbase|Predict/i);
    expect(component).toContain("splitChipRailRows");
    expect(component).toContain("HOUSE_CHIP_RAIL_CLASS");
    expect(component).toContain("data-house-chip-rail-row");
  });
});
