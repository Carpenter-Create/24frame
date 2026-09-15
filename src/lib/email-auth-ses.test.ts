import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSendAuthSesEmail } = vi.hoisted(() => ({
  mockSendAuthSesEmail: vi.fn(),
}));

vi.mock("@/lib/auth-ses", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth-ses")>();
  return {
    ...actual,
    sendAuthSesEmail: mockSendAuthSesEmail,
  };
});

import { AuthSesSuppressedError } from "@/lib/auth-ses";
import {
  buildMagicLinkEmail,
  buildOtpEmail,
  buildSignInWithCodeEmail,
  sendMagicLinkEmail,
  sendOtpEmail,
  sendSignInWithCodeEmail,
} from "./email";

const SIGN_IN_URL =
  "https://app.24frame.co/auth/callback?token_hash=test-token&type=email";

describe("Auth house mail uses SES transport", () => {
  beforeEach(() => {
    mockSendAuthSesEmail.mockReset();
    mockSendAuthSesEmail.mockResolvedValue({ messageId: "ses-test" });
  });

  it("sends the OTP house template through SES", async () => {
    const expected = buildOtpEmail("012345");
    await sendOtpEmail("holder@example.com", "012345");
    expect(mockSendAuthSesEmail).toHaveBeenCalledWith({
      to: "holder@example.com",
      ...expected,
    });
  });

  it("sends the link-only magic-link house template through SES", async () => {
    const expected = buildMagicLinkEmail(SIGN_IN_URL);
    await sendMagicLinkEmail("holder@example.com", SIGN_IN_URL);
    expect(mockSendAuthSesEmail).toHaveBeenCalledWith({
      to: "holder@example.com",
      ...expected,
    });
    expect(expected.text).not.toMatch(/enter this code/i);
  });

  it("sends the mobile sign-in house template through SES", async () => {
    const expected = buildSignInWithCodeEmail(SIGN_IN_URL, "847291");
    await sendSignInWithCodeEmail("holder@example.com", SIGN_IN_URL, "847291");
    expect(mockSendAuthSesEmail).toHaveBeenCalledWith({
      to: "holder@example.com",
      ...expected,
    });
    expect(expected.text).toContain("Or enter this code: 847291");
  });

  it("propagates AuthSesSuppressedError from the SES transport", async () => {
    const suppressed = new AuthSesSuppressedError("holder@example.com");
    mockSendAuthSesEmail.mockRejectedValueOnce(suppressed);
    await expect(sendOtpEmail("holder@example.com", "012345")).rejects.toBe(suppressed);
    mockSendAuthSesEmail.mockRejectedValueOnce(suppressed);
    await expect(sendMagicLinkEmail("holder@example.com", SIGN_IN_URL)).rejects.toBe(suppressed);
    mockSendAuthSesEmail.mockRejectedValueOnce(suppressed);
    await expect(sendSignInWithCodeEmail("holder@example.com", SIGN_IN_URL, "847291")).rejects.toBe(
      suppressed,
    );
  });

  it("keeps Auth send functions off Resend", () => {
    const src = readFileSync("src/lib/email.ts", "utf8");
    const authFns = [
      src.slice(src.indexOf("export async function sendOtpEmail"), src.indexOf("export async function sendMagicLinkEmail")),
      src.slice(
        src.indexOf("export async function sendMagicLinkEmail"),
        src.indexOf("export async function sendSignInWithCodeEmail"),
      ),
      src.slice(
        src.indexOf("export async function sendSignInWithCodeEmail"),
        src.indexOf("export function buildNotificationEmail"),
      ),
    ];
    expect(src).toContain('from "@/lib/auth-ses"');
    for (const fn of authFns) {
      expect(fn).toContain("sendAuthSesEmail");
      expect(fn).not.toContain("RESEND_API_KEY");
      expect(fn).not.toContain("resend.emails.send");
    }
    expect(src).toContain("RESEND_API_KEY");
    expect(src).toContain('from "resend"');
  });
});
