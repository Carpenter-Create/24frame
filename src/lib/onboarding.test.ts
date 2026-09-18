import { describe, expect, it } from "vitest";

import { ASSISTANT_NAME, PRODUCT_NAME } from "./product";
import {
  ONBOARDING_HIGHLIGHTS,
  ONBOARDING_ORGANIZATION,
  ONBOARDING_WELCOME,
} from "./onboarding";

describe("onboarding product chrome", () => {
  it("welcomes the user to 24Frame and names 24Frame AI", () => {
    expect(ONBOARDING_WELCOME.eyebrow).toBe(PRODUCT_NAME);
    expect(ONBOARDING_WELCOME.title).toBe("Welcome to 24Frame");
    expect(ONBOARDING_WELCOME.subtitle).toContain("aggregation workspace");
    expect(ONBOARDING_ORGANIZATION.title).toBe("Name your company aggregation workspace");
    expect(ONBOARDING_ORGANIZATION.subtitle).toBe(
      "This workspace holds your titles, rights, and deliveries.",
    );
    expect(ONBOARDING_ORGANIZATION.nameLabel).toBe("Workspace name");
    expect(ONBOARDING_ORGANIZATION.submit).toBe("Create workspace");
    expect(ONBOARDING_ORGANIZATION.nameRequired).not.toMatch(/join 24Frame/i);
    expect(ONBOARDING_HIGHLIGHTS.map((item) => item.title)).toContain(`${ASSISTANT_NAME} assistant`);
    expect(ONBOARDING_HIGHLIGHTS.map((item) => item.body)).toContain(
      "Manage your company aggregation workspace.",
    );
    expect(JSON.stringify(ONBOARDING_WELCOME)).not.toMatch(/24frame|24-Frame|24FRAME/);
    expect(JSON.stringify(ONBOARDING_HIGHLIGHTS)).not.toMatch(/Globee/);
    expect(JSON.stringify({ ...ONBOARDING_WELCOME, ...ONBOARDING_ORGANIZATION })).not.toMatch(
      /join 24Frame|Social workspace/,
    );
  });
});
