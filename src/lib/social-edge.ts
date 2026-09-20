import {
  isSocialMuxMediaItem,
  ownedMediaItems,
  type SocialMediaLane,
} from "@/lib/social-media";
import { socialMuxThumbnailUrl } from "@/lib/social-mux";

// Auth-light Social reads can run on Vercel Edge. AWS signing cannot.
// Same-origin Node routes re-sign avatars/media so the Edge HTML does
// not import @aws-sdk. No new env — KV / Upstash names stay as on main.

export const SOCIAL_EDGE_RUNTIME = "edge" as const;
export const SOCIAL_NODE_RUNTIME = "nodejs" as const;

export const SOCIAL_AVATAR_ROUTE = "/api/social/avatar";
export const SOCIAL_MEDIA_ROUTE = "/api/social/media";

export function socialAvatarHref(userId: string): string {
  return `${SOCIAL_AVATAR_ROUTE}/${userId}`;
}

export function socialMediaHref(key: string): string {
  return `${SOCIAL_MEDIA_ROUTE}?key=${encodeURIComponent(key)}`;
}

export function socialAvatarFaces(userIds: readonly string[]): Map<string, string> {
  return new Map(userIds.filter(Boolean).map((id) => [id, socialAvatarHref(id)]));
}

export type SocialEdgeMediaItem = {
  kind: "image" | "video";
  url: string;
  contentType: string;
  playbackId?: string;
};

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
