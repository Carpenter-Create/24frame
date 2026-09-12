import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstile: vi.fn() }));
vi.mock("@/lib/auth-magic-link", () => ({
  DASHBOARD_SIGN_IN_SENT: "Check your email for a secure sign-in link.",
  DASHBOARD_SIGN_IN_SEND_FAILED: "Could not send the sign-in link. Please try again.",
  issueDashboardSignInLink: vi.fn(),
}));

import { headers } from "next/headers";
import { verifyTurnstile } from "@/lib/turnstile";
import { issueDashboardSignInLink } from "@/lib/auth-magic-link";
import { requestMagicLink } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("requestMagicLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue({
      get: (name: string) => (name === "origin" ? "https://app.24frame.co" : null),
    } as unknown as Awaited<ReturnType<typeof headers>>);
    vi.mocked(verifyTurnstile).mockResolvedValue(true);
    vi.mocked(issueDashboardSignInLink).mockResolvedValue(undefined);
  });

  it("requires an email before Turnstile or minting", async () => {
    await expect(requestMagicLink({ ok: false, message: "" }, form({}))).resolves.toEqual({
      ok: false,
      message: "Enter your email address.",
    });
    expect(verifyTurnstile).not.toHaveBeenCalled();
    expect(issueDashboardSignInLink).not.toHaveBeenCalled();
  });

  it("stops on a failed Turnstile before minting", async () => {
    vi.mocked(verifyTurnstile).mockResolvedValue(false);
    await expect(
      requestMagicLink(
        { ok: false, message: "" },
        form({ email: "jane@acmefilms.com", "cf-turnstile-response": "bad" }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: "Verification failed — please try again.",
    });
    expect(issueDashboardSignInLink).not.toHaveBeenCalled();
  });

  it("returns one fixed success string and does not leak mint errors", async () => {
    const result = await requestMagicLink(
      { ok: false, message: "" },
      form({ email: " jane@acmefilms.com ", "cf-turnstile-response": "ok" }),
    );
    expect(result).toEqual({
      ok: true,
      message: "Check your email for a secure sign-in link.",
    });
    expect(issueDashboardSignInLink).toHaveBeenCalledWith({
      email: "jane@acmefilms.com",
      requestOrigin: "https://app.24frame.co",
    });
  });

  it("returns a generic failure when mint or send throws", async () => {
    vi.mocked(issueDashboardSignInLink).mockRejectedValue(
      new Error("User not found: jane@acmefilms.com hashed_token=secret"),
    );
    await expect(
      requestMagicLink(
        { ok: false, message: "" },
        form({ email: "jane@acmefilms.com", "cf-turnstile-response": "ok" }),
      ),
    ).resolves.toEqual({
      ok: false,
      message: "Could not send the sign-in link. Please try again.",
    });
  });
});
