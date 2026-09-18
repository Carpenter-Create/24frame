import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/email", () => ({
  sendMagicLinkEmail: vi.fn(),
  sendSignInWithCodeEmail: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail, sendSignInWithCodeEmail } from "@/lib/email";
import {
  buildDashboardCallbackUrl,
  issueDashboardSignInLink,
  issueMobileSignInCode,
  resolveDashboardOrigin,
} from "./auth-magic-link";

const EMAIL = "jane@acmefilms.com";
const HASH = "hashed-token-value";
const OTP = "847291";
const EVIL = "https://evil.example";

function fakeAdmin(opts: {
  generate?: Array<{
    hashed_token?: string;
    email_otp?: string;
    error?: { message?: string; status?: number } | null;
  }>;
  createError?: { message?: string; status?: number } | null;
} = {}) {
  const queue = [
    ...(opts.generate ?? [{ hashed_token: HASH, email_otp: OTP, error: null }]),
  ];
  const generateLink = vi.fn(async () => {
    const next = queue.shift() ?? { hashed_token: HASH, email_otp: OTP, error: null };
    return {
      data:
        next.hashed_token && next.email_otp
          ? { properties: { hashed_token: next.hashed_token, email_otp: next.email_otp } }
          : { properties: {} },
      error: next.error ?? null,
    };
  });
  const createUser = vi.fn(async () => ({
    data: { user: opts.createError ? null : { id: "user-1" } },
    error: opts.createError ?? null,
  }));
  const admin = { auth: { admin: { generateLink, createUser } } };
  vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);
  return { generateLink, createUser };
}

describe("resolveDashboardOrigin", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts the request origin when it is an allowed host", () => {
    vi.stubEnv("PORTAL_BASE_URL", "https://app.24frame.co");
    expect(resolveDashboardOrigin("https://app.24frame.co")).toBe("https://app.24frame.co");
    expect(resolveDashboardOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
  });

  it("rejects an attacker Origin and falls back to the configured app origin", () => {
    vi.stubEnv("PORTAL_BASE_URL", "https://app.24frame.co");
    expect(resolveDashboardOrigin(EVIL)).toBe("https://app.24frame.co");
  });

  it("accepts this Vercel deployment host", () => {
    vi.stubEnv("PORTAL_BASE_URL", "https://app.24frame.co");
    vi.stubEnv("VERCEL_URL", "24frame-git-preview.vercel.app");
    expect(resolveDashboardOrigin("https://24frame-git-preview.vercel.app")).toBe(
      "https://24frame-git-preview.vercel.app",
    );
  });
});

describe("buildDashboardCallbackUrl", () => {
  it("puts the hashed token on /auth/callback with type=email", () => {
    expect(buildDashboardCallbackUrl("https://app.24frame.co", HASH, "email")).toBe(
      `https://app.24frame.co/auth/callback?token_hash=${HASH}&type=email`,
    );
  });
});

