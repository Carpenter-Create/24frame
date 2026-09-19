import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { HOUSE_SEGMENTED_THUMB_CLASS } from "@/lib/house-shell";

const src = readFileSync("src/components/ui/segmented-track.tsx", "utf8");
const lib = readFileSync("src/lib/segmented-track.ts", "utf8");

describe("SegmentedTrack slide SoT", () => {
  it("slides left/width, restores a cached box across remount, and commits the click before the route", () => {
    expect(src).toContain("persistKey");
    expect(src).toContain("readSegmentedThumbFlight");
    expect(src).toContain("startSegmentedThumbFlight");
    expect(src).toContain("projectSegmentedThumbFlight");
    expect(src).toContain("segmentedThumbRestoreSource");
    expect(src).toContain("writeSegmentedThumbPainted");
    expect(src).toContain("scheduleSegmentedThumbRestore");
    expect(src).toContain("remainingMs");
    expect(src).toContain("onClickCapture");
    expect(src).toContain("setVisualIndex");
    expect(src).toContain("data-segmented-persist");
    expect(src).toContain("transition: \"none\"");
    expect(src).not.toContain("transition-opacity");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).toContain("transition-[left,width]");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).toContain("duration-[320ms]");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).not.toContain("duration-200");
    expect(HOUSE_SEGMENTED_THUMB_CLASS).not.toContain("transition-opacity");
    expect(lib).toContain("SEGMENTED_TRACK_PERSIST");
    expect(lib).toContain("workspace-pills");
    expect(lib).toContain("requestAnimationFrame");
  });

  it("wires persistKey on every SegmentedTrack consumer", () => {
    const consumers = [
      "src/components/chrome/workspace-switcher.tsx",
      "src/components/chrome/house-period-presets.tsx",
      "src/components/activity/activity-inbox.tsx",
      "src/components/dashboard/dashboard-ranked.tsx",
      "src/components/reports/reports-ranked.tsx",
      "src/components/reports/reports-controls.tsx",
    ] as const;
    for (const path of consumers) {
      const body = readFileSync(path, "utf8");
      expect(body, path).toContain("persistKey={SEGMENTED_TRACK_PERSIST.");
    }
  });
});
