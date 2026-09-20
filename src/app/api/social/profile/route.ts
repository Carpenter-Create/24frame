import { NextResponse } from "next/server";

import { createSocialProfile } from "@/app/(app)/social/actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { getAuthUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";

// Background persist for Social Edit Done. Fetch — not a server action —
// so the own face is not refreshed while the write is in flight.

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: ACCOUNT_PROFILE.signedOut },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const result = await createSocialProfile(await request.formData());
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json({}, { headers: { "Cache-Control": "private, no-store" } });
}
