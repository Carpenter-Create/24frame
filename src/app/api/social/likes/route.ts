import { NextResponse } from "next/server";

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { socialAvatarHref } from "@/lib/social-edge";
import { loadPostLikers, loadProfilesByIds, loadVisiblePost } from "@/lib/social-feed";
import { SOCIAL, socialPersonLabel } from "@/lib/social";
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
  const post = await loadVisiblePost(supabase, postId);
  if (!post) {
    return NextResponse.json({ error: SOCIAL.post.missing }, { status: 404, headers: noStore });
  }

  const page = await loadPostLikers(supabase, post.id);
  const authors = await loadProfilesByIds(supabase, page.userIds);
  const people = page.userIds.flatMap((id) => {
    const author = authors.get(id);
    if (!author) return [];
    return [
      {
        id,
        handle: author.handle,
        displayName: socialPersonLabel({
          handle: author.handle,
          displayName: author.display_name,
        }),
        photoUrl: socialAvatarHref(id),
      },
    ];
  });

  return NextResponse.json({ people, truncated: page.truncated }, { headers: noStore });
}
