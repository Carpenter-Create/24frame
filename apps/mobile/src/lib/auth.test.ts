import { describe, expect, it, vi } from "vitest";

import {
  normalizeEmail,
  normalizeEmailCode,
  requestEmailCode,
  requestEmailCodeViaHousePipe,
  verifyEmailCode,
} from "./auth";

function mockClient(result: { error: { message: string } | null }) {
  return {
    auth: {
      verifyOtp: vi.fn().mockResolvedValue(result),
      signOut: vi.fn().mockResolvedValue(result),
    },
  };
}

describe("mobile email code auth", () => {
  it("normalizes email and rejects password-shaped blanks", () => {
    expect(normalizeEmail("  Ada@Studio.com ")).toBe("ada@studio.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmailCode(" 12 3456 ")).toBe("123456");
    expect(normalizeEmailCode("123")).toBeNull();
  });

  it("requests a code through the house pipe and verifies without GoTrue mail", async () => {
    const transport = {
      requestSignInCode: vi.fn().mockResolvedValue({ ok: true }),
    };
    const client = mockClient({ error: null });
    await expect(requestEmailCode(transport, "ada@studio.com")).resolves.toEqual({ ok: true });
    expect(transport.requestSignInCode).toHaveBeenCalledWith("ada@studio.com");
    await expect(verifyEmailCode(client, "ada@studio.com", "123456")).resolves.toEqual({ ok: true });
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      email: "ada@studio.com",
      token: "123456",
      type: "email",
    });
  });

  it("posts to the dashboard mobile sign-in route", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    await expect(
      requestEmailCodeViaHousePipe("https://app.24frame.co", "ada@studio.com", fetchImpl),
    ).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://app.24frame.co/api/mobile/request-sign-in",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "ada@studio.com" }),
      }),
    );
  });

  it("surfaces house-pipe errors without inventing success", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Too many requests. Please try again later." }),
    });
    await expect(
      requestEmailCodeViaHousePipe("https://app.24frame.co", "ada@studio.com", fetchImpl),
    ).resolves.toEqual({
      ok: false,
      message: "Too many requests. Please try again later.",
    });
  });
});
