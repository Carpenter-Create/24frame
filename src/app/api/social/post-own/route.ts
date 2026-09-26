import { NextResponse } from "next/server";

import { deleteSocialPost, updateSocialPostCaption } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { getAuthUser } from "@/lib/supabase/auth";

// Caption edit and soft-delete. Fetch — not a server action — so the
// feed does not wait on a router refresh. Create stays on POST /api/social/post.

const noStore = { "Cache-Control": "private, no-store" } as const;

async function requireUser() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: ACCOUNT_PROFILE.signedOut }, { status: 401, headers: noStore });
  }
  return null;
}

export async function PATCH(request: Request) {
  const denied = await requireUser();
  if (denied) return denied;

  const result = await updateSocialPostCaption(await request.formData());
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400, headers: noStore });
  }
  return NextResponse.json({}, { headers: noStore });
}

export async function DELETE(request: Request) {
  const denied = await requireUser();
  if (denied) return denied;

  const result = await deleteSocialPost(await request.formData());
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400, headers: noStore });
  }
  return NextResponse.json({}, { headers: noStore });
}
