import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DASHBOARD_SCROLL_RESTORE_BEHAVIOR,
  DASHBOARD_SCROLL_SWAP_BEHAVIOR,
  preserveWindowScroll,
} from "./dashboard-scroll";

type FollowUp = () => void;

function installScrollEnv({
  scrollX = 0,
  scrollY = 0,
  previousBehavior = "smooth",
}: {
  scrollX?: number;
  scrollY?: number;
  previousBehavior?: string;
} = {}) {
  const scrollTo = vi.fn();
  const frames: FollowUp[] = [];
  const timeouts: FollowUp[] = [];
  const root = { style: { scrollBehavior: previousBehavior } };

  vi.stubGlobal("document", { documentElement: root });
  vi.stubGlobal("window", {
    scrollX,
    scrollY,
    scrollTo,
    requestAnimationFrame: (cb: FrameRequestCallback) => {
      frames.push(() => {
        cb(0);
      });
      return frames.length;
    },
    setTimeout: (cb: FollowUp) => {
      timeouts.push(cb);
      return timeouts.length;
    },
  });

  return {
    scrollTo,
    root,
    flushNextFrame() {
      const cb = frames.shift();
      if (!cb) throw new Error("no scheduled animation frame");
      cb();
    },
    pendingFrames: frames,
    pendingTimeouts: timeouts,
  };
}

describe("preserveWindowScroll", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores the captured window offset instantly after the mutator commits", () => {
    const { scrollTo } = installScrollEnv({ scrollX: 24, scrollY: 720 });

    let committed = false;
    preserveWindowScroll(() => {
      committed = true;
    });

    expect(committed).toBe(true);
    expect(DASHBOARD_SCROLL_RESTORE_BEHAVIOR).toBe("instant");
    expect(scrollTo).toHaveBeenCalledWith({
      left: 24,
      top: 720,
      behavior: DASHBOARD_SCROLL_RESTORE_BEHAVIOR,
    });
  });

  it("does not leave the restored offset at the top after a tall-pane swap", () => {
    const { scrollTo } = installScrollEnv({ scrollX: 0, scrollY: 480 });

    preserveWindowScroll(() => undefined);

    expect(scrollTo).not.toHaveBeenCalledWith(0, 0);
    expect(scrollTo).toHaveBeenCalledWith({
      left: 0,
      top: 480,
      behavior: "instant",
    });
  });

  it("forces html scroll-behavior auto around mutate and restore, then restores previous", () => {
    const { scrollTo, root, flushNextFrame, pendingFrames } = installScrollEnv({
      scrollX: 12,
      scrollY: 640,
      previousBehavior: "smooth",
    });

    expect(DASHBOARD_SCROLL_SWAP_BEHAVIOR).toBe("auto");

    preserveWindowScroll(() => {
      expect(root.style.scrollBehavior).toBe("auto");
    });

    expect(root.style.scrollBehavior).toBe("auto");
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(pendingFrames).toHaveLength(1);

    flushNextFrame();
    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(root.style.scrollBehavior).toBe("auto");
    expect(pendingFrames).toHaveLength(1);

    flushNextFrame();
    expect(scrollTo).toHaveBeenCalledTimes(3);
    expect(scrollTo).toHaveBeenNthCalledWith(2, {
      left: 12,
      top: 640,
      behavior: "instant",
    });
    expect(scrollTo).toHaveBeenNthCalledWith(3, {
      left: 12,
      top: 640,
      behavior: "instant",
    });
    expect(root.style.scrollBehavior).toBe("smooth");
    expect(pendingFrames).toHaveLength(0);
  });

  it("re-applies the captured offset on two follow-up frames so smooth cannot win later", () => {
    const { scrollTo, flushNextFrame } = installScrollEnv({
      scrollX: 0,
      scrollY: 880,
    });

    preserveWindowScroll(() => undefined);

    expect(scrollTo).toHaveBeenCalledTimes(1);
    flushNextFrame();
    flushNextFrame();
    expect(scrollTo).toHaveBeenCalledTimes(3);
    expect(scrollTo.mock.calls.every((call) => call[0].top === 880)).toBe(true);
    expect(scrollTo.mock.calls.every((call) => call[0].behavior === "instant")).toBe(true);
    expect(scrollTo).not.toHaveBeenCalledWith(0, 0);
  });
});
