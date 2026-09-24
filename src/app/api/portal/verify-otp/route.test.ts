import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import { PORTAL, hashOtp, hashToken } from "@/lib/portal";
import { POST } from "./route";

const TOKEN = "link-token";
const LINK_ID = "link-1";
const OTP_ID = "otp-1";
const EMAIL = "buyer@example.test";
const CODE = "123456";

type OtpRow = {
  id: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
  consumed_at: string | null;
  link_id: string;
  email: string;
  created_at: string;
};

type UpdateCall = { table: string; patch: Record<string, unknown> };

type Store = {
  otp: OtpRow;
  sessions: Record<string, unknown>[];
  events: Record<string, unknown>[];
  updates: UpdateCall[];
  claims: Array<{ p_otp_id: string; p_max_attempts: number }>;
};

function request(code: string, email = EMAIL) {
  return new Request("http://test/api/portal/verify-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: TOKEN, email, code }),
  });
}

function makeStore(attempts: number): Store {
  return {
    otp: {
      id: OTP_ID,
      code_hash: hashOtp(CODE, LINK_ID),
      expires_at: new Date(Date.now() + 60_000).toISOString(),
      attempts,
      consumed_at: null,
      link_id: LINK_ID,
      email: EMAIL,
      created_at: new Date().toISOString(),
    },
    sessions: [],
    events: [],
    updates: [],
    claims: [],
  };
}

