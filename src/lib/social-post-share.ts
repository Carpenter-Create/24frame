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

const POST_SHARE_ATTEMPT_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export function postShareAttemptId(raw: string): string | null {
  const id = raw.trim();
  if (!POST_SHARE_ATTEMPT_RE.test(id)) return null;
  return id;
}

/** Recent DMs, followees, and self — the same people the sheet can list. */
export function postSharePeerAllowed(peerId: string, allowlist: ReadonlySet<string>): boolean {
  return peerId.length > 0 && allowlist.has(peerId);
}

/**
 * Wall posts (no group) are visible to any authenticated member.
 * A group post is visible only when can_access_group_content is true.
 * Missing group id or a failed access check refuses the peer.
 * Adam 2026-09-25: do not send media or keys to a non-member.
 * docs/design-locks/social-post-share-sheet-ig-lock-v1.md
 */
export function recipientMayViewPost(input: {
  groupId: string | null | undefined;
  access: boolean | null;
}): boolean {
  if (input.groupId === null) return true;
  if (!input.groupId) return false;
  return input.access === true;
}

/** jsonb `@>` value. A JSON string survives postgrest-js array serialization. */
export function postShareAttemptContains(postId: string, attemptId: string): string {
  return JSON.stringify([{ kind: POST_DM_SHARE_KIND, postId, attemptId }]);
}

export function postShareFailureCopy(names: readonly string[]): string {
  const clean = names.map((name) => name.trim()).filter(Boolean);
  if (clean.length === 0) return SOCIAL.post.shareFailed;
  return SOCIAL.post.shareFailedPeers(clean.join(", "));
}

export function postShareSheetError(
  result: { error?: string; failedPeerIds?: string[] } | null | undefined,
  people: readonly { id: string; name: string }[],
): { error?: string; failedPeerIds?: string[] } {
  const failed = result?.failedPeerIds ?? [];
  if (!result || failed.length === 0) return result ?? { error: SOCIAL.post.shareFailed };
  const names = failed.flatMap((id) => {
    const person = people.find((item) => item.id === id);
    return person?.name ? [person.name] : [];
  });
  if (names.length === 0) return result;
  return { ...result, error: postShareFailureCopy(names) };
}

export function postShareUiAfter(
  result: { error?: string; failedPeerIds?: string[] } | null | undefined,
): { close: boolean; error: string } {
  const failed = result?.failedPeerIds ?? [];
  if (failed.length > 0) return { close: false, error: result?.error || SOCIAL.post.shareFailed };
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
  attemptId?: string;
  media: SocialMediaItem[];
}) {
  const authorHandle = bareHandle(input.authorHandle ?? "");
  const note = input.note?.trim() ?? "";
  const caption = postShareCaptionSnip(input.caption);
  const attemptId = input.attemptId ? postShareAttemptId(input.attemptId) : null;
  const marker: PostShareMarker & { kind: typeof POST_DM_SHARE_KIND; attemptId?: string } = {
    kind: POST_DM_SHARE_KIND,
    postId: input.postId,
    authorId: input.authorId,
    ...(attemptId ? { attemptId } : {}),
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
  const mine = !!input.senderId && input.senderId === input.viewerId;
  if (mine && marker.authorHandle) return postSendSystemLine(marker.authorHandle);
  if (mine) return SOCIAL.dms.sentPost;
  return SOCIAL.dms.sentYouPost;
}
