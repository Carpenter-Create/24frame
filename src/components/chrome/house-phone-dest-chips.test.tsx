import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/social/explore" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children?: React.ReactNode;
    prefetch?: boolean;
  }) {
    return React.createElement("a", { href, ...props }, children);
  }
  return { __esModule: true, default: MockLink };
});

import { HousePhoneDestChips } from "./house-phone-dest-chips";
import {
  HOUSE_PHONE_DEST_ITEM_OFF_CLASS,
  HOUSE_PHONE_DEST_ITEM_ON_CLASS,
  HOUSE_PHONE_DESTS_CLASS,
  housePhoneDestItemClass,
  housePhoneDestPersistKey,
} from "@/lib/house-phone-shell";
import {
  HOUSE_PILL_SELECTED_CLASS,
  HOUSE_SEGMENTED_ITEM_OFF_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_THUMB_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";
import { SEGMENTED_TRACK_PERSIST } from "@/lib/segmented-track";
import { SOCIAL_ROUTES } from "@/lib/social";
import {
  WORKSPACE_SWITCHER_SEGMENTS_CLASS,
  WORKSPACE_SWITCHER_SEGMENTS_THUMB_CLASS,
} from "@/lib/workspace-switcher";

const src = readFileSync("src/components/chrome/house-phone-dest-chips.tsx", "utf8");
const tokens = readFileSync("src/lib/house-phone-shell.ts", "utf8");

describe("HousePhoneDestChips SegmentedTrack SoT", () => {
  it("consumes one house SegmentedTrack with workspace track / thumb / ink", () => {
    expect(src).toContain("SegmentedTrack");
    expect(src).toContain("data-segmented-item");
    expect(src).toContain("({ selectedIndex })");
    expect(src).toContain("segmentedItemOn");
    expect(src).toContain("persistKey={housePhoneDestPersistKey(workspace)}");
    expect(src).toContain("trackClass={HOUSE_SEGMENTED_TRACK_CLASS}");
    expect(src).toContain("thumbClass={HOUSE_SEGMENTED_THUMB_CLASS}");
    expect(src).toContain("housePhoneDestItemClass(selected)");
    expect(src).not.toContain("pendingIndex");
    expect(src).not.toContain("housePhoneDestItemClass(active)");
    expect(SEGMENTED_TRACK_PERSIST.phoneDest).toBe("phone-dest");
    expect(housePhoneDestPersistKey("social")).toBe("phone-dest-social");
    expect(HOUSE_SEGMENTED_TRACK_CLASS).toBe(WORKSPACE_SWITCHER_SEGMENTS_CLASS);
    expect(HOUSE_SEGMENTED_THUMB_CLASS).toBe(WORKSPACE_SWITCHER_SEGMENTS_THUMB_CLASS);
    expect(HOUSE_PHONE_DEST_ITEM_ON_CLASS).toBe(HOUSE_SEGMENTED_ITEM_ON_CLASS);
    expect(HOUSE_PHONE_DEST_ITEM_OFF_CLASS).toBe(HOUSE_SEGMENTED_ITEM_OFF_CLASS);
    expect(HOUSE_PHONE_DEST_ITEM_ON_CLASS).not.toContain("bg-accent");
    expect(HOUSE_PHONE_DESTS_CLASS).toContain("overflow-x-auto");
    expect(HOUSE_PHONE_DESTS_CLASS).not.toMatch(/gap-/);
    expect(tokens).not.toContain("HOUSE_PILL_SELECTED_CLASS");
    expect(tokens).not.toContain("HOUSE_FILTER_OFF_CLASS");
    expect(tokens).not.toContain("HOUSE_CONTROL_PILL_CLASS");
  });

  it("selects with thumb + ink, not gapped pill-fill", () => {
    navigation.pathname = SOCIAL_ROUTES.explore;
    const html = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "social" }),
    );
    expect(html).toContain("data-house-phone-dest-chips");
    expect(html).toContain("data-segmented-item");
    expect(html).toContain("data-segmented-thumb");
    expect(html).toContain("data-segmented-selected");
    expect(html).toContain(`data-segmented-persist="${housePhoneDestPersistKey("social")}"`);
    expect(html).toContain(HOUSE_SEGMENTED_TRACK_CLASS);
    expect(html).toContain(HOUSE_SEGMENTED_THUMB_CLASS);
    expect(html).toContain('data-house-phone-dest="Explore"');
    expect(html).toContain('data-house-phone-dest="Create"');
    expect(html).toContain('data-house-phone-dest="Feed"');

    const explore = html.slice(html.indexOf('data-house-phone-dest="Explore"'));
    const exploreTag = explore.slice(0, explore.indexOf(">"));
    expect(exploreTag).toContain(HOUSE_SEGMENTED_ITEM_ON_CLASS);
    expect(exploreTag).toContain("data-segmented-selected");
    expect(exploreTag).not.toContain("bg-accent");
    expect(exploreTag).not.toContain(HOUSE_PILL_SELECTED_CLASS);
    expect(housePhoneDestItemClass(true)).not.toContain("bg-accent");
    expect(housePhoneDestItemClass(true)).not.toContain("bg-surface-muted");
    expect(HOUSE_PHONE_DESTS_CLASS).not.toMatch(/gap-/);
  });

  it("keeps the same track on aggregation and education dest rows", () => {
    navigation.pathname = "/aggregation/titles";
    const aggregation = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "aggregation" }),
    );
    expect(aggregation).toContain(`data-segmented-persist="${housePhoneDestPersistKey("aggregation")}"`);
    expect(aggregation).toContain(HOUSE_SEGMENTED_TRACK_CLASS);
    expect(aggregation).toContain(HOUSE_SEGMENTED_THUMB_CLASS);
    expect(aggregation).toContain('data-house-phone-dest="Titles"');
    const titles = aggregation.slice(aggregation.indexOf('data-house-phone-dest="Titles"'));
    expect(titles.slice(0, titles.indexOf(">"))).toContain(HOUSE_SEGMENTED_ITEM_ON_CLASS);

    navigation.pathname = "/education";
    const education = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "education" }),
    );
    expect(education).toContain(`data-segmented-persist="${housePhoneDestPersistKey("education")}"`);
    expect(education).toContain(HOUSE_SEGMENTED_TRACK_CLASS);
    expect(education).toContain('data-house-phone-dest="Education"');
  });
});
