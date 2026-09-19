import { afterEach, describe, expect, it } from "vitest";

import { HOUSE_SEGMENTED_THUMB_DURATION_MS } from "./house-shell";
import {
  clearSegmentedThumbCache,
  cubicBezierProgress,
  isUsableSegmentedThumbBox,
  measureSegmentedBox,
  mixSegmentedThumbBox,
  projectSegmentedThumbFlight,
  readSegmentedThumbCache,
  scheduleSegmentedThumbRestore,
  SEGMENTED_TRACK_PERSIST,
  segmentedThumbFirstPaintBox,
  segmentedThumbNeedsRestore,
  segmentedThumbRestoreSource,
  segmentedThumbStyle,
  startSegmentedThumbFlight,
  writeSegmentedThumbCache,
  writeSegmentedThumbPainted,
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

  it("restores a remount that never started a flight from the last painted box", () => {
    writeSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace, {
      left: 24,
      width: 88,
    });
    expect(segmentedThumbFirstPaintBox(SEGMENTED_TRACK_PERSIST.workspace, 0)).toEqual({
      left: 24,
      width: 88,
    });
    expect(
      segmentedThumbRestoreSource(
        SEGMENTED_TRACK_PERSIST.workspace,
        { left: 120, width: 72 },
        0,
      ),
    ).toEqual({
      box: { left: 24, width: 88 },
      remainingMs: HOUSE_SEGMENTED_THUMB_DURATION_MS,
    });
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

  it("interpolates left and width together and keeps remaining time on remount", () => {
    const from = { left: 0, width: 48 };
    const to = { left: 120, width: 96 };
    expect(mixSegmentedThumbBox(from, to, 0.5)).toEqual({ left: 60, width: 72 });

    const mid = projectSegmentedThumbFlight(
      {
        from,
        to,
        startedAt: 1_000,
        durationMs: HOUSE_SEGMENTED_THUMB_DURATION_MS,
      },
      1_000 + HOUSE_SEGMENTED_THUMB_DURATION_MS / 2,
    );
    expect(mid.done).toBe(false);
    expect(mid.remainingMs).toBe(HOUSE_SEGMENTED_THUMB_DURATION_MS / 2);
    expect(mid.box.left).toBeGreaterThan(60);
    expect(mid.box.left).toBeLessThan(120);
    expect(mid.box.width).toBeGreaterThan(72);
    expect(mid.box.width).toBeLessThan(96);
    expect(cubicBezierProgress(0.5)).toBeGreaterThan(0.5);

    const done = projectSegmentedThumbFlight(
      {
        from,
        to,
        startedAt: 1_000,
        durationMs: HOUSE_SEGMENTED_THUMB_DURATION_MS,
      },
      1_000 + HOUSE_SEGMENTED_THUMB_DURATION_MS,
    );
    expect(done).toEqual({ box: to, remainingMs: 0, done: true });

    startSegmentedThumbFlight(SEGMENTED_TRACK_PERSIST.workspace, from, to, 5_000);
    const painted = readSegmentedThumbCache(SEGMENTED_TRACK_PERSIST.workspace, 5_080);
    expect(painted?.left).toBeGreaterThan(from.left);
    expect(painted?.left).toBeLessThan(to.left);

    writeSegmentedThumbPainted(SEGMENTED_TRACK_PERSIST.workspace, from);
    const live = segmentedThumbFirstPaintBox(SEGMENTED_TRACK_PERSIST.workspace, 5_080);
    expect(live?.left).toBeGreaterThan(from.left);
    expect(live?.left).toBeLessThan(to.left);
    expect(
      segmentedThumbRestoreSource(SEGMENTED_TRACK_PERSIST.workspace, to, 5_080)?.remainingMs,
    ).toBe(HOUSE_SEGMENTED_THUMB_DURATION_MS - 80);
  });

  it("restores a settled remount from the last painted box, not a snap to next", () => {
    const from = { left: 0, width: 48 };
    const to = { left: 120, width: 96 };
    const next = { left: 240, width: 64 };
    startSegmentedThumbFlight(
      SEGMENTED_TRACK_PERSIST.workspace,
      from,
      to,
      1_000,
    );
    writeSegmentedThumbPainted(SEGMENTED_TRACK_PERSIST.workspace, to);

    const settledAt = 1_000 + HOUSE_SEGMENTED_THUMB_DURATION_MS;
    expect(segmentedThumbFirstPaintBox(SEGMENTED_TRACK_PERSIST.workspace, settledAt)).toEqual(
      to,
    );
    expect(
      segmentedThumbRestoreSource(SEGMENTED_TRACK_PERSIST.workspace, next, settledAt),
    ).toEqual({
      box: to,
      remainingMs: HOUSE_SEGMENTED_THUMB_DURATION_MS,
    });
    expect(
      segmentedThumbRestoreSource(SEGMENTED_TRACK_PERSIST.workspace, to, settledAt),
    ).toBeUndefined();
  });

  it("slides from the last painted lane after a completed hop remounts at the destination", () => {
    const from = { left: 0, width: 48 };
    const to = { left: 120, width: 96 };
    startSegmentedThumbFlight(
      SEGMENTED_TRACK_PERSIST.workspace,
      from,
      to,
      1_000,
    );
    writeSegmentedThumbPainted(SEGMENTED_TRACK_PERSIST.workspace, from);

    const settledAt = 1_000 + HOUSE_SEGMENTED_THUMB_DURATION_MS;
    expect(segmentedThumbFirstPaintBox(SEGMENTED_TRACK_PERSIST.workspace, settledAt)).toEqual(
      from,
    );
    expect(
      segmentedThumbRestoreSource(SEGMENTED_TRACK_PERSIST.workspace, to, settledAt),
    ).toEqual({
      box: from,
      remainingMs: HOUSE_SEGMENTED_THUMB_DURATION_MS,
    });
  });
});
