import { NextResponse } from "next/server";
import { z } from "zod";

import { signedAvatarUrl } from "@/lib/s3-avatars";
import { getAuthUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";

const userIdSchema = z.string().uuid();

// Node signer for Edge Social reads. Session required. Re-signs on each
// GET so the Edge HTML never holds a 5-minute S3 URL.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const user = await getAuthUser();
  if (!user) {
    return new NextResponse(null, {
      status: 401,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const { userId } = await params;
  if (!userIdSchema.safeParse(userId).success) {
    return new NextResponse(null, {
      status: 400,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const url = await signedAvatarUrl(userId);
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
