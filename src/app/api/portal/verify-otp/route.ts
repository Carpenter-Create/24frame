import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken, hashOtp, safeEqualHex, generateToken, PORTAL } from "@/lib/portal";

const Body = z.object({
  token: z.string().min(1).max(512),
  email: z.string().email().max(320),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { token, code } = parsed.data;
  // Normalize email so casing/whitespace can't split it from the request-otp row it must match.
  const email = parsed.data.email.trim().toLowerCase();

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("portal_links")
    .select("id, expires_at, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!link || link.revoked_at || new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ error: "Link expired or withdrawn" }, { status: 404 });
  }

  const { data: otp } = await admin
    .from("portal_otps")
    .select("id, code_hash, expires_at")
    .eq("link_id", link.id)
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!otp || new Date(otp.expires_at) < new Date()) {
    return NextResponse.json({ error: "Code incorrect or expired" }, { status: 400 });
  }

  // One atomic claim against portal_otps.attempts. A stale read plus a
  // client-computed increment lets concurrent verifies share a count and
  // all compare a code. The RPC increments only while attempts are under
  // the cap and returns null when it changes no row — treat that as
  // exhausted and do not compare the code. Cap stays PORTAL.otpMaxAttempts.
  const { data: claimedAttempts, error: claimError } = await admin.rpc("portal_claim_otp_attempt", {
    p_otp_id: otp.id,
    p_max_attempts: PORTAL.otpMaxAttempts,
  });
  if (claimError) {
    return NextResponse.json({ error: "Could not verify code" }, { status: 500 });
  }
  if (
    typeof claimedAttempts !== "number" ||
    claimedAttempts < 1 ||
    claimedAttempts > PORTAL.otpMaxAttempts
  ) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  if (!safeEqualHex(otp.code_hash, hashOtp(code, link.id))) {
    return NextResponse.json({ error: "Code incorrect or expired" }, { status: 400 });
  }

  // Recover the captured identity from the room_viewed/otp_sent event.
  const { data: idEvent } = await admin
    .from("portal_access_events")
    .select("name, company")
    .eq("link_id", link.id)
    .eq("email", email)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await admin.from("portal_otps").update({ consumed_at: new Date().toISOString() }).eq("id", otp.id);

  const sessionToken = generateToken();
  const { data: session, error: sErr } = await admin
    .from("portal_sessions")
    .insert({
      link_id: link.id,
      token_hash: hashToken(sessionToken),
      name: idEvent?.name ?? "",
      company: idEvent?.company ?? "",
      email,
      expires_at: new Date(Date.now() + PORTAL.sessionTtlHours * 3_600_000).toISOString(),
    })
    .select("id")
    .single();
  if (sErr || !session) return NextResponse.json({ error: "Could not start session" }, { status: 500 });

  await admin.from("portal_access_events").insert({
    link_id: link.id, session_id: session.id, event_type: "otp_verified", email,
    name: idEvent?.name, company: idEvent?.company,
    user_agent: req.headers.get("user-agent") ?? null,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PORTAL.sessionCookie, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PORTAL.sessionTtlHours * 3600,
  });
  return res;
}
