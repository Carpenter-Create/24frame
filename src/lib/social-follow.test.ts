import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { NOTIFICATION_PREF_DEFAULTS, parseNotificationPrefsRow } from "@/lib/notification-prefs";
import { SOCIAL } from "@/lib/social";
import {
  isFollowUniqueViolation,
  newFollowerNoticeCopy,
  newFollowerSourceRefs,
  shouldNotifyNewFollower,
} from "@/lib/social-follow";

describe("social follow helpers", () => {
  it("treats unique-constraint codes as an already-following edge", () => {
    expect(isFollowUniqueViolation({ message: "duplicate key", code: "23505" })).toBe(true);
    expect(isFollowUniqueViolation({ message: "duplicate key value" })).toBe(true);
    expect(isFollowUniqueViolation({ message: "new row violates row-level security", code: "42501" })).toBe(
      false,
    );
    expect(isFollowUniqueViolation(null)).toBe(false);
  });

  it("notifies on the default in-app pref and skips when that channel is off", () => {
    expect(shouldNotifyNewFollower(NOTIFICATION_PREF_DEFAULTS)).toBe(true);
    expect(
      shouldNotifyNewFollower(
        parseNotificationPrefsRow({
          prefs: { new_follower: { in_app: false, email: false } },
        }),
      ),
    ).toBe(false);
  });

  it("names the actor with a handle and links to the follower profile", () => {
    expect(newFollowerNoticeCopy("ada")).toEqual({
      title: SOCIAL.follow.newFollowerTitle,
      body: "@ada followed you",
    });
    expect(SOCIAL.follow.newFollowerTitle).toBe("New follower");
    expect(newFollowerSourceRefs({ actorId: "u1", handle: "ada" })).toEqual({
      actor_id: "u1",
      handle: "ada",
      path: "/social/u/ada",
    });
  });

  it("flips Follow immediately, surfaces errors, and refreshes after a persist", () => {
    const src = readFileSync("src/components/social/social-forms.tsx", "utf8");
    const chunk = src.slice(
      src.indexOf("export function SocialFollowButton"),
      src.indexOf("export function SocialLikeButton"),
    );
    expect(chunk).toContain("const result = await toggleSocialFollow");
    expect(chunk).toContain("router.refresh()");
    expect(chunk).toContain("setIsFollowing");
    expect(chunk).toContain("pending");
    expect(chunk).toContain("FormError");
    expect(chunk).toContain("disabled={pending}");
    expect(chunk).not.toMatch(/await toggleSocialFollow\(formData\);\s*}/);
  });

  it("counts live follow rows instead of leftover follower_count", () => {
    const src = readFileSync("src/lib/social-feed.ts", "utf8");
    const chunk = src.slice(
      src.indexOf("export async function loadProfileSocialCounts"),
      src.indexOf("export type SocialFollowingWallPage"),
    );
    expect(chunk).toContain('.eq("followee_id", profileId)');
    expect(chunk).toContain('.eq("follower_id", profileId)');
    expect(chunk).toContain('select("followee_id"');
    expect(chunk).toContain('select("follower_id"');
    expect(chunk).not.toContain("follower_count");
  });
});
