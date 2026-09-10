import { describe, expect, it } from "vitest";

import {
  RAIL_COLLAPSE_RL_CHEVRON,
  RAIL_COLLAPSE_RL_CHEVRON_CLASS,
  RAIL_COLLAPSE_RL_CHEVRON_EXPAND_ROW_CLASS,
  RAIL_COLLAPSE_RL_CHEVRON_ICON_CLASS,
  RAIL_COLLAPSE_RL_CHEVRON_ICON_STROKE,
} from "./rail-collapse";

describe("rail-collapse tokens", () => {
  it("keeps the RL chevron names and measured values", () => {
    expect(RAIL_COLLAPSE_RL_CHEVRON).toBe("rl-chevron");
    expect(RAIL_COLLAPSE_RL_CHEVRON_CLASS).toContain("h-7 w-7");
    expect(RAIL_COLLAPSE_RL_CHEVRON_CLASS).toContain("rounded-[var(--radius-sm)]");
    expect(RAIL_COLLAPSE_RL_CHEVRON_CLASS).toContain("text-ink-3");
    expect(RAIL_COLLAPSE_RL_CHEVRON_ICON_CLASS).toBe("h-4 w-4");
    expect(RAIL_COLLAPSE_RL_CHEVRON_ICON_STROKE).toBe(1.33);
    expect(RAIL_COLLAPSE_RL_CHEVRON_EXPAND_ROW_CLASS).toBe(
      "flex h-8 items-center justify-center",
    );
    expect(RAIL_COLLAPSE_RL_CHEVRON_EXPAND_ROW_CLASS).not.toMatch(/border|hairline/);
  });
});
