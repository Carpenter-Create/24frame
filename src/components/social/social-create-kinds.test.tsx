import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

import { SocialCreateCompose } from "./social-forms";
import {
  HOUSE_FILTER_ON_CLASS,
  HOUSE_SEGMENTED_ITEM_OFF_CLASS,
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";
import { SEGMENTED_TRACK_PERSIST } from "@/lib/segmented-track";
import { SOCIAL } from "@/lib/social";

const src = readFileSync("src/components/social/social-forms.tsx", "utf8");

describe("Social create kinds", () => {
  it("mounts Photo | Video | Text on house SegmentedTrack, not gapped filter pills", () => {
    const html = renderToStaticMarkup(
      createElement(SocialCreateCompose, { authorName: "Ada Lovelace" }),
    );
    expect(html).toContain("data-social-create-kinds");
    expect(html).toContain('data-segmented-persist="social-create-kind"');
    expect(html).toContain("data-segmented-thumb");
    expect(html).toContain('data-social-create-kind="photo"');
    expect(html).toContain('data-social-create-kind="video"');
    expect(html).toContain('data-social-create-kind="text"');
    expect(html).toContain(SOCIAL.create.photo);
    expect(html).toContain(SOCIAL.create.video);
    expect(html).toContain(SOCIAL.create.text);
    expect(html).toContain(HOUSE_SEGMENTED_TRACK_CLASS);
    expect(html).toContain(HOUSE_SEGMENTED_ITEM_ON_CLASS);
    expect(html).toContain(HOUSE_SEGMENTED_ITEM_OFF_CLASS);
    expect(html).toContain("data-segmented-selected");
    expect(html).not.toContain(HOUSE_FILTER_ON_CLASS);
    expect(SEGMENTED_TRACK_PERSIST.socialCreateKind).toBe("social-create-kind");

    expect(src).toContain("SegmentedTrack");
    expect(src).toContain("persistKey={SEGMENTED_TRACK_PERSIST.socialCreateKind}");
    expect(src).toContain("({ selectedIndex })");
    expect(src).toContain("segmentedItemOn");
    expect(src).not.toContain("HOUSE_FILTER_ON_CLASS");
    expect(src).not.toContain("HOUSE_FILTER_OFF_CLASS");
    expect(src).not.toContain("HOUSE_FILTER_PILL_CLUSTER");
    expect(src).not.toContain("flex flex-wrap gap-1.5");
  });
});
