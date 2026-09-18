import { NextResponse } from "next/server";
import { z } from "zod";

import {
  MOBILE_SIGN_IN_RATE_LIMITED,
  MOBILE_SIGN_IN_SEND_FAILED,
  issueMobileSignInCode,
} from "@/lib/auth-magic-link";
import {
  AUTH_SES_SUPPRESSED_USER_MESSAGE,
  isAuthSesSuppressedError,
} from "@/lib/auth-ses";
import {
  assertDashboardSignInAllowed,
  clientIpFromForwarded,
  DashboardSignInRateLimitError,
} from "@/lib/dashboard-sign-in-rate-limit";

const Body = z.object({
  email: z.string().email().max(320),
});

// Mobile Expo cannot hold the service role. Mint + house SES send live here
// (same pipe as web /login). Never return the OTP or link in the JSON body.
// AuthSesSuppressedError is a first-class send failure — not a generic mail outage.
export async function POST(req: Request) {
  const raw = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const email =
    typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
  const parsed = Body.safeParse({ email });
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email address." }, { status: 400 });
  }
  const ip = clientIpFromForwarded(req.headers.get("x-forwarded-for"));

  try {
    await assertDashboardSignInAllowed({ email: parsed.data.email, ip });
    await issueMobileSignInCode({ email: parsed.data.email });
  } catch (err) {
    if (err instanceof DashboardSignInRateLimitError) {
      return NextResponse.json({ error: MOBILE_SIGN_IN_RATE_LIMITED }, { status: 429 });
    }
    if (isAuthSesSuppressedError(err)) {
      console.warn("[mobile-sign-in] SES destination suppressed", err.recipient);
      return NextResponse.json({ error: AUTH_SES_SUPPRESSED_USER_MESSAGE }, { status: 422 });
    }
    console.error(
      "[mobile-sign-in] mint/send failed",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: MOBILE_SIGN_IN_SEND_FAILED }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