describe("issueDashboardSignInLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("PORTAL_BASE_URL", "https://app.24frame.co");
    vi.mocked(sendMagicLinkEmail).mockResolvedValue(undefined);
    vi.mocked(sendSignInWithCodeEmail).mockResolvedValue(undefined);
  });

  it("mints a magiclink token for an existing user and sends link-only mail", async () => {
    const { generateLink, createUser } = fakeAdmin();
    await issueDashboardSignInLink({ email: EMAIL, requestOrigin: "https://app.24frame.co" });
    expect(generateLink).toHaveBeenCalledOnce();
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EMAIL,
      options: { redirectTo: "https://app.24frame.co/auth/callback" },
    });
    expect(createUser).not.toHaveBeenCalled();
    expect(sendMagicLinkEmail).toHaveBeenCalledWith(
      EMAIL,
      `https://app.24frame.co/auth/callback?token_hash=${HASH}&type=email`,
    );
    expect(sendSignInWithCodeEmail).not.toHaveBeenCalled();
  });

  it("creates an unconfirmed user with no password when the address is unknown", async () => {
    const { generateLink, createUser } = fakeAdmin({
      generate: [
        { error: { message: "User not found", status: 404 } },
        { hashed_token: HASH, email_otp: OTP, error: null },
      ],
    });
    await issueDashboardSignInLink({ email: EMAIL, requestOrigin: "https://app.24frame.co" });
    expect(createUser).toHaveBeenCalledWith({ email: EMAIL, email_confirm: false });
    expect(generateLink).toHaveBeenCalledTimes(2);
    expect(sendMagicLinkEmail).toHaveBeenCalledWith(
      EMAIL,
      `https://app.24frame.co/auth/callback?token_hash=${HASH}&type=email`,
    );
  });

  it("retries minting when createUser races with a just-created account", async () => {
    const { generateLink, createUser } = fakeAdmin({
      generate: [
        { error: { message: "User not found", status: 404 } },
        { hashed_token: HASH, email_otp: OTP, error: null },
      ],
      createError: { message: "User already registered", status: 422 },
    });
    await issueDashboardSignInLink({ email: EMAIL, requestOrigin: "https://app.24frame.co" });
    expect(createUser).toHaveBeenCalledOnce();
    expect(generateLink).toHaveBeenCalledTimes(2);
    expect(sendMagicLinkEmail).toHaveBeenCalledOnce();
  });

  it("does not put the grant on an attacker origin", async () => {
    fakeAdmin();
    await issueDashboardSignInLink({ email: EMAIL, requestOrigin: EVIL });
    expect(sendMagicLinkEmail).toHaveBeenCalledWith(
      EMAIL,
      `https://app.24frame.co/auth/callback?token_hash=${HASH}&type=email`,
    );
  });

  it("throws a token-free error when minting fails, and does not send", async () => {
    fakeAdmin({
      generate: [{ error: { message: `hashed_token=${HASH} leaked`, status: 500 } }],
    });
    await expect(
      issueDashboardSignInLink({ email: EMAIL, requestOrigin: "https://app.24frame.co" }),
    ).rejects.toThrow("mint-failed");
    expect(sendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it("keeps dashboard login off signInWithOtp", () => {
    const impl = readFileSync(new URL("./auth-magic-link.ts", import.meta.url), "utf8");
    const actions = readFileSync(new URL("../app/login/actions.ts", import.meta.url), "utf8");
    expect(impl).not.toMatch(/\.signInWithOtp\s*\(/);
    expect(impl).not.toMatch(/generateLink\(\{\s*type:\s*"signup"/);
    expect(actions).not.toMatch(/\.signInWithOtp\s*\(/);
    expect(actions).toContain("issueDashboardSignInLink");
  });
});

describe("issueMobileSignInCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("PORTAL_BASE_URL", "https://app.24frame.co");
    vi.mocked(sendMagicLinkEmail).mockResolvedValue(undefined);
    vi.mocked(sendSignInWithCodeEmail).mockResolvedValue(undefined);
  });

  it("mints via generateLink and sends house mail with the enterable OTP", async () => {
    const { generateLink } = fakeAdmin();
    await issueMobileSignInCode({ email: EMAIL });
    expect(generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: EMAIL,
      options: { redirectTo: "https://app.24frame.co/auth/callback" },
    });
    expect(sendSignInWithCodeEmail).toHaveBeenCalledWith(
      EMAIL,
      `https://app.24frame.co/auth/callback?token_hash=${HASH}&type=email`,
      OTP,
    );
    expect(sendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it("fails closed when generateLink omits email_otp", async () => {
    fakeAdmin({
      generate: [{ hashed_token: HASH, error: null }],
    });
    await expect(issueMobileSignInCode({ email: EMAIL })).rejects.toThrow("mint-failed");
    expect(sendSignInWithCodeEmail).not.toHaveBeenCalled();
  });
});
