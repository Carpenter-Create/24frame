import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  HOUSE_PERIOD_PRESETS_CHIPS_CLASS,
  HOUSE_PERIOD_PRESETS_HOST_CLASS,
  HOUSE_PERIOD_PRESETS_PHONE_CLASS,
} from "@/lib/house-period-presets";
import { REPORTS_PERIOD_CLUSTER_CLASS } from "@/lib/reports-craft";

describe("HousePeriodPresets craft", () => {
  it("keeps desktop chips on the Reports cluster and phone on HousePageSelect — never wrap", () => {
    expect(HOUSE_PERIOD_PRESETS_CHIPS_CLASS).toBe(REPORTS_PERIOD_CLUSTER_CLASS);
    expect(HOUSE_PERIOD_PRESETS_CHIPS_CLASS).toContain("hidden");
    expect(HOUSE_PERIOD_PRESETS_CHIPS_CLASS).toContain("md:flex");
    expect(HOUSE_PERIOD_PRESETS_CHIPS_CLASS).not.toContain("flex-wrap");
    expect(HOUSE_PERIOD_PRESETS_PHONE_CLASS).toBe("md:hidden");
    expect(HOUSE_PERIOD_PRESETS_PHONE_CLASS).not.toContain("flex-wrap");
    expect(HOUSE_PERIOD_PRESETS_HOST_CLASS).toBe("min-w-0");

    const craft = readFileSync("src/lib/house-period-presets.ts", "utf8");
    const src = readFileSync("src/components/chrome/house-period-presets.tsx", "utf8");
    expect(craft).not.toContain("flex-wrap");
    expect(src).toContain("HousePageSelect");
    expect(src).toContain("REPORTS_PERIOD_CHIP_CLASS");
    expect(src).toContain("chipDataAttr");
    expect(src).not.toContain("chipAttrs");
    expect(src).not.toContain("flex-wrap");
    expect(src).not.toContain("overflow-x-auto");
  });
});
