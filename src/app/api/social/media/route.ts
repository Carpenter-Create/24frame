import { NextResponse } from "next/server";

import { signedSocialMediaUrl } from "@/lib/s3-social-media";
import { isForbiddenMediaKey } from "@/lib/social-media";
import { getAuthUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";

// Node signer for Edge Social reads. Session required. Forbidden /
// title-asset keys stay closed.

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return new NextResponse(null, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const key = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  if (!key || isForbiddenMediaKey(key)) {
    return new NextResponse(null, {
      status: 400,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const url = await signedSocialMediaUrl(key);
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
