import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { probeRange } from "@/lib/list-bounds";
import {
  SOCIAL_DM_INBOX_LIMIT,
  SOCIAL_DM_ROOM_LIMIT,
  SOCIAL_DM_THREAD_LIMIT,
  dmThreadKeysetOrFilter,
  encodeDmThreadCursor,
} from "@/lib/social-dm-bounds";
import {
  loadDmInbox,
  loadDmParticipants,
  loadDmThreadMessages,
  type DmMessageRow,
} from "./social-dms";

function message(i: number, createdAt = `2026-09-14T12:00:${String(i).padStart(2, "0")}.000Z`): DmMessageRow {
  return {
    id: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
    body: `m${i}`,
    sender_id: "u1",
    created_at: createdAt,
    status: "active",
  };
}

function feedChain(result: unknown) {
  const c: Record<string, unknown> = {};
  const self = () => c;
  c.select = vi.fn(self);
  c.eq = vi.fn(self);
  c.is = vi.fn(self);
  c.or = vi.fn(self);
  c.order = vi.fn(self);
  c.range = vi.fn(async () => ({ data: result, error: null }));
  return c;
}

describe("loadDmInbox", () => {
  it("probes one past the inbox cap and reports overflow", async () => {
    const rows = Array.from({ length: SOCIAL_DM_INBOX_LIMIT + 1 }, (_, i) => ({
      conversation_id: `c${i}`,
    }));
    const rpc = vi.fn(async () => ({ data: rows, error: null }));
    const page = await loadDmInbox({ rpc } as never);
    expect(rpc).toHaveBeenCalledWith("get_dm_inbox", { p_limit: SOCIAL_DM_INBOX_LIMIT + 1 });
    expect(page.rows).toHaveLength(SOCIAL_DM_INBOX_LIMIT);
    expect(page.truncated).toBe(true);
  });

  it("keeps an exactly-full inbox honest", async () => {
    const rows = Array.from({ length: SOCIAL_DM_INBOX_LIMIT }, (_, i) => ({
      conversation_id: `c${i}`,
    }));
    const page = await loadDmInbox({
      rpc: vi.fn(async () => ({ data: rows, error: null })),
    } as never);
    expect(page.rows).toHaveLength(SOCIAL_DM_INBOX_LIMIT);
    expect(page.truncated).toBe(false);
  });
});

describe("loadDmThreadMessages", () => {
  it("reads newest-first with a documented probe and reverses for display", async () => {
    const newestFirst = [message(2), message(1)];
    const chain = feedChain(newestFirst);
    const page = await loadDmThreadMessages({ from: vi.fn(() => chain) } as never, "c1");
    expect(chain.select).toHaveBeenCalledWith("id, body, sender_id, created_at, status, media");
    expect(chain.eq).toHaveBeenCalledWith("conversation_id", "c1");
    expect(chain.eq).toHaveBeenCalledWith("status", "active");
    expect(chain.or).not.toHaveBeenCalled();
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(chain.order).toHaveBeenCalledWith("id", { ascending: false });
    expect(chain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_DM_THREAD_LIMIT));
    expect(page).toEqual({
      messages: [message(1), message(2)],
      truncated: false,
      nextCursor: null,
    });
  });

  it("applies created_at+id keyset at offset 0", async () => {
    const cursor = {
      createdAt: "2026-09-14T12:00:00.000Z",
      id: "11111111-1111-4111-8111-000000000099",
    };
    const chain = feedChain([]);
    await loadDmThreadMessages({ from: vi.fn(() => chain) } as never, "c1", { cursor });
    expect(chain.or).toHaveBeenCalledWith(dmThreadKeysetOrFilter(cursor));
    expect(chain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_DM_THREAD_LIMIT));
    const range = chain.range as ReturnType<typeof vi.fn>;
    const [from] = range.mock.calls[0] as [number, number];
    expect(from).toBe(0);
  });

  it("drops the probe row and exposes the older-page cursor from the oldest kept row", async () => {
    const rows = Array.from({ length: SOCIAL_DM_THREAD_LIMIT + 1 }, (_, i) => message(i));
    const page = await loadDmThreadMessages({ from: vi.fn(() => feedChain(rows)) } as never, "c1");
    expect(page.truncated).toBe(true);
    expect(page.messages).toHaveLength(SOCIAL_DM_THREAD_LIMIT);
    expect(page.messages[0]?.id).toBe(rows[SOCIAL_DM_THREAD_LIMIT - 1]!.id);
    expect(page.messages.at(-1)?.id).toBe(rows[0]!.id);
    expect(page.nextCursor).toBe(encodeDmThreadCursor(rows[SOCIAL_DM_THREAD_LIMIT - 1]!));
    expect(page.messages.map((row) => row.id)).not.toContain(rows.at(-1)?.id);
  });
});

describe("loadDmParticipants", () => {
  it("probes the room cap for active members only", async () => {
    const rows = Array.from({ length: SOCIAL_DM_ROOM_LIMIT + 1 }, (_, i) => ({
      user_id: `u${i}`,
      left_at: null,
    }));
    const chain = feedChain(rows);
    const page = await loadDmParticipants({ from: vi.fn(() => chain) } as never, "c1");
    expect(chain.eq).toHaveBeenCalledWith("conversation_id", "c1");
    expect(chain.is).toHaveBeenCalledWith("left_at", null);
    expect(chain.range).toHaveBeenCalledWith(...probeRange(SOCIAL_DM_ROOM_LIMIT));
    expect(page.rows).toHaveLength(SOCIAL_DM_ROOM_LIMIT);
    expect(page.truncated).toBe(true);
  });
});

describe("class 6 lock", () => {
  it("keeps DM loaders off Social Home and catalog RPCs", () => {
    const src = readFileSync("src/lib/social-dms.ts", "utf8");
    expect(src).toContain("get_dm_inbox");
    expect(src).toContain("splitProbe");
    expect(src).toContain("probeRange(SOCIAL_DM_THREAD_LIMIT)");
    expect(src).toContain("created_at");
    expect(src).toContain("ascending: false");
    expect(src).not.toContain("rangeFor");
    expect(src).not.toMatch(/offset/i);
    expect(src).not.toContain("my_deliveries");
    expect(src).not.toContain("loadFollowingPosts");
    expect(src).not.toContain("from(\"courses\")");
  });
});
