import { describe, expect, it } from "vitest";

import { SETTINGS } from "./settings";
import { SOCIAL, SOCIAL_ROUTES } from "./social";
import { followingAuthorIds, socialChecklistIncomplete, socialChecklistItems } from "./social-home";
import { isStoryLive, storyExpiresAt, storyInsertRow, storyRailUnseen } from "./social-stories";

describe("following wall authors", () => {
  it("includes self and unique followees", () => {
    expect(followingAuthorIds("u1", ["u2", "u1", "u3"])).toEqual(["u1", "u2", "u3"]);
    expect(followingAuthorIds("u1", [])).toEqual(["u1"]);
  });
});

describe("onboarding checklist", () => {
  it("uses the locked Skool-style items and the account photo door", () => {
    const items = socialChecklistItems({
      hasPhoto: false,
      hasBio: true,
      hasIntro: false,
      hasPost: false,
      hasStory: true,
    });
    expect(items.map((item) => item.label)).toEqual([
      SOCIAL.checklist.photo,
      SOCIAL.checklist.bio,
      SOCIAL.checklist.introduce,
      SOCIAL.checklist.firstPost,
      SOCIAL.checklist.firstStory,
    ]);
    expect(items[0]?.href).toBe(SETTINGS.profileHref);
    expect(items[1]?.href).toBe(SOCIAL_ROUTES.profile);
    expect(items[2]?.href).toBe(SOCIAL_ROUTES.create);
    expect(items[4]?.href).toBe(SOCIAL_ROUTES.storiesNew);
    expect(items[1]?.done).toBe(true);
    expect(items[4]?.done).toBe(true);
    expect(socialChecklistIncomplete(items)).toBe(true);
    expect(
      socialChecklistIncomplete(
        socialChecklistItems({
          hasPhoto: true,
          hasBio: true,
          hasIntro: true,
          hasPost: true,
          hasStory: true,
        }),
      ),
    ).toBe(false);
  });
});

describe("stories live window", () => {
  it("treats unseen as not fully viewed inside 24h", () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    expect(storyExpiresAt(now).toISOString()).toBe("2026-09-15T12:00:00.000Z");
    expect(isStoryLive("2026-09-14T11:00:00.000Z", now)).toBe(false);
    expect(isStoryLive("2026-09-14T13:00:00.000Z", now)).toBe(true);
    expect(storyRailUnseen(["s1", "s2"], new Set(["s1"]))).toBe(true);
    expect(storyRailUnseen(["s1", "s2"], new Set(["s1", "s2"]))).toBe(false);
    expect(storyInsertRow({ authorId: "u1", body: null, media: [], now }).expires_at).toBe(
      "2026-09-15T12:00:00.000Z",
    );
  });
});
