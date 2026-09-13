"use server";

import { headers } from "next/headers";

import { LOGIN_VERIFICATION_FAILED } from "@/lib/app-states";
import {
  DASHBOARD_SIGN_IN_SEND_FAILED,
  DASHBOARD_SIGN_IN_SENT,
  issueDashboardSignInLink,
} from "@/lib/auth-magic-link";
import { verifyTurnstile } from "@/lib/turnstile";

export type LoginState = { ok: boolean; message: string };

// Magic-link only (domain-spec §21 decision): no passwords, no OAuth. Turnstile is
// verified server-side BEFORE we mint a link. Dashboard send uses generateLink +
// Resend (link-only house mail). It does not call signInWithOtp — that would fire
// the hosted dual-purpose magic_link template (link + code) that mobile still needs.
export async function requestMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("cf-turnstile-response") ?? "");

  if (!email) return { ok: false, message: "Enter your email address." };

  if (!(await verifyTurnstile(token))) {
    return { ok: false, message: LOGIN_VERIFICATION_FAILED };
  }

  const origin = (await headers()).get("origin");
  try {
    await issueDashboardSignInLink({ email, requestOrigin: origin });
  } catch {
    return { ok: false, message: DASHBOARD_SIGN_IN_SEND_FAILED };
  }
  return { ok: true, message: DASHBOARD_SIGN_IN_SENT };
}