// Models portal_claim_otp_attempt: one conditional increment at a time.
// A second caller waits, then sees the committed count — the same rule as
// UPDATE ... SET attempts = attempts + 1 WHERE attempts < cap.
function install(
  store: Store,
  opts: { claimError?: { message: string }; claimOverride?: number | null } = {},
) {
  let tail: Promise<void> = Promise.resolve();

  function claim(otpId: string, maxAttempts: number): Promise<{ data: number | null; error: null }> {
    const run = tail.then(() => {
      const row = store.otp.id === otpId ? store.otp : null;
      if (!row || row.consumed_at || row.attempts >= maxAttempts) {
        return { data: null, error: null as null };
      }
      row.attempts += 1;
      return { data: row.attempts, error: null as null };
    });
    tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  const from = (table: string) => {
    const filters: Array<{ op: "eq" | "is"; col: string; val: unknown }> = [];
    const api = {
      select() {
        return api;
      },
      eq(col: string, val: unknown) {
        filters.push({ op: "eq", col, val });
        return api;
      },
      is(col: string, val: unknown) {
        filters.push({ op: "is", col, val });
        return api;
      },
      order() {
        return api;
      },
      limit() {
        return api;
      },
      async maybeSingle() {
        if (table === "portal_links") {
          const tokenHash = filters.find((f) => f.col === "token_hash")?.val;
          if (tokenHash !== hashToken(TOKEN)) return { data: null, error: null };
          return {
            data: {
              id: LINK_ID,
              expires_at: new Date(Date.now() + 86_400_000).toISOString(),
              revoked_at: null,
            },
            error: null,
          };
        }
        if (table === "portal_otps") {
          const email = filters.find((f) => f.col === "email")?.val;
          const linkId = filters.find((f) => f.col === "link_id")?.val;
          const open = filters.some((f) => f.op === "is" && f.col === "consumed_at" && f.val === null);
          if (open && store.otp.consumed_at) return { data: null, error: null };
          if (email !== store.otp.email || linkId !== store.otp.link_id) return { data: null, error: null };
          return { data: { ...store.otp }, error: null };
        }
        if (table === "portal_access_events") return { data: null, error: null };
        throw new Error(`unexpected maybeSingle on ${table}`);
      },
      update(patch: Record<string, unknown>) {
        let applied = false;
        const apply = () => {
          if (applied) return { data: null, error: null };
          applied = true;
          store.updates.push({ table, patch });
          if (table === "portal_otps" && store.otp.id === filters.find((f) => f.col === "id")?.val) {
            if (typeof patch.attempts === "number") store.otp.attempts = patch.attempts;
            if (typeof patch.consumed_at === "string") store.otp.consumed_at = patch.consumed_at;
          }
          return { data: null, error: null };
        };
        const chain = {
          eq(col: string, val: unknown) {
            filters.push({ op: "eq" as const, col, val });
            return chain;
          },
          then(
            resolve: (value: { data: null; error: null }) => unknown,
            reject?: (reason: unknown) => unknown,
          ) {
            return Promise.resolve(apply()).then(resolve, reject);
          },
        };
        return chain;
      },
      insert(row: Record<string, unknown>) {
        if (table === "portal_sessions") {
          store.sessions.push(row);
          return {
            select() {
              return {
                single: async () => ({ data: { id: "session-1" }, error: null }),
              };
            },
          };
        }
        if (table === "portal_access_events") {
          store.events.push(row);
          return Promise.resolve({ data: null, error: null });
        }
        throw new Error(`unexpected insert on ${table}`);
      },
    };
    return api;
  };

  const rpc = vi.fn(async (name: string, args: { p_otp_id: string; p_max_attempts: number }) => {
    if (name !== "portal_claim_otp_attempt") {
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    }
    store.claims.push(args);
    if (opts.claimError) return { data: null, error: opts.claimError };
    if (opts.claimOverride !== undefined) return { data: opts.claimOverride, error: null };
    return claim(args.p_otp_id, args.p_max_attempts);
  });

  vi.mocked(createAdminClient).mockReturnValue({ from, rpc } as unknown as ReturnType<typeof createAdminClient>);
  return { rpc };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/portal/verify-otp attempt cap", () => {
  it("rejects when the conditional claim changes no row, even if the code is correct", async () => {
    const store = makeStore(PORTAL.otpMaxAttempts);
    install(store);

    const res = await POST(request(CODE));

    expect(res.status).toBe(429);
    expect(store.otp.attempts).toBe(PORTAL.otpMaxAttempts);
    expect(store.otp.consumed_at).toBeNull();
    expect(store.sessions).toHaveLength(0);
    expect(store.claims).toEqual([{ p_otp_id: OTP_ID, p_max_attempts: PORTAL.otpMaxAttempts }]);
  });

  it("does not open a session when the claim errors", async () => {
    const store = makeStore(0);
    install(store, { claimError: { message: "db down" } });

    const res = await POST(request(CODE));

    expect(res.status).toBe(500);
    expect(store.sessions).toHaveLength(0);
    expect(store.otp.consumed_at).toBeNull();
    expect(store.otp.attempts).toBe(0);
  });

  it("rejects a claim result above the cap without opening a session", async () => {
    const store = makeStore(0);
    install(store, { claimOverride: PORTAL.otpMaxAttempts + 1 });

    const res = await POST(request(CODE));

    expect(res.status).toBe(429);
    expect(store.sessions).toHaveLength(0);
  });

  it("verifies a correct code after one successful claim", async () => {
    const store = makeStore(0);
    install(store);

    const res = await POST(request(CODE));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("set-cookie")).toContain(`${PORTAL.sessionCookie}=`);
    expect(store.otp.attempts).toBe(1);
    expect(store.otp.consumed_at).not.toBeNull();
    expect(store.sessions).toHaveLength(1);
    expect(store.updates.some((u) => "attempts" in u.patch)).toBe(false);
  });

  it("a double-submit on the last slot lets one compare and rejects the other", async () => {
    const store = makeStore(PORTAL.otpMaxAttempts - 1);
    install(store);

    const [a, b] = await Promise.all([POST(request("000000")), POST(request("000000"))]);
    const statuses = [a.status, b.status].sort();

    expect(statuses).toEqual([400, 429]);
    expect(store.otp.attempts).toBe(PORTAL.otpMaxAttempts);
    expect(store.sessions).toHaveLength(0);
    expect(store.updates.some((u) => "attempts" in u.patch)).toBe(false);
    expect(store.claims).toHaveLength(2);
  });

  it("concurrent wrong codes cannot push attempts past the cap", async () => {
    const store = makeStore(0);
    install(store);
    const extra = 3;

    const results = await Promise.all(
      Array.from({ length: PORTAL.otpMaxAttempts + extra }, () => POST(request("000000"))),
    );
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((status) => status === 400)).toHaveLength(PORTAL.otpMaxAttempts);
    expect(statuses.filter((status) => status === 429)).toHaveLength(extra);
    expect(store.otp.attempts).toBe(PORTAL.otpMaxAttempts);
    expect(store.sessions).toHaveLength(0);
  });

  it("pins the claim to one conditional update and the existing cap constant", () => {
    const route = readFileSync(join(process.cwd(), "src/app/api/portal/verify-otp/route.ts"), "utf8");
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260924000100_portal_claim_otp_attempt.sql"),
      "utf8",
    );

    expect(route).toContain('rpc("portal_claim_otp_attempt"');
    expect(route).toContain("p_max_attempts: PORTAL.otpMaxAttempts");
    expect(route).not.toContain("attempts + 1");
    expect(route).not.toMatch(/update\(\s*\{[^}]*attempts/);

    expect(sql).toContain("set attempts = attempts + 1");
    expect(sql).toMatch(
      /where id = p_otp_id\s+and consumed_at is null\s+and attempts < p_max_attempts\s+returning attempts into v_attempts;/,
    );
    expect(sql).not.toMatch(/attempts\s*<\s*5/);
    expect(sql).toContain("grant execute on function public.portal_claim_otp_attempt(uuid, integer) to service_role");
  });
});
