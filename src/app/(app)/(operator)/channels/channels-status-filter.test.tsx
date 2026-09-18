import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { CHANNELS_PAGE, VENDOR_DIRECTORY_FILTERS } from "@/lib/vendors-directory";
import { ChannelsStatusFilter } from "./channels-status-filter";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

function openingTagWith(html: string, marker: string): string {
  const start = html.indexOf(marker);
  if (start < 0) return "";
  const tagStart = html.lastIndexOf("<", start);
  const tagEnd = html.indexOf(">", start);
  return html.slice(tagStart, tagEnd + 1);
}

describe("ChannelsStatusFilter", () => {
  it("uses HousePageSelect at every breakpoint, not StatusFilter chips", () => {
    const html = renderToStaticMarkup(
      createElement(ChannelsStatusFilter, { status: "all", defaultOpen: true }),
    );
    const compact = openingTagWith(html, 'data-channels-status-compact=""');
    const current = openingTagWith(html, 'data-channels-status-current=""');

    expect(html).toContain("data-house-page-select");
    expect(html).toContain("data-house-page-select-menu");
    expect(html).toContain("data-house-page-select-sheet");
    expect(html).toContain("data-channels-status-trigger");
    expect(html).toContain("data-appearance-check");
    expect(html).toContain(CHANNELS_PAGE.statusFilterLabel);
    expect(compact).toContain("w-auto");
    expect(compact).toContain("shrink-0");
    expect(compact).not.toContain("md:hidden");
    expect(html).not.toContain('role="group"');
    expect(html).not.toContain("<select");
    expect(html).toContain("t-body-sm");
    expect(current).not.toContain("t-label");
    for (const { label } of VENDOR_DIRECTORY_FILTERS) {
      expect(html).toContain(label);
      expect(html).not.toContain(label.toUpperCase());
    }
  });

  it("stays on the Dashboard All time select grammar", () => {
    const src = readFileSync(
      "src/app/(app)/(operator)/channels/channels-status-filter.tsx",
      "utf8",
    );
    expect(src).toContain("HousePageSelect");
    expect(src).toContain("Dashboard All time");
    expect(src).toContain('menuAlign="end"');
    expect(src).not.toContain("StatusFilter");
    expect(src).not.toMatch(/triggerClassName=/);
    expect(src).not.toMatch(/md:hidden/);
    expect(src).not.toMatch(/uppercase/);
  });
});
