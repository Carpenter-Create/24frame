import { createElement } from "react";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS,
  HOUSE_PAGE_SELECT_PANEL_CLASS,
  HOUSE_PAGE_SELECT_SHEET_HOST_CLASS,
  HOUSE_PAGE_SELECT_TRIGGER_CLASS,
} from "@/lib/house-page-select";
import { HousePageSelect } from "./house-page-select";

describe("HousePageSelect", () => {
  it("is the house standard in-page select with desktop menu + phone sheet", () => {
    const html = renderToStaticMarkup(
      createElement(HousePageSelect, {
        value: "all",
        label: "All",
        ariaLabel: "Filter",
        defaultOpen: true,
        onPick: () => undefined,
        options: [
          { key: "all", label: "All" },
          { key: "live", label: "Live" },
        ],
      }),
    );
    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-house-page-select-trigger");
    expect(html).toContain("data-house-page-select-menu");
    expect(html).toContain("data-house-page-select-sheet");
    expect(html).toContain("data-house-page-select-current");
    expect(html).toContain(HOUSE_PAGE_SELECT_TRIGGER_CLASS);
    expect(html).toContain(HOUSE_PAGE_SELECT_PANEL_CLASS);
    expect(html).toContain(HOUSE_PAGE_SELECT_SHEET_HOST_CLASS);
    expect(html).toContain(HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS);
    expect(html).toContain("data-appearance-check");
    expect(html).toContain("shadow-none");
    expect(html).toContain("max-md:hidden");
    expect(html).toContain("md:hidden");
    expect(html).not.toContain("<select");
  });

  it("documents Dashboard All time as the SoT in source", () => {
    const src = readFileSync("src/components/chrome/house-page-select.tsx", "utf8");
    const craft = readFileSync("src/lib/house-page-select.ts", "utf8");
    expect(src).toMatch(/house standard/i);
    expect(src).toMatch(/Dashboard All time/i);
    expect(craft).toMatch(/house standard/i);
    expect(craft).toMatch(/Dashboard All time/i);
    expect(src).toContain("createPortal");
    expect(src).toContain("AppearanceCheck");
  });

  it("has no StatusFilter chip fork or unused SortControl twin", () => {
    expect(existsSync("src/components/layout/status-filter.tsx")).toBe(false);
    expect(existsSync("src/components/layout/sort-control.tsx")).toBe(false);

    const lenses = [
      "src/components/dashboard/dashboard-admin-controls.tsx",
      "src/components/chrome/house-period-presets.tsx",
      "src/components/titles/titles-status-filter.tsx",
      "src/app/(app)/(operator)/channels/channels-status-filter.tsx",
      "src/app/(app)/(operator)/gc/deliveries/licensing-status-filter.tsx",
      "src/app/(app)/(operator)/gc/clients/clients-status-filter.tsx",
    ] as const;

    for (const path of lenses) {
      const src = readFileSync(path, "utf8");
      expect(src, path).toContain("HousePageSelect");
      expect(src, path).not.toContain("@/components/layout/status-filter");
      expect(src, path).not.toContain("import { StatusFilter }");
    }
  });
});
