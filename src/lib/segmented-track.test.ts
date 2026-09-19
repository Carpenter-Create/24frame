import { afterEach, describe, expect, it } from "vitest";

import {
  clearSegmentedThumbCache,
  isUsableSegmentedThumbBox,
  measureSegmentedBox,
  readSegmentedThumbCache,
  scheduleSegmentedThumbRestore,
  SEGMENTED_TRACK_PERSIST,
  segmentedThumbNeedsRestore,
  segmentedThumbStyle,
  writeSegmentedThumbCache,
} from "./segmented-track";

afterEach(() => {
  clearSegmentedThumbCache();
});

describe("segmented track persist cache", () => {
  it("stores a usable box and ignores empty width", () => {
    writeSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace, {
      left: 24,
      width: 88,
    });
    expect(readSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace)).toEqual({
      left: 24,
      width: 88,
    });

    writeSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.period, { left: 0, width: 0 });
    expect(readSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.period)).toBeUndefined();
    expect(isUsableSegmentedThumbBox({ left: 0, width: 0 })).toBe(false);
    expect(isUsableSegmentedThumbBox({ left: 0, width: 12 })).toBe(true);
  });

  it("keeps workspace and period caches from overwriting each other", () => {
    writeSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace, {
      left: 10,
      width: 40,
    });
    writeSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.period, {
      left: 80,
      width: 32,
    });
    expect(readSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace)?.left).toBe(10);
    expect(readSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.period)?.left).toBe(80);
    clearSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace);
    expect(readSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace)).toBeUndefined();
    expect(readSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.period)?.width).toBe(32);
  });
});

describe("segmented thumb geometry", () => {
  it("measures left relative to the track, not the viewport", () => {
    const box = measureSegmentedBox(
      { getBoundingClientRect: () => ({ left: 200 }) },
      { getBoundingClientRect: () => ({ left: 280, width: 64 }) },
    );
    expect(box).toEqual({ left: 80, width: 64 });
    expect(segmentedThumbStyle(box)).toEqual({ left: 80, width: 64, opacity: 1 });
  });

  it("restores only when the cached box is a different painted position", () => {
    const next = { left: 120, width: 72 };
    expect(segmentedThumbNeedsRestore(undefined, next)).toBe(false);
    expect(segmentedThumbNeedsRestore({ left: 120, width: 72 }, next)).toBe(false);
    expect(segmentedThumbNeedsRestore({ left: 120.2, width: 72 }, next)).toBe(false);
    expect(segmentedThumbNeedsRestore({ left: 24, width: 72 }, next)).toBe(true);
    expect(segmentedThumbNeedsRestore({ left: 120, width: 40 }, next)).toBe(true);
    expect(segmentedThumbNeedsRestore({ left: 24, width: 0 }, next)).toBe(false);
  });

  it("paints the cached box first, then applies the destination on the second frame", () => {
    const frames: FrameRequestCallback[] = [];
    const raf = (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    };
    const cancelled: number[] = [];
    const applied: Array<{ left: number; width: number }> = [];
    const cancel = scheduleSegmentedThumbRestore(
      (box) => applied.push(box),
      { left: 160, width: 80 },
      raf,
      (id) => {
        cancelled.push(id);
      },
    );

    expect(applied).toEqual([]);
    frames[0]?.(0);
    expect(applied).toEqual([]);
    frames[1]?.(0);
    expect(applied).toEqual([{ left: 160, width: 80 }]);

    cancel();
    expect(cancelled).toContain(1);
  });
});
