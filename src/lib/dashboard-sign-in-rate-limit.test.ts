import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DASHBOARD_SIGN_IN_RATE,
  DashboardSignInRateLimitError,
  assertDashboardSignInAllowed,
  clientIpFromForwarded,
  normalizeDashboardSignInEmail,
} from "./dashboard-sign-in-rate-limit";

const EMAIL = "jane@acmefilms.com";
const IP = "203.0.113.10";

function thenableQuery(result: { count: number | null; error: { message: string } | null }) {
  const query = {
    eq: vi.fn(),
    gte: vi.fn(),
    then: (resolve: (value: typeof result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  query.eq.mockReturnValue(query);
  query.gte.mockReturnValue(query);
  return query;
}

function fakeAdmin(opts: {
  counts?: Array<number | { count?: number | null; error?: { message: string } | null }>;
  insertError?: { message: string } | null;
} = {}) {
  const queue = [...(opts.counts ?? [0, 0, 0, 0])];
  const select = vi.fn(() => {
    const next = queue.shift() ?? 0;
    if (typeof next === "number") return thenableQuery({ count: next, error: null });
    return thenableQuery({
      count: next.count ?? null,
      error: next.error ?? null,
    });
  });
  const insert = vi.fn(async () => ({ error: opts.insertError ?? null }));
  const from = vi.fn(() => ({ select, insert }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<
    typeof createAdminClient
  >);
  return { from, select, insert };
}

describe("normalizeDashboardSignInEmail / clientIpFromForwarded", () => {
  it("lowercases and trims the rate-limit email key", () => {
    expect(normalizeDashboardSignInEmail("  Jane@AcmeFilms.com ")).toBe(EMAIL);
  });

  it("takes the first forwarded hop and rejects empty or oversized values", () => {
    expect(clientIpFromForwarded("203.0.113.10, 10.0.0.1")).toBe(IP);
    expect(clientIpFromForwarded("   ")).toBeNull();
    expect(clientIpFromForwarded(null)).toBeNull();
    expect(clientIpFromForwarded("x".repeat(46))).toBeNull();
  });
});

describe("assertDashboardSignInAllowed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a normalized row when every cap is under the limit", async () => {
    const { from, insert } = fakeAdmin({ counts: [0, 0, 0, 0] });
    await assertDashboardSignInAllowed({ email: " Jane@AcmeFilms.com ", ip: IP });
    expect(from).toHaveBeenCalledWith("dashboard_sign_in_requests");
    expect(insert).toHaveBeenCalledWith({ email_normalized: EMAIL, ip: IP });
  });

  it("enforces a per-email cooldown before minting", async () => {
    const { insert } = fakeAdmin({ counts: [1] });
    await expect(assertDashboardSignInAllowed({ email: EMAIL, ip: IP })).rejects.toMatchObject({
      name: "DashboardSignInRateLimitError",
      scope: "email-cooldown",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("enforces the per-email hourly cap", async () => {
    const { insert } = fakeAdmin({ counts: [0, DASHBOARD_SIGN_IN_RATE.perEmailPerHour] });
    await expect(assertDashboardSignInAllowed({ email: EMAIL, ip: IP })).rejects.toBeInstanceOf(
      DashboardSignInRateLimitError,
    );
    expect(insert).not.toHaveBeenCalled();
  });

  it("enforces the per-IP hourly cap", async () => {
    const { insert } = fakeAdmin({
      counts: [0, 0, DASHBOARD_SIGN_IN_RATE.perIpPerHour],
    });
    await expect(assertDashboardSignInAllowed({ email: EMAIL, ip: IP })).rejects.toMatchObject({
      scope: "ip",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("enforces the coarse global hourly cap", async () => {
    const { insert } = fakeAdmin({
      counts: [0, 0, 0, DASHBOARD_SIGN_IN_RATE.globalPerHour],
    });
    await expect(assertDashboardSignInAllowed({ email: EMAIL, ip: IP })).rejects.toMatchObject({
      scope: "global",
    });
    expect(insert).not.toHaveBeenCalled();
  });

  it("skips the IP cap when no client address is available", async () => {
    const { insert } = fakeAdmin({ counts: [0, 0, 0] });
    await assertDashboardSignInAllowed({ email: EMAIL, ip: null });
    expect(insert).toHaveBeenCalledWith({ email_normalized: EMAIL, ip: null });
  });

  it("fails open when the store cannot be read so login stays unblocked", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { insert } = fakeAdmin({
      counts: [{ error: { message: "relation does not exist" } }],
    });
    await expect(assertDashboardSignInAllowed({ email: EMAIL, ip: IP })).resolves.toBeUndefined();
    expect(insert).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("fails open on insert error after the caps pass", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => undefined);
    fakeAdmin({ insertError: { message: "permission denied" } });
    await expect(assertDashboardSignInAllowed({ email: EMAIL, ip: IP })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
