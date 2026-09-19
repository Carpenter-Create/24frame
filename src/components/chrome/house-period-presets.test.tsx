import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

import { HousePeriodPresets } from "./house-period-presets";
import {
  HOUSE_PERIOD_PRESETS_PHONE_CLASS,
} from "@/lib/house-period-presets";
import {
  HOUSE_SEGMENTED_ITEM_BASE_CLASS,
} from "@/lib/house-shell";
import { REPORTS_PAGE, REPORTS_PERIOD_PRESETS } from "@/lib/reports";

const ITEMS = REPORTS_PERIOD_PRESETS.map((preset) => ({
  key: preset.grain,
  label: preset.label,
  href: preset.grain === "all" ? "/home" : `/home?period=${preset.grain}`,
}));

describe("HousePeriodPresets", () => {
  it("renders a segmented track on desktop plus a phone HousePageSelect", () => {
    const html = renderToStaticMarkup(
      createElement(HousePeriodPresets, {
        value: "all",
        items: ITEMS,
        ariaLabel: "Period",
        defaultOpen: true,
        chipDataAttr: "data-overview-revenue-period-chip",
      }),
    );

    expect(html).toContain("data-house-period-presets");
    expect(html).toContain("data-house-period-presets-chips");
    expect(html).toContain("data-house-period-presets-phone");
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-house-page-select-trigger");
    expect(html).toContain("data-house-page-select-sheet");
    expect(html).toContain("rounded-full");
    expect(html).toContain("bg-surface-muted");
    expect(html).toContain(HOUSE_PERIOD_PRESETS_PHONE_CLASS);
    expect(html).toContain(HOUSE_SEGMENTED_ITEM_BASE_CLASS);
    expect(html).toContain("data-segmented-thumb");
    expect(html).toContain("data-segmented-item");
    expect(html).toContain(REPORTS_PAGE.allTime);
    expect(html).toContain(REPORTS_PAGE.ytd);
    expect(html).toContain(REPORTS_PAGE.year);
    expect(html).toContain(REPORTS_PAGE.quarter);
    expect(html).toContain(REPORTS_PAGE.month);
    expect(html).toContain('data-overview-revenue-period-chip="month"');
    expect(html).not.toContain("flex-wrap");
    expect(html).not.toContain("<select");
  });
});
