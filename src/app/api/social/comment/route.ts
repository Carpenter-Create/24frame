import { NextResponse } from "next/server";

import { createSocialComment, deleteSocialComment } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { getAuthUser } from "@/lib/supabase/auth";

// Background persist for comment create / remove. Fetch — not a server
// action — so the thread does not wait on a router refresh.

const noStore = { "Cache-Control": "private, no-store" } as const;

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: ACCOUNT_PROFILE.signedOut }, { status: 401, headers: noStore });
  }

  const result = await createSocialComment(await request.formData());
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400, headers: noStore });
  }
  return NextResponse.json(
    { id: result.id, created_at: result.created_at },
    { headers: noStore },
  );
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: ACCOUNT_PROFILE.signedOut }, { status: 401, headers: noStore });
  }

  const result = await deleteSocialComment(await request.formData());
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400, headers: noStore });
  }
  return NextResponse.json({}, { headers: noStore });
}
