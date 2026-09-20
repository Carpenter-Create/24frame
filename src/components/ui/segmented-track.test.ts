import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  HOUSE_SEGMENTED_ITEM_ON_CLASS,
  HOUSE_SEGMENTED_THUMB_CLASS,
} from "@/lib/house-shell";
import { stampSegmentedSelected } from "./segmented-track";

const src = readFileSync("src/components/ui/segmented-track.tsx", "utf8");
const lib = readFileSync("src/lib/segmented-track.ts", "utf8");

const CONSUMERS = [
  "src/components/chrome/workspace-switcher.tsx",
  "src/components/chrome/house-period-presets.tsx",
  "src/components/activity/activity-family-chips.tsx",
  "src/components/dashboard/dashboard-ranked.tsx",
  "src/components/reports/reports-ranked.tsx",
  "src/components/reports/reports-controls.tsx",
] as const;

describe("SegmentedTrack slide SoT", () => {
  it("slides left/width, restores a cached box across remount, and commits the click before the route", () => {
    expect(src).toContain("persistKey");
    expect(src).toContain("readSegmentedThumbFlight");
    expect(src).toContain("startSegmentedThumbFlight");
    expect(src).toContain("projectSegmentedThumbFlight");
    expect(src).toContain("scheduleSegmentedThumbRestore");
    expect(src).toContain("remainingMs");
    expect(src).toContain("onClickCapture");
    expect(src).toContain("setVisualIndex");
    expect(src).toContain("data-segmented-persist");
    expect(src).toContain("transition: \"none\"");
    expect(src).toContain("houseSegmentedThumbHidden");
    expect(src).toContain("setThumbStyle({ opacity: 0 })");
    expect(src).not.toContain("transition-opacity");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).toContain("transition-[left,width]");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).toContain("duration-[320ms]");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).not.toContain("duration-200");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).not.toContain("transition-opacity");
    expect(lib).toContain("SEGMENTED_TRACK_PERSIST");
    expect(lib).toContain("workspace-pills");
    expect(lib).toContain("requestAnimationFrame");
  });

  it("owns optimistic selected ink from visualIndex — hosts do not fork pending", () => {
    expect(src).toContain("segmentedTrackSelection(visualIndex)");
    expect(src).toContain("stampSegmentedSelected");
    expect(src).toContain("children(selection)");
    expect(src).toContain("commitVisualIndex(index)");
    expect(src).toContain("resolveSegmentedVisualIndex");
    expect(src).toContain("writeSegmentedVisualIndex");
    expect(lib).toContain("visualIndex is the SoT");
    expect(lib).toContain("resolveSegmentedVisualIndex");
    expect(lib).toContain("writeSegmentedVisualIndex");
    expect(lib).not.toContain("pendingIndex ?? routeIndex");
    expect(HOUSE_SEGMENTED_ITEM_ON_CLASS).toBe("text-white");

    for (const path of CONSUMERS) {
      const body = readFileSync(path, "utf8");
      expect(body, path).toContain("persistKey={SEGMENTED_TRACK_PERSIST.");
      expect(body, path).toContain("({ selectedIndex })");
      expect(body, path).toContain("segmentedItemOn");
      expect(body, path).not.toContain("pendingIndex");
      expect(body, path).not.toContain("pendingFamily");
      expect(body, path).not.toContain("setPending");
    }

    const inbox = readFileSync("src/components/activity/activity-inbox.tsx", "utf8");
    expect(inbox).toContain("ActivityFamilyChips");
    expect(inbox).not.toContain("SegmentedTrack");
    expect(inbox).not.toContain("pendingFamily");
  });

  it("stamps data-segmented-selected on the visual item before the route commits", () => {
    const html = renderToStaticMarkup(
      createElement(
        "div",
        null,
        stampSegmentedSelected(
          [
            createElement("a", { key: "all", "data-segmented-item": "" }, "All"),
            createElement(
              "a",
              { key: "education", "data-segmented-item": "" },
              "Education",
            ),
          ],
          1,
        ),
      ),
    );
    expect(html).toContain("data-segmented-item");
    expect(html).toContain("data-segmented-selected");
    expect(html.indexOf('data-segmented-item=""')).toBeLessThan(
      html.indexOf("data-segmented-selected"),
    );
    expect(html.indexOf(">All<")).toBeLessThan(html.indexOf("data-segmented-selected"));
    expect(html.indexOf("data-segmented-selected")).toBeLessThan(
      html.indexOf(">Education<"),
    );
  });
});
