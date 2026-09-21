import { NextResponse } from "next/server";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { socialAvatarHref } from "@/lib/social-edge";
import { loadPostComments, loadProfilesByIds } from "@/lib/social-feed";
import { socialPersonLabel } from "@/lib/social";
import type { SocialCommentCard } from "@/lib/social-comments";
import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store" } as const;

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: ACCOUNT_PROFILE.signedOut }, { status: 401, headers: noStore });
  }

  const postId = new URL(request.url).searchParams.get("post_id")?.trim() ?? "";
  if (!postId) {
    return NextResponse.json({ error: "Missing post." }, { status: 400, headers: noStore });
  }

  const supabase = await createClient();
  const page = await loadPostComments(supabase, postId);
  const authors = await loadProfilesByIds(
    supabase,
    [...new Set(page.comments.map((row) => row.author_id))],
  );
  const comments: SocialCommentCard[] = page.comments.map((row) => {
    const author = authors.get(row.author_id);
    return {
      ...row,
      authorHandle: author?.handle ?? null,
      authorName: socialPersonLabel({
        handle: author?.handle ?? "",
        displayName: author?.display_name,
      }),
      authorPhotoUrl: socialAvatarHref(row.author_id),
      canDelete: row.author_id === user.id,
    };
  });

  return NextResponse.json(
    { comments, truncated: page.truncated },
    { headers: noStore },
  );
}
