import "server-only";

import type { EmailOtpType } from "@supabase/supabase-js";

import { safeAuthCallbackNext } from "@/lib/auth-callback-next";
import { sendMagicLinkEmail, sendSignInWithCodeEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const DASHBOARD_SIGN_IN_SENT = "Check your email for a secure sign-in link.";
export const DASHBOARD_SIGN_IN_SEND_FAILED = "Could not send the sign-in link. Please try again.";
export const DASHBOARD_SIGN_IN_RATE_LIMITED = "Too many requests. Please try again later.";

export const MOBILE_SIGN_IN_SENT = "Check your email for a one-time code.";
export const MOBILE_SIGN_IN_SEND_FAILED = "Could not send the sign-in code. Please try again.";
export const MOBILE_SIGN_IN_RATE_LIMITED = "Too many requests. Please try again later.";

const LOCAL_ORIGINS = ["http://127.0.0.1:3000", "http://localhost:3000"] as const;
const PRODUCTION_ORIGIN = "https://app.24frame.co";

type AdminClient = ReturnType<typeof createAdminClient>;
type VerifyType = Extract<EmailOtpType, "email" | "signup">;

function stripSlash(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function addOrigin(into: Set<string>, raw: string | undefined): void {
  if (!raw) return;
  const value = stripSlash(raw);
  if (value.startsWith("http://") || value.startsWith("https://")) {
    into.add(value);
    return;
  }
  into.add(`https://${value}`);
}

// Request Origin is attacker-controlled. The hashed token is a single-use session
// grant, so the callback host must be one we configured — not whatever Origin arrived.
export function resolveDashboardOrigin(requestOrigin: string | null): string {
  const allowed = new Set<string>();
  addOrigin(allowed, process.env.PORTAL_BASE_URL);
  addOrigin(allowed, process.env.VERCEL_URL);
  addOrigin(allowed, process.env.VERCEL_BRANCH_URL);
  addOrigin(allowed, process.env.VERCEL_PROJECT_PRODUCTION_URL);
  addOrigin(allowed, PRODUCTION_ORIGIN);
  for (const local of LOCAL_ORIGINS) addOrigin(allowed, local);

  const origin = stripSlash(requestOrigin ?? "");
  if (origin && allowed.has(origin)) return origin;

  const configured = stripSlash(process.env.PORTAL_BASE_URL ?? "");
  if (configured) return configured;
  return LOCAL_ORIGINS[0];
}

export function buildDashboardCallbackUrl(
  origin: string,
  hashedToken: string,
  verifyType: VerifyType,
  next?: string,
): string {
  const url = new URL("/auth/callback", `${stripSlash(origin)}/`);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", verifyType);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}

function isNotFound(error: { message?: string; status?: number } | null): boolean {
  if (!error) return false;
  if (error.status === 404) return true;
  return /user not found/i.test(error.message ?? "");
}

function isAlreadyRegistered(error: { message?: string; status?: number } | null): boolean {
  if (!error) return false;
  return /already registered|already exists|email address is already/i.test(error.message ?? "");
}

async function mintSignInGrant(
  admin: AdminClient,
  email: string,
  redirectTo: string,
): Promise<
  | { hashedToken: string; emailOtp: string }
  | { error: { message?: string; status?: number } }
> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  const hashedToken = data?.properties?.hashed_token;
  const emailOtp = data?.properties?.email_otp;
  if (error || !hashedToken || !emailOtp) {
    return { error: error ?? { message: "missing-token" } };
  }
  return { hashedToken, emailOtp };
}

// Shared mint: generateLink does not send GoTrue mail. Unknown addresses get
// createUser (no password) then a magiclink grant — same shouldCreateUser: true
// outcome. Never call signInWithOtp from these paths.
async function mintDashboardSignInGrant(args: {
  email: string;
  requestOrigin: string | null;
  next?: string;
}): Promise<{ origin: string; hashedToken: string; emailOtp: string; signInUrl: string }> {
  const origin = resolveDashboardOrigin(args.requestOrigin);
  const next = args.next ? safeAuthCallbackNext(args.next) : "/";
  const redirectTo =
    next === "/" ? `${origin}/auth/callback` : `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const admin = createAdminClient();

  let minted = await mintSignInGrant(admin, args.email, redirectTo);
  if ("error" in minted && isNotFound(minted.error)) {
    const { error: createError } = await admin.auth.admin.createUser({
      email: args.email,
      email_confirm: false,
    });
    if (createError && !isAlreadyRegistered(createError)) {
      throw new Error("mint-failed");
    }
    minted = await mintSignInGrant(admin, args.email, redirectTo);
  }

  if ("error" in minted) {
    throw new Error("mint-failed");
  }

  return {
    origin,
    hashedToken: minted.hashedToken,
    emailOtp: minted.emailOtp,
    signInUrl: buildDashboardCallbackUrl(
      origin,
      minted.hashedToken,
      "email",
      next === "/" ? undefined : next,
    ),
  };
}

// Web dashboard: link-only house mail via Resend.
export async function issueDashboardSignInLink(args: {
  email: string;
  requestOrigin: string | null;
  next?: string;
}): Promise<void> {
  const grant = await mintDashboardSignInGrant(args);
  await sendMagicLinkEmail(args.email, grant.signInUrl);
}

// Mobile: same mint + house mail that includes the enterable OTP (hosted Auth
// template is parked for this product sign-in flow).
export async function issueMobileSignInCode(args: {
  email: string;
}): Promise<void> {
  // Mobile clients do not supply a trustworthy Origin. Pin the grant callback
  // to the configured dashboard origin (PORTAL_BASE_URL / production).
  const grant = await mintDashboardSignInGrant({
    email: args.email,
    requestOrigin: null,
  });
  await sendSignInWithCodeEmail(args.email, grant.signInUrl, grant.emailOtp);
}
