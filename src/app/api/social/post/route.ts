import { NextResponse } from "next/server";

import { writeSocialPost } from "@/app/(app)/social/actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { getAuthUser } from "@/lib/supabase/auth";

// Background persist for composer publish. Fetch — not a server action —
// so Post does not wait on redirect or a tree refresh.

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: ACCOUNT_PROFILE.signedOut },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const result = await writeSocialPost(await request.formData());
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json({}, { headers: { "Cache-Control": "private, no-store" } });
}
