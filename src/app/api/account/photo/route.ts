import { NextResponse } from "next/server";

import { signedAvatarUrl } from "@/lib/s3-avatars";
import { getAuthUser } from "@/lib/supabase/auth";

// Chrome face GET. Mapping C: sign avatars/{user-id}/avatar for the session
// user only. Re-sign on every request so the client shell never holds a
// 5-minute S3 URL. 404 when empty — chrome falls back to the initial.
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return new NextResponse(null, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const url = await signedAvatarUrl(user.id);
  if (!url) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const response = NextResponse.redirect(url, 302);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
