import { describe, expect, it } from "vitest";

import {
  parseSocialActivityPill,
  socialActivityEmptyCopy,
  socialActivityPillLabel,
  socialPostMatchesActivityMedia,
  readSocialProfileLocation,
  resolveSocialProfileLocation,
  socialActivityMediaPostIds,
  socialProfileActivityHref,
  socialProfileTabSearch,
  socialProfileViewHref,
  SOCIAL_ACTIVITY_PILLS,
} from "@/lib/social-activity";
import { SOCIAL } from "@/lib/social";

describe("activity pills", () => {
  it("parses exclusive pills and defaults to posts", () => {
    expect(SOCIAL_ACTIVITY_PILLS).toEqual(["posts", "comments", "images", "videos"]);
    expect(parseSocialActivityPill("comments")).toBe("comments");
    expect(parseSocialActivityPill("images")).toBe("images");
    expect(parseSocialActivityPill("videos")).toBe("videos");
    expect(parseSocialActivityPill("boost")).toBe("posts");
    expect(socialActivityPillLabel("comments")).toBe(SOCIAL.profile.activityComments);
    expect(socialProfileActivityHref("/social/profile", "posts")).toBe("/social/profile");
    expect(socialProfileActivityHref("/social/u/ada", "comments")).toBe(
      "/social/u/ada?tab=activity&activity=comments",
    );
    expect(socialProfileViewHref("/social/u/ada", "activity", "posts")).toBe("/social/u/ada");
    expect(socialProfileViewHref("/social/u/ada", "highlights")).toBe("/social/u/ada?tab=highlights");
    expect(socialProfileTabSearch("activity")).toEqual({});
    expect(socialProfileTabSearch("activity", "posts")).toEqual({});
    expect(socialProfileTabSearch("credits")).toEqual({ tab: "credits" });
  });

  it("keeps image-only and video-only posts off the mixed roll", () => {
    const image = [{ kind: "image", key: "posts/u1/a.jpg", contentType: "image/jpeg" }];
    const video = [{ kind: "video", key: "posts/u1/a.mp4", contentType: "video/mp4" }];
    const mixed = [...image, ...video];
    expect(socialPostMatchesActivityMedia(image, "images")).toBe(true);
    expect(socialPostMatchesActivityMedia(image, "videos")).toBe(false);
    expect(socialPostMatchesActivityMedia(video, "videos")).toBe(true);
    expect(socialPostMatchesActivityMedia(mixed, "images")).toBe(false);
    expect(socialPostMatchesActivityMedia(mixed, "videos")).toBe(false);
    expect(socialPostMatchesActivityMedia([], "images")).toBe(false);
    expect(socialActivityEmptyCopy("comments").title).toBe(SOCIAL.profile.activityCommentsEmpty);
  });

  it("reads the live profile tab from house search and keeps the RSC seed until owned", () => {
    expect(readSocialProfileLocation("?tab=credits")).toEqual({
      tab: "credits",
      activity: "posts",
    });
    expect(readSocialProfileLocation("?tab=activity&activity=comments")).toEqual({
      tab: "activity",
      activity: "comments",
    });
    expect(
      resolveSocialProfileLocation({
        owned: false,
        search: "",
        nextSearch: "",
        seedTab: "credits",
        seedActivity: "posts",
      }),
    ).toEqual({ tab: "credits", activity: "posts" });
    expect(
      resolveSocialProfileLocation({
        owned: true,
        search: "?tab=highlights",
        nextSearch: "",
        seedTab: "activity",
        seedActivity: "posts",
      }),
    ).toEqual({ tab: "highlights", activity: "posts" });
    expect(
      resolveSocialProfileLocation({
        owned: true,
        search: "?tab=activity&activity=videos",
        nextSearch: "?tab=credits",
        seedTab: "credits",
        seedActivity: "posts",
      }),
    ).toEqual({ tab: "activity", activity: "videos" });
    expect(
      resolveSocialProfileLocation({
        owned: false,
        search: "",
        nextSearch: "?activity=images",
        seedTab: "credits",
        seedActivity: "posts",
      }),
    ).toEqual({ tab: "activity", activity: "images" });
    const image = [{ kind: "image" as const, key: "posts/u1/a.jpg", contentType: "image/jpeg" as const }];
    expect(socialActivityMediaPostIds([{ id: "p1", media: image }, { id: "p2", media: [] }])).toEqual({
      imageIds: ["p1"],
      videoIds: [],
    });
  });
});
