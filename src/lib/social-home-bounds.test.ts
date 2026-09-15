import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { LIST_PAGE, UNPAGINATED_MAX } from "@/lib/list-bounds";
import {
  SOCIAL_EXPLORE_PEOPLE_LIMIT,
  SOCIAL_EXPLORE_POSTS_LIMIT,
  SOCIAL_FOLLOWEES_LIMIT,
  SOCIAL_FOLLOWING_WALL_CURSOR_PARAM,
  SOCIAL_FOLLOWING_WALL_LIMIT,
  SOCIAL_FOR_YOU_PEOPLE_LIMIT,
  SOCIAL_HOME_CHATS_LIMIT,
  SOCIAL_STORIES_RAIL_LIMIT,
  encodeFollowingWallCursor,
  followingWallKeysetOrFilter,
  parseFollowingWallCursor,
  parseFollowingWallCursorParam,
  quotePostgrestValue,
  socialFollowingWallHref,
} from "./social-home-bounds";

describe("Social Home independent caps", () => {
  it("names followees, wall, stories, and Explore separately under PostgREST max_rows", () => {
    expect(SOCIAL_FOLLOWEES_LIMIT).toBe(UNPAGINATED_MAX);
    expect(SOCIAL_FOLLOWING_WALL_LIMIT).toBe(50);
    expect(SOCIAL_STORIES_RAIL_LIMIT).toBe(80);
    expect(SOCIAL_EXPLORE_PEOPLE_LIMIT).toBe(20);
    expect(SOCIAL_EXPLORE_POSTS_LIMIT).toBe(20);
    expect(SOCIAL_FOR_YOU_PEOPLE_LIMIT).toBe(3);
    expect(SOCIAL_HOME_CHATS_LIMIT).toBe(4);
    expect(SOCIAL_FOLLOWING_WALL_LIMIT).not.toBe(SOCIAL_FOLLOWEES_LIMIT);
    expect(SOCIAL_FOLLOWING_WALL_LIMIT).not.toBe(SOCIAL_STORIES_RAIL_LIMIT);
    expect(SOCIAL_FOLLOWING_WALL_LIMIT).not.toBe(LIST_PAGE);
    expect(SOCIAL_STORIES_RAIL_LIMIT).not.toBe(SOCIAL_FOLLOWEES_LIMIT);
    expect(SOCIAL_FOLLOWEES_LIMIT).toBeLessThan(1000);
    expect(SOCIAL_FOLLOWING_WALL_LIMIT + 1).toBeLessThan(1000);
    expect(SOCIAL_STORIES_RAIL_LIMIT + 1).toBeLessThan(1000);
    expect(SOCIAL_EXPLORE_PEOPLE_LIMIT + 1).toBeLessThan(1000);
    expect(SOCIAL_EXPLORE_POSTS_LIMIT + 1).toBeLessThan(1000);
  });

  it("documents named paths and Mapping C", () => {
    const src = readFileSync("src/lib/social-home-bounds.ts", "utf8");
    expect(src).toContain("ACCESS PATH");
    expect(src).toContain("CARDINALITY");
    expect(src).toContain("Mapping C");
    expect(src).toContain("no org_id");
    expect(src).toContain("created_at+id keyset");
    expect(src).toContain("Home recent chats");
    expect(src).toContain("SOCIAL_HOME_CHATS_LIMIT");
    expect(src).not.toMatch(/org_id on Social/i);
    expect(src).not.toContain("get_dm_inbox");
  });
});

describe("following wall cursor", () => {
  const row = {
    created_at: "2026-09-14T12:00:00.123456+00:00",
    id: "11111111-1111-4111-8111-111111111111",
  };

  it("round-trips created_at+id and rejects junk", () => {
    const encoded = encodeFollowingWallCursor(row);
    expect(encoded).toBe(`${row.created_at}|${row.id}`);
    expect(parseFollowingWallCursor(encoded)).toEqual({
      createdAt: row.created_at,
      id: row.id,
    });
    expect(parseFollowingWallCursor("not-a-cursor")).toBeNull();
    expect(parseFollowingWallCursor(`${row.created_at}|not-a-uuid`)).toBeNull();
    expect(parseFollowingWallCursor(`yesterday|${row.id}`)).toBeNull();
    expect(parseFollowingWallCursorParam([encoded])).toEqual({
      createdAt: row.created_at,
      id: row.id,
    });
    expect(parseFollowingWallCursorParam(undefined)).toBeNull();
  });

  it("builds a quoted keyset OR filter so OFFSET stays 0", () => {
    const cursor = parseFollowingWallCursor(encodeFollowingWallCursor(row));
    expect(cursor).not.toBeNull();
    const filter = followingWallKeysetOrFilter(cursor!);
    expect(filter).toBe(
      `created_at.lt.${quotePostgrestValue(row.created_at)},and(created_at.eq.${quotePostgrestValue(row.created_at)},id.lt.${quotePostgrestValue(row.id)})`,
    );
    expect(filter).toContain(`"${row.created_at}"`);
    expect(filter).not.toMatch(/offset/i);
  });

  it("keeps topic and after on the Home href and resets All", () => {
    expect(socialFollowingWallHref()).toBe("/social");
    expect(socialFollowingWallHref({ topic: "All" })).toBe("/social");
    expect(socialFollowingWallHref({ topic: "Music", after: "c" })).toBe(
      `/social?${"topic"}=music&${SOCIAL_FOLLOWING_WALL_CURSOR_PARAM}=c`,
    );
    expect(socialFollowingWallHref({ after: "c" })).toBe(
      `/social?${SOCIAL_FOLLOWING_WALL_CURSOR_PARAM}=c`,
    );
  });
});
