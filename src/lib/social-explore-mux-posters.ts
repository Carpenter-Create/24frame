import "server-only";

import { socialMuxPlaybackReadGrant } from "@/lib/social-media-access";
import { isSocialMuxMediaItem, ownedMediaItems } from "@/lib/social-media";
import {
  socialMuxPlaybackRequiresTokens,
  socialMuxThumbnailUrl,
  type SocialMuxPlaybackPolicy,
} from "@/lib/social-mux";
import { mintSocialMuxPlaybackTokens } from "@/lib/social-mux-server";

// One server mint for the Explore grid. Cover only (the cell shows the
// first item). Unique signed playback ids. AuthZ is the same read grant
// the mux-playback route uses, against rows the Explore query already
// loaded as status = active. Public posters stay on the unsigned proxy.
// Grant denial or a mint error omits the id — no per-cell client mint.

type ExplorePosterPost = {
  authorId: string;
  media: unknown;
};

type GrantPost = {
  author_id: string;
  status: "active";
  media: unknown;
};

export async function signExploreMuxPosterUrls(input: {
  userId: string;
  posts: readonly ExplorePosterPost[];
}): Promise<Map<string, string>> {
  const pending = new Map<string, GrantPost[]>();
  for (const post of input.posts) {
    const cover = ownedMediaItems(post.media, post.authorId)[0];
    if (!cover || !isSocialMuxMediaItem(cover)) continue;
    if (!socialMuxPlaybackRequiresTokens(cover.playbackPolicy)) continue;
    const rows = pending.get(cover.playbackId) ?? [];
    rows.push({ author_id: post.authorId, status: "active", media: post.media });
    pending.set(cover.playbackId, rows);
  }

  const urls = new Map<string, string>();
  for (const [playbackId, posts] of pending) {
    if (!socialMuxPlaybackReadGrant({ userId: input.userId, playbackId, posts })) continue;
    try {
      const tokens = await mintSocialMuxPlaybackTokens(playbackId);
      urls.set(playbackId, socialMuxThumbnailUrl(playbackId, tokens.thumbnail));
    } catch {
      // Fail closed. An empty src stays a closed face on the cell.
    }
  }
  return urls;
}

export function exploreMuxPosterSrc(
  item: { url: string; playbackId?: string; playbackPolicy?: SocialMuxPlaybackPolicy },
  posters: ReadonlyMap<string, string>,
): string {
  if (!item.playbackId) return "";
  if (socialMuxPlaybackRequiresTokens(item.playbackPolicy)) {
    return posters.get(item.playbackId) ?? "";
  }
  return item.url || socialMuxThumbnailUrl(item.playbackId);
}
