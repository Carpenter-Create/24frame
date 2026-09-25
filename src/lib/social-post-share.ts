import { socialMediaProxies } from "@/lib/social-edge";
import { bareHandle, SOCIAL, socialPostHref } from "@/lib/social";
import type { SocialMuxPlaybackPolicy } from "@/lib/social-mux";
import type { SocialMediaItem } from "@/lib/social-media";

// Post Share sheet lock v1.
// docs/design-locks/social-post-share-sheet-ig-lock-v1.md
// Optional note is the message body. Otherwise the body is
// "You sent @handle's post". Media stays on the posts lane.
// The marker carries the post id, author, and caption snip.
// Video playback is Mux-only — a file URL is not a card.

export const POST_DM_SHARE_KIND = "post-share";
export const POST_SHARE_CAPTION_SNIP = 120;
export const POST_SHARE_RECIPIENT_CAP = 16;
export const POST_SHARE_TOAST_MS = 2000;
export const POST_SHARE_CARD_WIDTH_CLASS = "w-[240px]";

export type PostShareMarker = {
  postId: string;
  authorId: string;
  authorHandle?: string;
  caption?: string;
};

export function postSendSystemLine(handle: string | null | undefined): string {
  const bare = bareHandle(handle ?? "");
  if (!bare) return SOCIAL.dms.sentPost;
  return SOCIAL.dms.youSentPost(bare);
}

export function postShareCaptionSnip(body: string | null | undefined): string | null {
  const flat = (body ?? "").replace(/\s+/g, " ").trim();
  if (!flat) return null;
  if (flat.length <= POST_SHARE_CAPTION_SNIP) return flat;
  const cut = flat.slice(0, POST_SHARE_CAPTION_SNIP);
  const lastSpace = cut.lastIndexOf(" ");
  const snip = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd();
  return `${snip}…`;
}

export function postSharePermalink(postId: string, origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${socialPostHref(postId)}`;
}

export function postSharePeerIds(raw: readonly unknown[]): { ok: true; ids: string[] } | { ok: false; error: "empty" | "cap" } {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const value of raw) {
    const id = String(value ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  if (ids.length === 0) return { ok: false, error: "empty" };
  if (ids.length > POST_SHARE_RECIPIENT_CAP) return { ok: false, error: "cap" };
  return { ok: true, ids };
}

export function postShareUiAfter(
  result: { error?: string } | null | undefined,
): { close: boolean; error: string } {
  if (result && !result.error) return { close: true, error: "" };
  return { close: false, error: result?.error || SOCIAL.post.shareFailed };
}

export function postShareToast(
  result: { error?: string } | null | undefined,
): { show: boolean; ms: number } {
  if (!postShareUiAfter(result).close) return { show: false, ms: 0 };
  return { show: true, ms: POST_SHARE_TOAST_MS };
}

export function postDmInsertRow(input: {
  senderId: string;
  conversationId: string;
  postId: string;
  authorId: string;
  authorHandle?: string;
  caption?: string | null;
  note?: string;
  media: SocialMediaItem[];
}) {
  const authorHandle = bareHandle(input.authorHandle ?? "");
  const note = input.note?.trim() ?? "";
  const caption = postShareCaptionSnip(input.caption);
  const marker: PostShareMarker & { kind: typeof POST_DM_SHARE_KIND } = {
    kind: POST_DM_SHARE_KIND,
    postId: input.postId,
    authorId: input.authorId,
    ...(authorHandle ? { authorHandle } : {}),
    ...(caption ? { caption } : {}),
  };
  return {
    sender_id: input.senderId,
    conversation_id: input.conversationId,
    body: note || postSendSystemLine(authorHandle),
    media: [...input.media, marker],
    status: "active" as const,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function readPostShareMarker(media: unknown): PostShareMarker | null {
  if (!Array.isArray(media)) return null;
  for (const raw of media) {
    if (!isRecord(raw) || raw.kind !== POST_DM_SHARE_KIND) continue;
    const { postId, authorId } = raw;
    if (typeof postId !== "string" || typeof authorId !== "string" || !postId || !authorId) return null;
    const authorHandle = typeof raw.authorHandle === "string" ? bareHandle(raw.authorHandle) : "";
    const caption = typeof raw.caption === "string" ? postShareCaptionSnip(raw.caption) : null;
    return {
      postId,
      authorId,
      ...(authorHandle ? { authorHandle } : {}),
      ...(caption ? { caption } : {}),
    };
  }
  return null;
}

export function parseDmPostShare(input: { body?: string | null; media?: unknown }): PostShareMarker | null {
  return readPostShareMarker(input.media);
}

export function dmPostComment(input: { body: string | null; media?: unknown }): string | null {
  const marker = readPostShareMarker(input.media);
  if (!marker) return null;
  const body = input.body?.trim() ?? "";
  if (!body) return null;
  if (body === SOCIAL.dms.sentPost || body === SOCIAL.dms.sentYouPost) return null;
  if (body === postSendSystemLine(marker.authorHandle)) return null;
  return body;
}

export type DmPostShareCard = {
  postId: string;
  authorId: string;
  authorHandle: string | null;
  caption: string | null;
  kind: "image" | "video" | null;
  url: string | null;
  playbackId?: string;
  playbackPolicy?: SocialMuxPlaybackPolicy;
};

/** First renderable still, or a Mux video. A file video is not a card. */
export function presentDmPostShare(input: {
  body: string | null;
  media?: unknown;
}): DmPostShareCard | null {
  const marker = readPostShareMarker(input.media);
  if (!marker) return null;
  const proxies = socialMediaProxies(input.media, marker.authorId, "posts");
  const chosen = proxies.find(
    (item) => item.kind === "image" || (item.kind === "video" && !!item.playbackId),
  );
  const video = chosen?.kind === "video" && chosen.playbackId ? chosen : null;
  const still = chosen?.kind === "image" ? chosen : null;
  return {
    postId: marker.postId,
    authorId: marker.authorId,
    authorHandle: marker.authorHandle ?? null,
    caption: marker.caption ?? null,
    kind: video ? "video" : still ? "image" : null,
    url: still ? still.url : null,
    playbackId: video?.playbackId,
    playbackPolicy: video?.playbackPolicy ?? still?.playbackPolicy,
  };
}

/** Inbox line for a post share. Null for an ordinary message. Never a URL. */
export function dmPostInboxExcerpt(input: {
  body: string | null;
  media?: unknown;
  senderId: string | null;
  viewerId: string;
}): string | null {
  const marker = readPostShareMarker(input.media);
  if (!marker) return null;
  const comment = dmPostComment(input);
  if (comment) return comment;
  if (marker.authorHandle) return postSendSystemLine(marker.authorHandle);
  if (input.senderId && input.senderId === input.viewerId) return SOCIAL.dms.sentPost;
  return SOCIAL.dms.sentYouPost;
}
