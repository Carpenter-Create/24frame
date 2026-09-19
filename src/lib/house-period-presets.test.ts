import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  HOUSE_PERIOD_PRESETS_HOST_CLASS,
  HOUSE_PERIOD_PRESETS_PHONE_CLASS,
} from "@/lib/house-period-presets";
import {
  HOUSE_SEGMENTED_TRACK_CLASS,
} from "@/lib/house-shell";

describe("HousePeriodPresets craft", () => {
  it("uses a segmented track on desktop and HousePageSelect on phone — never wrap", () => {
    expect(HOUSE_SEGMENTED_TRACK_CLASS).toContain("flex");
    expect(HOUSE_SEGMENTED_TRACK_CLASS).toContain("rounded-full");
    expect(HOUSE_SEGMENTED_TRACK_CLASS).toContain("bg-surface-muted");
    expect(HOUSE_SEGMENTED_TRACK_CLASS).not.toContain("flex-wrap");
    expect(HOUSE_PERIOD_PRESETS_PHONE_CLASS).toBe("md:hidden");
    expect(HOUSE_PERIOD_PRESETS_PHONE_CLASS).not.toContain("flex-wrap");
    expect(HOUSE_PERIOD_PRESETS_HOST_CLASS).toBe("min-w-0");

    const craft = readFileSync("src/lib/house-period-presets.ts", "utf8");
    const src = readFileSync("src/components/chrome/house-period-presets.tsx", "utf8");
    expect(craft).not.toContain("flex-wrap");
    expect(src).toContain("HousePageSelect");
    expect(src).toContain("SegmentedTrack");
    expect(src).toContain("SEGMENTED_TRACK_PERSIST.period");
    expect(src).toContain("HOUSE_SEGMENTED_ITEM_BASE_CLASS");
    expect(src).toContain("chipDataAttr");
    expect(src).not.toContain("chipAttrs");
    expect(src).not.toContain("flex-wrap");
    expect(src).not.toContain("overflow-x-auto");
  });
});
