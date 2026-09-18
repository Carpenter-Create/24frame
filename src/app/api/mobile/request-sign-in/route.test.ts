import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth-magic-link", () => ({
  MOBILE_SIGN_IN_RATE_LIMITED: "Too many requests. Please try again later.",
  MOBILE_SIGN_IN_SEND_FAILED: "Could not send the sign-in code. Please try again.",
  issueMobileSignInCode: vi.fn(),
}));

vi.mock("@/lib/dashboard-sign-in-rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dashboard-sign-in-rate-limit")>(
    "@/lib/dashboard-sign-in-rate-limit",
  );
  return {
    ...actual,
    assertDashboardSignInAllowed: vi.fn(),
  };
});

import { issueMobileSignInCode } from "@/lib/auth-magic-link";
import { AuthSesSuppressedError } from "@/lib/auth-ses";
import {
  assertDashboardSignInAllowed,
  DashboardSignInRateLimitError,
} from "@/lib/dashboard-sign-in-rate-limit";
import { POST } from "./route";

describe("POST /api/mobile/request-sign-in", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertDashboardSignInAllowed).mockResolvedValue(undefined);
    vi.mocked(issueMobileSignInCode).mockResolvedValue(undefined);
  });

  it("mints and sends through the house pipe without returning the OTP", async () => {
    const res = await POST(
      new Request("https://app.24frame.co/api/mobile/request-sign-in", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
        body: JSON.stringify({ email: " Ada@Studio.com " }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(assertDashboardSignInAllowed).toHaveBeenCalledWith({
      email: "ada@studio.com",
      ip: "203.0.113.9",
    });
    expect(issueMobileSignInCode).toHaveBeenCalledWith({ email: "ada@studio.com" });
  });

  it("rejects invalid email without minting", async () => {
    const res = await POST(
      new Request("https://app.24frame.co/api/mobile/request-sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      }),
    );
    expect(res.status).toBe(400);
    expect(issueMobileSignInCode).not.toHaveBeenCalled();
  });

  it("surfaces rate limits as 429", async () => {
    vi.mocked(assertDashboardSignInAllowed).mockRejectedValue(
      new DashboardSignInRateLimitError("email"),
    );
    const res = await POST(
      new Request("https://app.24frame.co/api/mobile/request-sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "ada@studio.com" }),
      }),
    );
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: "Too many requests. Please try again later.",
    });
    expect(issueMobileSignInCode).not.toHaveBeenCalled();
  });

  it("surfaces a suppressed destination as 422 without AWS internals", async () => {
    const logged = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(issueMobileSignInCode).mockRejectedValue(
      new AuthSesSuppressedError("ada@studio.com"),
    );
    const res = await POST(
      new Request("https://app.24frame.co/api/mobile/request-sign-in", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "ada@studio.com" }),
      }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      error: "This address cannot receive sign-in mail.",
    });
    expect(logged).toHaveBeenCalledWith(
      "[mobile-sign-in] SES destination suppressed",
      "ada@studio.com",
    );
    logged.mockRestore();
  });

  it("keeps the mobile send path off signInWithOtp", () => {
    const src = readFileSync(new URL("./route.ts", import.meta.url), "utf8");
    expect(src).toContain("issueMobileSignInCode");
    expect(src).not.toMatch(/signInWithOtp/);
  });
});
