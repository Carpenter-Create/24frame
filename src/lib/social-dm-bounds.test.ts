import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { LIST_PAGE, UNPAGINATED_MAX } from "@/lib/list-bounds";
import { quotePostgrestValue } from "@/lib/social-home-bounds";
import {
  SOCIAL_DM_ADD_BATCH_LIMIT,
  SOCIAL_DM_FANOUT_BATCH,
  SOCIAL_DM_INBOX_LIMIT,
  SOCIAL_DM_ROOM_LIMIT,
  SOCIAL_DM_THREAD_CURSOR_PARAM,
  SOCIAL_DM_THREAD_LIMIT,
  dmThreadKeysetOrFilter,
  encodeDmThreadCursor,
  parseDmThreadCursor,
  parseDmThreadCursorParam,
  socialDmThreadHref,
} from "./social-dm-bounds";

describe("DM independent caps", () => {
  it("names room, batch, fan-out, inbox, and thread separately under PostgREST max_rows", () => {
    expect(SOCIAL_DM_ROOM_LIMIT).toBe(16);
    expect(SOCIAL_DM_ADD_BATCH_LIMIT).toBe(16);
    expect(SOCIAL_DM_FANOUT_BATCH).toBe(32);
    expect(SOCIAL_DM_INBOX_LIMIT).toBe(50);
    expect(SOCIAL_DM_THREAD_LIMIT).toBe(50);
    expect(SOCIAL_DM_ROOM_LIMIT).not.toBe(SOCIAL_DM_INBOX_LIMIT);
    expect(SOCIAL_DM_THREAD_LIMIT).not.toBe(LIST_PAGE);
    expect(SOCIAL_DM_INBOX_LIMIT).not.toBe(UNPAGINATED_MAX);
    expect(SOCIAL_DM_ROOM_LIMIT + 1).toBeLessThan(1000);
    expect(SOCIAL_DM_INBOX_LIMIT + 1).toBeLessThan(1000);
    expect(SOCIAL_DM_THREAD_LIMIT + 1).toBeLessThan(1000);
  });

  it("documents named paths, Mapping C, and iMessage rooms", () => {
    const src = readFileSync("src/lib/social-dm-bounds.ts", "utf8");
    expect(src).toContain("ACCESS PATH");
    expect(src).toContain("CARDINALITY");
    expect(src).toContain("Mapping C");
    expect(src).toContain("no org_id");
    expect(src).toContain("iMessage");
    expect(src).toContain("created_at+id keyset");
    expect(src).toContain("SOCIAL_DM_FANOUT_BATCH");
    expect(src).not.toMatch(/org_id uuid/i);
    expect(src).not.toContain("my_deliveries");
    expect(src).not.toContain("loadFollowingPosts");
    expect(src).not.toContain("has_course_access");
  });

  it("keeps SQL caps in lockstep with the named constants", () => {
    const sql = readFileSync("supabase/migrations/20260914420000_dm_fanout_caps.sql", "utf8");
    expect(sql).toContain("INTENT: Remediation class 6");
    expect(sql).toContain("ACCESS PATH");
    expect(sql).toContain("CARDINALITY");
    expect(sql).toContain("MAPPING C");
    expect(sql).toContain("limit 32");
    expect(sql).toContain(", 51)");
    expect(sql).toContain("too many participants in one add");
    expect(sql).toContain("room is full");
    expect(sql).toContain("no org_id");
    expect(sql).not.toMatch(/is_gc_staff\s*\(/);
    expect(sql).not.toContain("org_id uuid");
  });
});

describe("DM thread cursor", () => {
  const row = {
    created_at: "2026-09-14T12:00:00.123456+00:00",
    id: "11111111-1111-4111-8111-111111111111",
  };

  it("round-trips created_at+id and rejects junk", () => {
    const encoded = encodeDmThreadCursor(row);
    expect(encoded).toBe(`${row.created_at}|${row.id}`);
    expect(parseDmThreadCursor(encoded)).toEqual({
      createdAt: row.created_at,
      id: row.id,
    });
    expect(parseDmThreadCursor("not-a-cursor")).toBeNull();
    expect(parseDmThreadCursor(`${row.created_at}|not-a-uuid`)).toBeNull();
    expect(parseDmThreadCursor(`yesterday|${row.id}`)).toBeNull();
    expect(parseDmThreadCursorParam([encoded])).toEqual({
      createdAt: row.created_at,
      id: row.id,
    });
    expect(parseDmThreadCursorParam(undefined)).toBeNull();
  });

  it("builds a quoted keyset OR filter so OFFSET stays 0", () => {
    const cursor = parseDmThreadCursor(encodeDmThreadCursor(row));
    expect(cursor).not.toBeNull();
    const filter = dmThreadKeysetOrFilter(cursor!);
    expect(filter).toBe(
      `created_at.lt.${quotePostgrestValue(row.created_at)},and(created_at.eq.${quotePostgrestValue(row.created_at)},id.lt.${quotePostgrestValue(row.id)})`,
    );
    expect(filter).toContain(`"${row.created_at}"`);
    expect(filter).not.toMatch(/offset/i);
  });

  it("keeps before on the thread href", () => {
    expect(socialDmThreadHref("c1")).toBe("/social/dms/c1");
    expect(socialDmThreadHref("c1", { before: "c" })).toBe(
      `/social/dms/c1?${SOCIAL_DM_THREAD_CURSOR_PARAM}=c`,
    );
  });
});
