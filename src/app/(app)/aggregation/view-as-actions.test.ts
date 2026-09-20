import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  }),
}));
vi.mock("@/lib/supabase/context", () => ({ getOrgContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";
import {
  AGGREGATION_VIEW_AS_AUDIT,
  AGGREGATION_VIEW_AS_COOKIE,
} from "@/lib/aggregation-impersonation";
import { DASHBOARD_HREF } from "@/lib/dashboard-admin";

import { startAggregationViewAs, stopAggregationViewAs } from "./view-as-actions";

const ORG_ID = "22222222-2222-4222-8222-222222222222";

function form(orgId: string) {
  const data = new FormData();
  data.set("orgId", orgId);
  return data;
}

function staffCtx(over: Record<string, unknown> = {}) {
  return {
    user: { id: "staff-1", email: "ops@example.com" },
    isGcStaff: true,
    aggregationViewAs: null,
    activeOrg: null,
    ...over,
  };
}

describe("startAggregationViewAs gate", () => {
  const set = vi.fn();
  const insert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({ set, get: vi.fn() } as never);
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({ insert }),
    } as never);
  });

  it("refuses a non-staff caller — no cookie, no audit", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      user: { id: "u1", email: "client@example.com" },
      isGcStaff: false,
    } as never);
    await expect(startAggregationViewAs(form(ORG_ID))).resolves.toBeUndefined();
    expect(createClient).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("refuses a signed-out caller", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(null);
    await expect(startAggregationViewAs(form(ORG_ID))).resolves.toBeUndefined();
    expect(set).not.toHaveBeenCalled();
  });

  it("refuses a missing rights holder", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(staffCtx() as never);
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as never);
    await expect(startAggregationViewAs(form(ORG_ID))).resolves.toBeUndefined();
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });

  it("starts view-as for gc_staff, audits, and enters Aggregation", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(staffCtx() as never);
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: ORG_ID, name: "Acme Films", status: "active" },
              error: null,
            }),
          }),
        }),
      }),
    } as never);
    insert.mockResolvedValue({ error: null });

    await expect(startAggregationViewAs(form(ORG_ID))).rejects.toThrow(
      `REDIRECT:${DASHBOARD_HREF}`,
    );
    expect(insert).toHaveBeenCalledWith({
      org_id: ORG_ID,
      entity: AGGREGATION_VIEW_AS_AUDIT.entity,
      entity_id: ORG_ID,
      action: "start",
      actor: "staff-1",
      after: { org_id: ORG_ID, org_name: "Acme Films" },
    });
    expect(set).toHaveBeenCalledWith(AGGREGATION_VIEW_AS_COOKIE, ORG_ID, {
      httpOnly: true,
      sameSite: "lax",
      path: "/aggregation",
    });
  });

  it("does not set the cookie when the start audit fails", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(staffCtx() as never);
    vi.mocked(createClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { id: ORG_ID, name: "Acme Films", status: "active" },
              error: null,
            }),
          }),
        }),
      }),
    } as never);
    insert.mockResolvedValue({ error: { message: "denied" } });

    await expect(startAggregationViewAs(form(ORG_ID))).resolves.toBeUndefined();
    expect(set).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("stopAggregationViewAs exit", () => {
  const set = vi.fn();
  const get = vi.fn();
  const insert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    get.mockReturnValue({ value: ORG_ID });
    vi.mocked(cookies).mockResolvedValue({ set, get } as never);
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({ insert }),
    } as never);
    insert.mockResolvedValue({ error: null });
  });

  it("refuses a non-staff caller — cookie stays, no audit", async () => {
    vi.mocked(getOrgContext).mockResolvedValue({
      user: { id: "u1" },
      isGcStaff: false,
      aggregationViewAs: { orgId: ORG_ID, orgName: "Acme Films" },
    } as never);
    await expect(stopAggregationViewAs()).resolves.toBeUndefined();
    expect(set).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("clears the cookie, audits end, and returns to Staff", async () => {
    vi.mocked(getOrgContext).mockResolvedValue(
      staffCtx({
        aggregationViewAs: { orgId: ORG_ID, orgName: "Acme Films" },
        activeOrg: { id: ORG_ID, name: "Acme Films", status: "active" },
      }) as never,
    );

    await expect(stopAggregationViewAs()).rejects.toThrow("REDIRECT:/staff/queue");
    expect(set).toHaveBeenCalledWith(AGGREGATION_VIEW_AS_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/aggregation",
      maxAge: 0,
    });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: ORG_ID,
        action: "end",
        actor: "staff-1",
        after: { org_id: ORG_ID, org_name: "Acme Films" },
      }),
    );
  });
});
