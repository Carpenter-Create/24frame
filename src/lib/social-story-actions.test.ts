import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL, storyLikeInsertRow } from "@/lib/social";
import { storyDmInsertRow } from "@/lib/social-dm-story";
import {
  nextStoryHeart,
  STORY_SEND_TOAST_MS,
  storyHeartCountVisible,
  storyAdvanceWhileSending,
  storySendPeopleOrder,
  storySendPeopleQuery,
  storySendToast,
  storySendUiAfter,
} from "@/lib/social-story-actions";

describe("story heart", () => {
  it("toggles none and liked and hides a zero count", () => {
    expect(nextStoryHeart({ liked: false, count: 0 })).toEqual({ liked: true, count: 1 });
    expect(nextStoryHeart({ liked: true, count: 1 })).toEqual({ liked: false, count: 0 });
    expect(nextStoryHeart({ liked: true, count: 4 })).toEqual({ liked: false, count: 3 });
    expect(nextStoryHeart({ liked: false, count: 4 })).toEqual({ liked: true, count: 5 });
    expect(nextStoryHeart({ liked: true, count: 0 })).toEqual({ liked: false, count: 0 });
    expect(storyHeartCountVisible(0)).toBe(false);
    expect(storyHeartCountVisible(1)).toBe(true);
  });

  it("stores a story item like separately from a post like", () => {
    expect(storyLikeInsertRow("u1", "s1")).toEqual({
      user_id: "u1",
      target_type: "story_item",
      target_id: "s1",
    });
  });
});

describe("send story", () => {
  it("closes only after a successful single send", () => {
    expect(storySendUiAfter({})).toEqual({ close: true, error: "" });
    expect(storySendUiAfter({ error: "Could not send this story." })).toEqual({
      close: false,
      error: "Could not send this story.",
    });
    expect(storySendUiAfter(undefined)).toEqual({
      close: false,
      error: SOCIAL.stories.sendFailed,
    });
    expect(storySendUiAfter(null)).toEqual({
      close: false,
      error: SOCIAL.stories.sendFailed,
    });
  });

  it("orders recent direct peers ahead of following and keeps self", () => {
    expect(
      storySendPeopleOrder({
        recentPeerIds: ["u2", null, "u1"],
        followeeIds: ["u3", "u2", "u1"],
        selfId: "u1",
      }),
    ).toEqual(["u2", "u1", "u3"]);
    expect(
      storySendPeopleOrder({
        recentPeerIds: ["u2"],
        followeeIds: ["u3"],
        selfId: "u1",
      }),
    ).toEqual(["u2", "u3", "u1"]);
  });

  it("filters the people already loaded", () => {
    const people = [
      { id: "u2", name: "Ada Lovelace", handle: "ada", photoUrl: null },
      { id: "u3", name: "Grace Hopper", handle: "grace", photoUrl: null },
    ];
    expect(storySendPeopleQuery(people, "")).toEqual(people);
    expect(storySendPeopleQuery(people, "hop")).toEqual([people[1]]);
    expect(storySendPeopleQuery(people, "ADA")).toEqual([people[0]]);
  });

  it("stores a calm body and keeps the story media", () => {
    const media = [
      {
        kind: "image" as const,
        key: "stories/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.jpg",
        contentType: "image/jpeg" as const,
      },
    ];
    const row = storyDmInsertRow({
      senderId: "u1",
      conversationId: "conv-1",
      storyId: "s1",
      authorId: "11111111-1111-4111-8111-111111111111",
      expiresAt: "2099-01-01T00:00:00.000Z",
      media,
    });
    expect(row).toEqual({
      sender_id: "u1",
      conversation_id: "conv-1",
      body: "Sent a story",
      media: [
        ...media,
        {
          kind: "story-share",
          storyId: "s1",
          authorId: "11111111-1111-4111-8111-111111111111",
          expiresAt: "2099-01-01T00:00:00.000Z",
        },
      ],
      status: "active",
    });
    expect(row.body).toBe(SOCIAL.dms.sentStory);
    expect(JSON.stringify(row)).not.toMatch(/\/social\/stories|https?:/);
  });

  it("freezes advance while the send sheet is open and resumes the same rules after", () => {
    expect(storyAdvanceWhileSending(true, "auto", false)).toBe(false);
    expect(storyAdvanceWhileSending(true, "manual", false)).toBe(false);
    expect(storyAdvanceWhileSending(false, "auto", true)).toBe(false);
    expect(storyAdvanceWhileSending(false, "auto", false)).toBe(true);
    expect(storyAdvanceWhileSending(false, "manual", true)).toBe(true);
  });

  it("toasts for 2000ms only after the sheet will close", () => {
    expect(STORY_SEND_TOAST_MS).toBe(2000);
    expect(storySendToast({})).toEqual({ show: true, ms: 2000 });
    expect(storySendToast({ error: "Could not send this story." })).toEqual({ show: false, ms: 0 });
    expect(storySendToast(undefined)).toEqual({ show: false, ms: 0 });
    expect(storySendToast(null)).toEqual({ show: false, ms: 0 });
  });
});

describe("story item likes migration", () => {
  it("adds the enum label before any policy uses it, and does not drop likes", () => {
    const add = readFileSync("supabase/migrations/20260924120000_like_target_story_item.sql", "utf8");
    const use = readFileSync("supabase/migrations/20260924120100_story_item_likes.sql", "utf8");
    expect(add).toContain("add value if not exists 'story_item'");
    expect(add).not.toContain("create policy");
    expect(add).toContain("do NOT apply");
    expect(use).toContain("likes_insert_story_item");
    expect(use).toContain("like_count");
    expect(use).toContain("comment likes are not in this slice");
    expect(use).toContain("do NOT apply");
    expect(use).not.toMatch(/^\s*drop table/im);
    const policy = use.slice(use.indexOf("create policy likes_insert_story_item"), use.indexOf("do $$"));
    expect(policy).not.toContain("is_gc_staff");
  });
});
