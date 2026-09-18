import { describe, expect, it } from "vitest";

import { SOCIAL_ROUTES } from "./social";
import {
  socialNavActivePath,
  socialNavIgnorePendingClick,
  socialNavPendingSettled,
} from "./social-nav-pending";

describe("social nav pending", () => {
  it("treats the in-flight href as the active path", () => {
    expect(socialNavActivePath(SOCIAL_ROUTES.home, null)).toBe(SOCIAL_ROUTES.home);
    expect(socialNavActivePath(SOCIAL_ROUTES.home, SOCIAL_ROUTES.profile)).toBe(SOCIAL_ROUTES.profile);
  });

  it("settles Home only on exact /social, not a child destination", () => {
    expect(socialNavPendingSettled(SOCIAL_ROUTES.home, SOCIAL_ROUTES.home)).toBe(true);
    expect(socialNavPendingSettled(SOCIAL_ROUTES.profile, SOCIAL_ROUTES.home)).toBe(false);
    expect(socialNavPendingSettled(SOCIAL_ROUTES.stories, SOCIAL_ROUTES.home)).toBe(false);
  });

  it("settles nested Social destinations on self or child paths", () => {
    expect(socialNavPendingSettled(SOCIAL_ROUTES.profile, SOCIAL_ROUTES.profile)).toBe(true);
    expect(socialNavPendingSettled(`${SOCIAL_ROUTES.profileByHandle}/ada`, SOCIAL_ROUTES.profile)).toBe(
      false,
    );
    expect(socialNavPendingSettled(`${SOCIAL_ROUTES.dms}/room-1`, SOCIAL_ROUTES.dms)).toBe(true);
    expect(socialNavPendingSettled(SOCIAL_ROUTES.profileEdit, SOCIAL_ROUTES.profile)).toBe(true);
    expect(socialNavPendingSettled(SOCIAL_ROUTES.profileBio, SOCIAL_ROUTES.profile)).toBe(true);
    expect(socialNavPendingSettled(SOCIAL_ROUTES.home, SOCIAL_ROUTES.explore)).toBe(false);
  });

  it("ignores modified and non-primary clicks", () => {
    const idle = { altKey: false, button: 0, ctrlKey: false, metaKey: false, shiftKey: false };
    expect(socialNavIgnorePendingClick(idle)).toBe(false);
    expect(socialNavIgnorePendingClick({ ...idle, metaKey: true })).toBe(true);
    expect(socialNavIgnorePendingClick({ ...idle, ctrlKey: true })).toBe(true);
    expect(socialNavIgnorePendingClick({ ...idle, button: 1 })).toBe(true);
  });
});
