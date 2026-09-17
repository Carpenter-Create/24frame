import { afterEach, describe, expect, it, vi } from "vitest";

import {
  afterWindowPaint,
  readWindowScroll,
  restoreWindowScroll,
  restoreWindowScrollAfterPaint,
} from "@/lib/dashboard-scroll";

describe("dashboard scroll lock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads and restores window scroll without scrolling to top", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollX: 12, scrollY: 640, scrollTo });

    const pos = readWindowScroll();
    expect(pos).toEqual({ x: 12, y: 640 });
    restoreWindowScroll(pos);
    expect(scrollTo).toHaveBeenCalledWith(12, 640);
    expect(scrollTo).not.toHaveBeenCalledWith(0, 0);
    restoreWindowScroll(null);
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("restores again after paint so a collapsed map cannot keep a jump", () => {
    const frames: FrameRequestCallback[] = [];
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollX: 0, scrollY: 480, scrollTo });
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });

    restoreWindowScrollAfterPaint(readWindowScroll());
    expect(scrollTo).toHaveBeenCalledWith(0, 480);
    expect(frames).toHaveLength(1);
    frames.shift()?.(0);
    expect(frames).toHaveLength(1);
    frames.shift()?.(0);
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenNthCalledWith(2, 0, 480);
  });

  it("runs afterWindowPaint immediately when rAF is missing", () => {
    const fn = vi.fn();
    vi.stubGlobal("requestAnimationFrame", undefined);
    afterWindowPaint(fn);
    expect(fn).toHaveBeenCalledOnce();
  });
});
