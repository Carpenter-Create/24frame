import { afterEach, describe, expect, it, vi } from "vitest";

import { DASHBOARD_SCROLL_RESTORE_BEHAVIOR, preserveWindowScroll } from "./dashboard-scroll";

describe("preserveWindowScroll", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores the captured window offset instantly after the mutator commits", () => {
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollX: 24, scrollY: 720, scrollTo });

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
    const scrollTo = vi.fn();
    vi.stubGlobal("window", { scrollX: 0, scrollY: 480, scrollTo });

    preserveWindowScroll(() => undefined);

    expect(scrollTo).not.toHaveBeenCalledWith(0, 0);
    expect(scrollTo).toHaveBeenCalledWith({
      left: 0,
      top: 480,
      behavior: "instant",
    });
  });
});
