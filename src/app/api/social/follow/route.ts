import { NextResponse } from "next/server";
import { z } from "zod";

import { toggleSocialFollow } from "@/app/(app)/social/light-actions";
import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { SOCIAL } from "@/lib/social";
import { getAuthUser } from "@/lib/supabase/auth";

// Background persist for Follow. Fetch — not a server action —
// so the chip does not wait on a router refresh or a Home RSC rewrite.

const followPersistSchema = z.object({
  followee_id: z.string().uuid(),
  following: z.enum(["0", "1"]),
  handle: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: ACCOUNT_PROFILE.signedOut },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const incoming = await request.formData();
  const parsed = followPersistSchema.safeParse({
    followee_id: String(incoming.get("followee_id") ?? ""),
    following: String(incoming.get("following") ?? ""),
    handle: String(incoming.get("handle") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: SOCIAL.follow.failed },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const form = new FormData();
  form.set("followee_id", parsed.data.followee_id);
  form.set("following", parsed.data.following);
  if (parsed.data.handle) form.set("handle", parsed.data.handle);

  const result = await toggleSocialFollow(form);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json({}, { headers: { "Cache-Control": "private, no-store" } });
}
