import { describe, expect, it } from "vitest";

import { ASSISTANT_NAME, PRODUCT_NAME } from "./product";
import { ONBOARDING_HIGHLIGHTS, ONBOARDING_WELCOME } from "./onboarding";

describe("onboarding product chrome", () => {
  it("welcomes the user to 24Frame and names 24Frame AI", () => {
    expect(ONBOARDING_WELCOME.eyebrow).toBe(PRODUCT_NAME);
    expect(ONBOARDING_WELCOME.title).toBe("Welcome to 24Frame");
    expect(ONBOARDING_HIGHLIGHTS.map((item) => item.title)).toContain(`${ASSISTANT_NAME} assistant`);
    expect(JSON.stringify(ONBOARDING_WELCOME)).not.toMatch(/24frame|24-Frame|24FRAME/);
    expect(JSON.stringify(ONBOARDING_HIGHLIGHTS)).not.toMatch(/Globee/);
  });
});
