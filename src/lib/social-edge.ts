import {
  isSocialMuxMediaItem,
  ownedMediaItems,
  type SocialMediaContentType,
  type SocialMediaLane,
} from "@/lib/social-media";
import {
  socialMuxPlaybackRequiresTokens,
  socialMuxThumbnailUrl,
  type SocialMuxPlaybackPolicy,
} from "@/lib/social-mux";

// Auth-light Social reads can run on Vercel Edge. AWS signing cannot.
// Same-origin Node routes re-sign avatars/media so the Edge HTML does
// not import @aws-sdk. No new env — KV / Upstash names stay as on main.

export const SOCIAL_EDGE_RUNTIME = "edge" as const;
export const SOCIAL_NODE_RUNTIME = "nodejs" as const;

export const SOCIAL_AVATAR_ROUTE = "/api/social/avatar";
export const SOCIAL_MEDIA_ROUTE = "/api/social/media";
/** Owner cover bytes. Streams the object; never a redirect to the CDN. */
export const SOCIAL_COVER_BYTES_ROUTE = "/api/social/cover";

export function socialAvatarHref(userId: string): string {
  return `${SOCIAL_AVATAR_ROUTE}/${userId}`;
}

export function socialMediaHref(key: string): string {
  return `${SOCIAL_MEDIA_ROUTE}?key=${encodeURIComponent(key)}`;
}

export function socialAvatarFaces(userIds: readonly string[]): Map<string, string> {
  return new Map(userIds.filter(Boolean).map((id) => [id, socialAvatarHref(id)]));
}

/** Display SoT. Same name callers already import from s3-avatars. Never RSA. */
export function signedAvatarUrls(userIds: readonly string[]): Map<string, string | null> {
  return socialAvatarFaces(userIds);
}

export type SocialEdgeMediaItem = {
  kind: "image" | "video";
  url: string;
  contentType: SocialMediaContentType;
  playbackId?: string;
  playbackPolicy?: SocialMuxPlaybackPolicy;
};

/** Rail / neighbor cover. Same proxy as playback. Video stays a still (no second CDN). */
export function socialStoryRailCover(
  media: unknown,
  authorId: string,
): { kind: "image" | "video"; url: string } | null {
  const first = socialMediaProxies(media, authorId, "stories")[0];
  if (!first?.url) return null;
  // Public / legacy Mux stills are the unsigned thumbnail (#676).
  // Signed playback 403s that URL. Do not paint it as an image.
  if (first.playbackId) {
    if (socialMuxPlaybackRequiresTokens(first.playbackPolicy)) return null;
    return { kind: "image", url: first.url };
  }
  return { kind: first.kind, url: first.url };
}

export function socialMediaProxies(
  media: unknown,
  authorId: string,
  lane: SocialMediaLane = "posts",
): SocialEdgeMediaItem[] {
  return ownedMediaItems(media, authorId, lane).map((item) =>
    isSocialMuxMediaItem(item)
      ? {
          kind: item.kind,
          url: socialMuxThumbnailUrl(item.playbackId),
          contentType: item.contentType,
          playbackId: item.playbackId,
          ...(item.playbackPolicy ? { playbackPolicy: item.playbackPolicy } : {}),
        }
      : {
          kind: item.kind,
          url: socialMediaHref(item.key),
          contentType: item.contentType,
        },
  );
}

export function socialMediaProxiesByPostId(
  posts: readonly { id: string; author_id: string; media: unknown }[],
): Map<string, SocialEdgeMediaItem[]> {
  return new Map(posts.map((post) => [post.id, socialMediaProxies(post.media, post.author_id)]));
}

/** Display SoT. Same name callers already import from s3-social-media. Never RSA. */
export function signedSocialMediaByPostId(
  posts: readonly { id: string; author_id: string; media: unknown }[],
): Map<string, SocialEdgeMediaItem[]> {
  return socialMediaProxiesByPostId(posts);
}
