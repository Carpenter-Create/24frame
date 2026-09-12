import { describe, expect, it, vi } from "vitest";

import { normalizeEmail, normalizeEmailCode, requestEmailCode, verifyEmailCode } from "./auth";

function mockClient(result: { error: { message: string } | null }) {
  return {
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue(result),
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

  it("requests and verifies an email OTP without a password", async () => {
    const client = mockClient({ error: null });
    await expect(requestEmailCode(client, "ada@studio.com")).resolves.toEqual({ ok: true });
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "ada@studio.com",
      options: { shouldCreateUser: true },
    });
    await expect(verifyEmailCode(client, "ada@studio.com", "123456")).resolves.toEqual({ ok: true });
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({
      email: "ada@studio.com",
      token: "123456",
      type: "email",
    });
  });
});
