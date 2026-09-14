import { describe, expect, it } from "vitest";

import {
  SOCIAL_TAB_BAR_SCROLL_THRESHOLD,
  nextSocialTabBarVisibility,
} from "./social-tab-bar-scroll";

describe("nextSocialTabBarVisibility", () => {
  it("stays visible at rest and on small jitter", () => {
    expect(nextSocialTabBarVisibility("visible", 40, 0)).toBe("visible");
    expect(nextSocialTabBarVisibility("hidden", 40, 0)).toBe("visible");
    expect(
      nextSocialTabBarVisibility("visible", SOCIAL_TAB_BAR_SCROLL_THRESHOLD, 80),
    ).toBe("visible");
    expect(
      nextSocialTabBarVisibility("hidden", -SOCIAL_TAB_BAR_SCROLL_THRESHOLD, 80),
    ).toBe("hidden");
  });

  it("hides on scroll-down and shows on scroll-up", () => {
    expect(nextSocialTabBarVisibility("visible", 12, 48)).toBe("hidden");
    expect(nextSocialTabBarVisibility("hidden", -12, 24)).toBe("visible");
  });
});
