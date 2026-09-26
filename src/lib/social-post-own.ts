import { POST_BODY_MAX, SOCIAL } from "@/lib/social";

// Own-post caption edit and soft-delete. Stories stay out. Media
// replace stays out — the write row never carries media or a new author.

export function postHasMedia(media: unknown): boolean {
  return Array.isArray(media) && media.length > 0;
}

export function postCaptionWrite(
  raw: string,
  hasMedia: boolean,
): { body: string | null } | { error: string } {
  const body = raw.trim();
  if (body.length > POST_BODY_MAX) return { error: SOCIAL.post.editTooLong };
  if (body.length === 0) {
    if (!hasMedia) return { error: SOCIAL.home.emptyPost };
    return { body: null };
  }
  return { body };
}

/** Session user must be the author. UI hiding is not the gate. */
export function postAuthorRefusal(actorId: string, authorId: string): string | null {
  if (actorId !== authorId) return SOCIAL.post.notAuthor;
  return null;
}

export function socialPostOwnedBy(authorId: string, viewerId: string | null | undefined): boolean {
  return Boolean(viewerId) && authorId === viewerId;
}

export function postCaptionUpdateRow(body: string | null, editedAt: string) {
  return { body, edited_at: editedAt };
}

export function postSoftDeleteUpdateRow() {
  return { status: "removed" as const };
}

type PostOwnListener = () => void;

const postOwnListeners = new Set<PostOwnListener>();
const hiddenPostIds = new Set<string>();
const captionOverrides = new Map<string, string | null>();

function emitPostOwn() {
  for (const listener of postOwnListeners) listener();
}

export function subscribeSocialPostOwn(listener: PostOwnListener): () => void {
  postOwnListeners.add(listener);
  return () => {
    postOwnListeners.delete(listener);
  };
}

export function hideSocialPost(postId: string): void {
  hiddenPostIds.add(postId);
  emitPostOwn();
}

export function readSocialPostHidden(postId: string): boolean {
  return hiddenPostIds.has(postId);
}

export function rememberSocialPostCaption(postId: string, body: string | null): void {
  captionOverrides.set(postId, body);
  emitPostOwn();
}

/** Undefined means the server caption still stands. */
export function readSocialPostCaption(postId: string): string | null | undefined {
  return captionOverrides.has(postId) ? captionOverrides.get(postId) : undefined;
}

export function socialPostLiveBody(postId: string, serverBody: string | null): string | null {
  const overlay = readSocialPostCaption(postId);
  return overlay === undefined ? serverBody : overlay;
}
