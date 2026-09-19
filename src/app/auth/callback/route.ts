import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { authDisplayName } from "@/lib/account-profile";
import { safeAuthCallbackNext } from "@/lib/auth-callback-next";
import { recordSignInEvent, toInetOrNull } from "@/lib/security-event-writer";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { createClient } from "@/lib/supabase/server";

// Magic-link landing. Handles both the PKCE `code` exchange and the `token_hash`
// verifyOtp shape, then redirects into the app (or back to /login on failure).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeAuthCallbackNext(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const ip = toInetOrNull(request.headers.get("x-forwarded-for"));
  const userAgent = request.headers.get("user-agent");

  const supabase = await createClient();

  // Every failure below shows the user the same message (LOGIN_AUTH_ERROR) because none of the
  // distinctions are theirs to act on. They ARE ours: expired, already consumed by a link
  // scanner, PKCE verifier missing (link opened in a different browser or host), and "no
  // credential at all" are four different bugs with one symptom. Log the reason, never the
  // credential — `code` and `token_hash` are single-use session grants, and logs are not a
  // secret store.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureSessionProfile(supabase);
      await recordSignInForSession(supabase, ip, userAgent);
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error(`[auth] code exchange failed (status ${error.status ?? "?"}): ${error.message}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      await ensureSessionProfile(supabase);
      await recordSignInForSession(supabase, ip, userAgent);
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error(
      `[auth] verifyOtp type=${type} failed (status ${error.status ?? "?"}): ${error.message}`,
    );
  } else {
    console.error("[auth] callback reached with neither code nor token_hash+type");
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

async function recordSignInForSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ip: string | null,
  userAgent: string | null,
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await recordSignInEvent(data.user.id, ip, userAgent);
    }
  } catch (err) {
    console.error(
      "[auth] security event recording failed",
      err instanceof Error ? err.message : err,
    );
  }
}

async function ensureSessionProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return;
  try {
    await ensureOwnSocialProfile(supabase, {
      id: user.id,
      email: user.email ?? "",
      name: authDisplayName({ user_metadata: user.user_metadata }),
    });
  } catch (err) {
    console.error(
      "[auth] ensure profile failed",
      err instanceof Error ? err.message : err,
    );
  }
}
