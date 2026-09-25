import { NextResponse } from "next/server";

import { viewerMayMintSocialMuxPlayback } from "@/lib/social-media-access";
import { isSocialMuxId } from "@/lib/social-mux";
import { mintSocialMuxPlaybackTokens } from "@/lib/social-mux-server";
import { getAuthUser } from "@/lib/supabase/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Node mint for signed Mux playback. Edge Social pages keep the playback id
// and this route returns the player tokens. Session required. The playback
// id must sit on a post or story row this session can select. No key material
// in the response.

function privateStatus(status: number): NextResponse {
  return new NextResponse(null, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return privateStatus(401);

  const playbackId = new URL(request.url).searchParams.get("playbackId")?.trim() ?? "";
  if (!isSocialMuxId(playbackId)) return privateStatus(400);
  if (!(await viewerMayMintSocialMuxPlayback(user.id, playbackId))) return privateStatus(403);

  try {
    const tokens = await mintSocialMuxPlaybackTokens(playbackId);
    return NextResponse.json(tokens, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return privateStatus(500);
  }
}
