import { beforeEach, describe, expect, it, vi } from "vitest";

import { UNPAGINATED_MAX, probeRange } from "@/lib/list-bounds";
import {
  GC_DELIVERIES_COMPANION_LIMIT,
  loadGcDeliveryCompanions,
  portalCompanionsTruncated,
  uniqueIds,
} from "./gc-deliveries-companions";

type Chain = {
  select: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  then: (resolve: (value: { data: unknown[]; error: null }) => unknown) => unknown;
};

function makeChain(rows: unknown[]): Chain {
  const chain = {} as Chain;
  chain.select = vi.fn(() => chain);
  chain.is = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.then = (resolve) => resolve({ data: rows, error: null });
  return chain;
}

function stubClient(tables: Record<string, unknown[]>) {
  const chains: Record<string, Chain> = {};
  const from = vi.fn((table: string) => {
    const chain = makeChain(tables[table] ?? []);
    chains[table] = chain;
    return chain;
  });
  return { from, chains, client: { from } as never };
}

describe("uniqueIds", () => {
  it("drops blanks and duplicates while keeping first-seen order", () => {
    expect(uniqueIds(["b", "a", "b", null, "", "c", undefined])).toEqual(["b", "a", "c"]);
  });
});

describe("loadGcDeliveryCompanions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the catalog probe ceiling, not PostgREST max_rows", () => {
    expect(GC_DELIVERIES_COMPANION_LIMIT).toBe(UNPAGINATED_MAX);
    expect(GC_DELIVERIES_COMPANION_LIMIT).toBeLessThan(1000);
    expect(probeRange(GC_DELIVERIES_COMPANION_LIMIT)).toEqual([0, UNPAGINATED_MAX]);
  });

  it("skips companion tables when there are no parent ids — never an empty IN or an unbounded read", async () => {
    const { from, client } = stubClient({});
    const out = await loadGcDeliveryCompanions(client, {
      formTitleIds: [],
      pageTitleIds: [],
      pageDeliveryIds: [],
    });

    expect(from).not.toHaveBeenCalled();
    expect(out.grants).toEqual({ rows: [], truncated: false });
    expect(out.masters).toEqual({ rows: [], truncated: false });
    expect(out.links).toEqual({ rows: [], truncated: false });
    expect(out.sessions).toEqual({ rows: [], truncated: false });
    expect(out.events).toEqual({ rows: [], truncated: false });
    expect(portalCompanionsTruncated(out)).toBe(false);
  });

  it("scopes each companion to the page/picker ids and probes one past the cap", async () => {
    const { from, chains, client } = stubClient({
      rights_grants: [{ id: "g1", title_id: "t-form", rights_type: "avod", territory_mode: "world", territories: [] }],
      assets: [{ id: "a1", title_id: "t-page", original_filename: "master.mov", bytes: 12 }],
      portal_links: [
        {
          id: "l1",
          delivery_id: "d1",
          asset_id: "a1",
          expires_at: "2026-09-01T00:00:00Z",
          revoked_at: null,
        },
      ],
      portal_sessions: [],
      portal_access_events: [],
    });

    await loadGcDeliveryCompanions(client, {
      formTitleIds: ["t-form", "t-form"],
      pageTitleIds: ["t-page"],
      pageDeliveryIds: ["d1"],
    });

    expect(from).toHaveBeenCalledWith("rights_grants");
    expect(from).toHaveBeenCalledWith("assets");
    expect(from).toHaveBeenCalledWith("portal_links");
    expect(chains.rights_grants.in).toHaveBeenCalledWith("title_id", ["t-form"]);
    expect(chains.rights_grants.is).toHaveBeenCalledWith("effective_to", null);
    expect(chains.rights_grants.range).toHaveBeenCalledWith(...probeRange(UNPAGINATED_MAX));
    expect(chains.assets.eq).toHaveBeenCalledWith("kind", "master");
    expect(chains.assets.in).toHaveBeenCalledWith("title_id", ["t-page"]);
    expect(chains.assets.range).toHaveBeenCalledWith(...probeRange(UNPAGINATED_MAX));
    expect(chains.portal_links.eq).toHaveBeenCalledWith("purpose", "master_download");
    expect(chains.portal_links.in).toHaveBeenCalledWith("delivery_id", ["d1"]);
    expect(chains.portal_links.range).toHaveBeenCalledWith(...probeRange(UNPAGINATED_MAX));
    expect(chains.portal_sessions.in).toHaveBeenCalledWith("link_id", ["l1"]);
    expect(chains.portal_sessions.range).toHaveBeenCalledWith(...probeRange(UNPAGINATED_MAX));
    expect(chains.portal_access_events.in).toHaveBeenCalledWith("link_id", ["l1"]);
    expect(chains.portal_access_events.range).toHaveBeenCalledWith(...probeRange(UNPAGINATED_MAX));
  });

  it("does not read sessions or events when the scoped link list is empty", async () => {
    const { from, client } = stubClient({
      rights_grants: [],
      assets: [],
      portal_links: [],
    });

    await loadGcDeliveryCompanions(client, {
      formTitleIds: ["t-form"],
      pageTitleIds: ["t-page"],
      pageDeliveryIds: ["d1"],
    });

    expect(from).toHaveBeenCalledWith("rights_grants");
    expect(from).toHaveBeenCalledWith("assets");
    expect(from).toHaveBeenCalledWith("portal_links");
    expect(from).not.toHaveBeenCalledWith("portal_sessions");
    expect(from).not.toHaveBeenCalledWith("portal_access_events");
  });

  it("refuses to treat a full probe page as complete", async () => {
    const extra = Array.from({ length: UNPAGINATED_MAX + 1 }, (_, i) => ({
      id: `g-${i}`,
      title_id: "t-form",
      rights_type: "avod",
      territory_mode: "world",
      territories: [],
    }));
    const { client } = stubClient({ rights_grants: extra });

    const out = await loadGcDeliveryCompanions(client, {
      formTitleIds: ["t-form"],
      pageTitleIds: [],
      pageDeliveryIds: [],
    });

    expect(out.grants.rows).toHaveLength(UNPAGINATED_MAX);
    expect(out.grants.truncated).toBe(true);
    expect(out.grants.rows[UNPAGINATED_MAX - 1]?.id).toBe(`g-${UNPAGINATED_MAX - 1}`);
    expect(out.grants.rows.some((row) => row.id === `g-${UNPAGINATED_MAX}`)).toBe(false);
  });

  it("keeps an exactly-full page honest — not truncated", async () => {
    const exact = Array.from({ length: UNPAGINATED_MAX }, (_, i) => ({
      id: `e-${i}`,
      link_id: "l1",
      event_type: "download",
      email: null,
      company: null,
      occurred_at: "2026-09-01T00:00:00Z",
    }));
    const { client } = stubClient({
      portal_links: [
        {
          id: "l1",
          delivery_id: "d1",
          asset_id: "a1",
          expires_at: "2026-09-01T00:00:00Z",
          revoked_at: null,
        },
      ],
      portal_access_events: exact,
    });

    const out = await loadGcDeliveryCompanions(client, {
      formTitleIds: [],
      pageTitleIds: [],
      pageDeliveryIds: ["d1"],
    });

    expect(out.events.rows).toHaveLength(UNPAGINATED_MAX);
    expect(out.events.truncated).toBe(false);
    expect(portalCompanionsTruncated(out)).toBe(false);
  });

  it("marks portal companions truncated when any child list overflows", async () => {
    const overflow = Array.from({ length: UNPAGINATED_MAX + 1 }, (_, i) => ({
      id: `s-${i}`,
      link_id: "l1",
      name: "A",
      company: "B",
      email: "a@example.com",
      expires_at: "2026-09-01T00:00:00Z",
      revoked_at: null,
    }));
    const { client } = stubClient({
      portal_links: [
        {
          id: "l1",
          delivery_id: "d1",
          asset_id: "a1",
          expires_at: "2026-09-01T00:00:00Z",
          revoked_at: null,
        },
      ],
      portal_sessions: overflow,
    });

    const out = await loadGcDeliveryCompanions(client, {
      formTitleIds: [],
      pageTitleIds: [],
      pageDeliveryIds: ["d1"],
    });

    expect(out.sessions.truncated).toBe(true);
    expect(out.sessions.rows).toHaveLength(UNPAGINATED_MAX);
    expect(portalCompanionsTruncated(out)).toBe(true);
  });
});
