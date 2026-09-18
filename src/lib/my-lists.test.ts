import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DETAIL_LIST, UNPAGINATED_MAX } from "@/lib/list-bounds";
import {
  MY_LIST_HARD_MAX,
  MY_LIST_LIMIT,
  MY_TITLE_DELIVERIES_LIMIT,
  loadMyDeliveries,
  loadMyFindings,
  loadMyNotifications,
} from "./my-lists";

const TITLE_ID = "11111111-1111-4111-8111-111111111111";
const DELIVERY_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function deliveryRow(i: number) {
  return {
    delivery_id: i === 0 ? DELIVERY_ID : `bbbbbbbb-bbbb-4bbb-8bbb-${String(i).padStart(12, "0")}`,
    title_id: TITLE_ID,
    title: "Winter Light",
    vendor_name: "Endpoint",
    territory: "US",
    status: "live",
    updated_at: "2026-09-01T00:00:00.000Z",
  };
}

function stubRpc(data: unknown) {
  const rpc = vi.fn(async () => ({ data, error: null }));
  return { rpc, client: { rpc } as never };
}

describe("my_* list bounds", () => {
  it("uses the catalog probe ceiling, not PostgREST max_rows", () => {
    expect(MY_LIST_LIMIT).toBe(UNPAGINATED_MAX);
    expect(MY_LIST_HARD_MAX).toBe(UNPAGINATED_MAX + 1);
    expect(MY_LIST_HARD_MAX).toBeLessThan(1000);
    expect(MY_TITLE_DELIVERIES_LIMIT).toBe(DETAIL_LIST);
  });
});

describe("loadMyDeliveries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("probes one past the cap and omits p_title_id on the browse path", async () => {
    const { rpc, client } = stubRpc([deliveryRow(0)]);
    const out = await loadMyDeliveries(client);
    expect(rpc).toHaveBeenCalledWith("my_deliveries", { p_limit: UNPAGINATED_MAX + 1 });
    expect(out).toEqual({ rows: [deliveryRow(0)], truncated: false });
  });

  it("scopes the title path and probes DETAIL_LIST + 1", async () => {
    const { rpc, client } = stubRpc([deliveryRow(0)]);
    const out = await loadMyDeliveries(client, { titleId: TITLE_ID, limit: DETAIL_LIST });
    expect(rpc).toHaveBeenCalledWith("my_deliveries", {
      p_limit: DETAIL_LIST + 1,
      p_title_id: TITLE_ID,
    });
    expect(out.truncated).toBe(false);
    expect(out.rows).toHaveLength(1);
  });

  it("marks overflow as truncated and drops the probe row", async () => {
    const rows = Array.from({ length: UNPAGINATED_MAX + 1 }, (_, i) => deliveryRow(i));
    const { client } = stubRpc(rows);
    const out = await loadMyDeliveries(client);
    expect(out.truncated).toBe(true);
    expect(out.rows).toHaveLength(UNPAGINATED_MAX);
  });

  it("keeps an exactly-full page honest — not truncated", async () => {
    const rows = Array.from({ length: UNPAGINATED_MAX }, (_, i) => deliveryRow(i));
    const { client } = stubRpc(rows);
    const out = await loadMyDeliveries(client);
    expect(out.truncated).toBe(false);
    expect(out.rows).toHaveLength(UNPAGINATED_MAX);
  });
});

describe("loadMyFindings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("probes one past the cap and omits p_org_id on the GC-wide path", async () => {
    const { rpc, client } = stubRpc([{ id: "f1", org_id: "org-1" }]);
    await loadMyFindings(client);
    expect(rpc).toHaveBeenCalledWith("my_findings", { p_limit: UNPAGINATED_MAX + 1 });
  });

  it("scopes a client org and probes UNPAGINATED_MAX + 1", async () => {
    const { rpc, client } = stubRpc([{ id: "f1", org_id: "org-1" }]);
    await loadMyFindings(client, { orgId: "org-1" });
    expect(rpc).toHaveBeenCalledWith("my_findings", {
      p_limit: UNPAGINATED_MAX + 1,
      p_org_id: "org-1",
    });
  });

  it("reports truncated when the extra row came back", async () => {
    const rows = Array.from({ length: UNPAGINATED_MAX + 1 }, (_, i) => ({ id: `f${i}` }));
    const { client } = stubRpc(rows);
    const out = await loadMyFindings(client);
    expect(out.truncated).toBe(true);
    expect(out.rows).toHaveLength(UNPAGINATED_MAX);
  });
});

describe("loadMyNotifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("probes one past the cap", async () => {
    const { rpc, client } = stubRpc([]);
    const out = await loadMyNotifications(client);
    expect(rpc).toHaveBeenCalledWith("my_notifications", { p_limit: UNPAGINATED_MAX + 1 });
    expect(out).toEqual({ rows: [], truncated: false });
  });
});

describe("class 4 migration lock", () => {
  const migration = readFileSync("supabase/migrations/20260914310000_bound_my_rpcs.sql", "utf8");

  it("bounds the three list RPCs and leaves my_unread_count a scalar", () => {
    expect(migration).toContain("INTENT: Remediation class 4");
    expect(migration).toContain("ACCESS PATH");
    expect(migration).toContain("MAPPING C");
    expect(migration).toContain("drop function if exists public.my_deliveries()");
    expect(migration).toContain("drop function if exists public.my_findings()");
    expect(migration).toContain("drop function if exists public.my_notifications()");
    expect(migration).toContain("p_limit integer default 500");
    expect(migration).toContain("p_title_id uuid default null");
    expect(migration).toContain("p_org_id uuid default null");
    expect(migration).toContain("limit least(greatest(coalesce(p_limit, 0), 0), 501)");
    expect(migration).toContain("do NOT apply to production");
    expect(migration).toContain("Do not add profile_id");
    expect(migration).not.toMatch(/create function public\.my_unread_count/i);
    expect(migration).not.toMatch(/\bprofile_id\s+uuid\b/i);
    expect(migration).not.toMatch(/from public\.(posts|stories|direct_messages)/i);
    expect(MY_LIST_HARD_MAX).toBe(501);
  });
});
