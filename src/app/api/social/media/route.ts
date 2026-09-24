import { NextResponse } from "next/server";

import { signedSocialMediaUrl } from "@/lib/s3-social-media";
import { privateMaxAgeCacheControl } from "@/lib/signing-window";
import { viewerMaySignSocialMedia } from "@/lib/social-media-access";
import { isForbiddenMediaKey, SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS } from "@/lib/social-media";
import { getAuthUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";

// Node signer for Edge Social reads. Session required. A non-forbidden
// key is not enough. Sign only after ownership (posts lane), or a story
// the caller could select (self or follow, and expires_at still ahead),
// or an active post / published cover or welcome the session can read.
// Successful 302 is private max-age aligned to the signing window.
// Auth misses, bad keys, and unauthorized keys stay no-store.

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

  if (!(await viewerMaySignSocialMedia(user.id, key))) {
    return new NextResponse(null, {
      status: 403,
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
  response.headers.set("Cache-Control", privateMaxAgeCacheControl(SOCIAL_MEDIA_SIGNED_URL_TTL_SECONDS));
  return response;
}
