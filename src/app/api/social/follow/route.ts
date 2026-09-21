import { NextResponse } from "next/server";

import { toggleSocialFollow } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { getAuthUser } from "@/lib/supabase/auth";

// Background persist for Follow. Fetch — not a server action —
// so the chip does not wait on a router refresh or a Home RSC rewrite.

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: ACCOUNT_PROFILE.signedOut },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const result = await toggleSocialFollow(await request.formData());
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json({}, { headers: { "Cache-Control": "private, no-store" } });
}
