import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/social-profile", () => ({
  ensureOwnSocialProfile: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { ensureOwnSocialProfile } from "@/lib/social-profile";

import { GET } from "./route";

const CODE = "single-use-pkce-code";
const TOKEN_HASH = "single-use-token-hash";

type AuthError = { message: string; status?: number } | null;

function mockAuth({
  exchangeError = null,
  verifyError = null,
}: { exchangeError?: AuthError; verifyError?: AuthError } = {}) {
  const exchangeCodeForSession = vi.fn(async () => ({ error: exchangeError }));
  const verifyOtp = vi.fn(async () => ({ error: verifyError }));
  const getUser = vi.fn(async () => ({
    data: { user: { id: "u1", email: "ada@example.com", user_metadata: { display_name: "Ada" } } },
    error: null,
  }));
  vi.mocked(createClient).mockResolvedValue({
    auth: { exchangeCodeForSession, verifyOtp, getUser },
  } as never);
  return { exchangeCodeForSession, verifyOtp, getUser };
}

function silenceConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}
type ErrorSpy = ReturnType<typeof silenceConsoleError>;

function logged(spy: ErrorSpy): string {
  return spy.mock.calls.map((call: unknown[]) => call.join(" ")).join("\n");
}

let errorSpy: ErrorSpy;

beforeEach(() => {
  vi.clearAllMocks();
  errorSpy = silenceConsoleError();
});

afterEach(() => errorSpy.mockRestore());

/**
 * The user-facing message ("That sign-in link is no longer valid") is the same for every
 * failure mode — expired, already consumed by a link scanner, PKCE verifier missing, or the
 * callback hit with no params at all. Without the server-side reason, a failed staff sign-in
 * is undiagnosable, which is exactly the hole this closes.
 */
describe("auth callback failure logging", () => {
  it("logs why a code exchange failed", async () => {
    mockAuth({ exchangeError: { message: "invalid request: code verifier should be non-empty", status: 400 } });

    const res = await GET(new Request(`https://app.test/auth/callback?code=${CODE}`));

    expect(res.headers.get("location")).toBe("https://app.test/login?error=auth");
    expect(logged(errorSpy)).toContain("code verifier should be non-empty");
  });

  it("logs why a token_hash verification failed", async () => {
    mockAuth({ verifyError: { message: "Token has expired or is invalid", status: 403 } });

    const res = await GET(
      new Request(`https://app.test/auth/callback?token_hash=${TOKEN_HASH}&type=magiclink`),
    );

    expect(res.headers.get("location")).toBe("https://app.test/login?error=auth");
    expect(logged(errorSpy)).toContain("Token has expired or is invalid");
  });

  it("logs the case where the callback carries no credential at all", async () => {
    mockAuth();

    const res = await GET(new Request("https://app.test/auth/callback"));

    expect(res.headers.get("location")).toBe("https://app.test/login?error=auth");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("never writes the single-use credential to the log", async () => {
    // The code and token_hash ARE the credential. A log line carrying one turns a log reader
    // into a session — and Vercel logs are not a secret store.
    mockAuth({ exchangeError: { message: "boom", status: 400 } });
    await GET(new Request(`https://app.test/auth/callback?code=${CODE}`));

    mockAuth({ verifyError: { message: "boom", status: 400 } });
    await GET(
      new Request(`https://app.test/auth/callback?token_hash=${TOKEN_HASH}&type=magiclink`),
    );

    expect(logged(errorSpy)).not.toContain(CODE);
    expect(logged(errorSpy)).not.toContain(TOKEN_HASH);
  });

  it("stays silent and forwards on success", async () => {
    mockAuth();

    const res = await GET(
      new Request(`https://app.test/auth/callback?code=${CODE}&next=/staff/queue`),
    );

    expect(res.headers.get("location")).toBe("https://app.test/staff/queue");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(ensureOwnSocialProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: "u1", email: "ada@example.com", name: "Ada" }),
    );
  });

  it("allowlists path-relative next and defaults missing or off-origin values to /home (P0-1)", async () => {
    mockAuth();
    const ok = await GET(
      new Request(
        `https://app.test/auth/callback?code=${CODE}&next=${encodeURIComponent("/home?ai=1")}`,
      ),
    );
    expect(ok.headers.get("location")).toBe("https://app.test/home?ai=1");

    mockAuth();
    const missing = await GET(new Request(`https://app.test/auth/callback?code=${CODE}`));
    expect(missing.headers.get("location")).toBe("https://app.test/home");

    mockAuth();
    const leftover = await GET(
      new Request(`https://app.test/auth/callback?code=${CODE}&next=/`),
    );
    expect(leftover.headers.get("location")).toBe("https://app.test/home");

    for (const next of [
      "//evil.example",
      "https://evil.example",
      "/@attacker",
      "/\\evil.example",
      "/%2F%2Fevil.example",
      "queue",
    ]) {
      mockAuth();
      const res = await GET(
        new Request(
          `https://app.test/auth/callback?code=${CODE}&next=${encodeURIComponent(next)}`,
        ),
      );
      expect(res.headers.get("location"), next).toBe("https://app.test/home");
    }
  });
});
