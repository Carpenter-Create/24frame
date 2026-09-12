import "server-only";

import type { EmailOtpType } from "@supabase/supabase-js";

import { sendMagicLinkEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export const DASHBOARD_SIGN_IN_SENT = "Check your email for a secure sign-in link.";
export const DASHBOARD_SIGN_IN_SEND_FAILED = "Could not send the sign-in link. Please try again.";

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
): string {
  const url = new URL("/auth/callback", `${stripSlash(origin)}/`);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", verifyType);
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

async function generateHashedToken(
  admin: AdminClient,
  email: string,
  redirectTo: string,
): Promise<{ hashedToken: string } | { error: { message?: string; status?: number } }> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });
  const hashedToken = data?.properties?.hashed_token;
  if (error || !hashedToken) return { error: error ?? { message: "missing-token" } };
  return { hashedToken };
}

// Mint a hashed token (generateLink does not send GoTrue mail) and deliver a
// link-only house email via Resend. Never call signInWithOtp from this path —
// that fires the hosted template that still includes {{ .Token }} for mobile.
// Signup generateLink is not used: the JS types require a password, and this
// product is magic-link only. Unknown addresses get createUser (no password)
// then a magiclink token — same shouldCreateUser: true outcome.
export async function issueDashboardSignInLink(args: {
  email: string;
  requestOrigin: string | null;
}): Promise<void> {
  const origin = resolveDashboardOrigin(args.requestOrigin);
  const redirectTo = `${origin}/auth/callback`;
  const admin = createAdminClient();

  let minted = await generateHashedToken(admin, args.email, redirectTo);
  if ("error" in minted && isNotFound(minted.error)) {
    const { error: createError } = await admin.auth.admin.createUser({
      email: args.email,
      email_confirm: false,
    });
    if (createError && !isAlreadyRegistered(createError)) {
      throw new Error("mint-failed");
    }
    minted = await generateHashedToken(admin, args.email, redirectTo);
  }

  if ("error" in minted) {
    throw new Error("mint-failed");
  }

  const signInUrl = buildDashboardCallbackUrl(origin, minted.hashedToken, "email");
  await sendMagicLinkEmail(args.email, signInUrl);
}
