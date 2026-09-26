import { socialMediaProxies } from "@/lib/social-edge";
import {
  parsePostMedia,
  parseSocialMediaObjectKey,
  type SocialMediaItem,
} from "@/lib/social-media";
import { bareHandle, SOCIAL, socialStoryHref } from "@/lib/social";
import { isStoryLive } from "@/lib/social-stories";

// Send-story DM craft v1.4.
// Optional note is the message body. Otherwise the body is
// "You sent @handle's story". Media stays. Author handle rides on the
// story-share marker so the thread can draw the system line without a URL.

export const STORY_DM_SHARE_KIND = "story-share";

export type StoryShareMarker = {
  storyId: string;
  authorId: string;
  expiresAt: string;
  authorHandle?: string;
};

export function storySendSystemLine(handle: string | null | undefined): string {
  const bare = bareHandle(handle ?? "");
  if (!bare) return SOCIAL.dms.sentStory;
  return SOCIAL.dms.youSentStory(bare);
}

export function storyDmInsertRow(input: {
  senderId: string;
  conversationId: string;
  storyId: string;
  authorId: string;
  expiresAt: string;
  authorHandle?: string;
  note?: string;
  media: SocialMediaItem[];
}) {
  const authorHandle = bareHandle(input.authorHandle ?? "");
  const note = input.note?.trim() ?? "";
  const marker: StoryShareMarker & { kind: typeof STORY_DM_SHARE_KIND } = {
    kind: STORY_DM_SHARE_KIND,
    storyId: input.storyId,
    authorId: input.authorId,
    expiresAt: input.expiresAt,
    ...(authorHandle ? { authorHandle } : {}),
  };
  return {
    sender_id: input.senderId,
    conversation_id: input.conversationId,
    body: note || storySendSystemLine(authorHandle),
    media: [...input.media, marker],
    status: "active" as const,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function readStoryShareMarker(media: unknown): StoryShareMarker | null {
  if (!Array.isArray(media)) return null;
  for (const raw of media) {
    if (!isRecord(raw) || raw.kind !== STORY_DM_SHARE_KIND) continue;
    const { storyId, authorId, expiresAt } = raw;
    if (typeof storyId !== "string" || typeof authorId !== "string" || typeof expiresAt !== "string") {
      return null;
    }
    if (!storyId || !authorId || !expiresAt) return null;
    const authorHandle = typeof raw.authorHandle === "string" ? bareHandle(raw.authorHandle) : "";
    return { storyId, authorId, expiresAt, ...(authorHandle ? { authorHandle } : {}) };
  }
  return null;
}

/** Legacy rows stored socialStoryHref in the body. Never display that string. */
export function storyIdFromDmBody(body: string | null | undefined): string | null {
  if (!body) return null;
  let path = body.trim();
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      path = new URL(path).pathname;
    } catch {
      return null;
    }
  }
  const match = path.match(/^\/social\/stories\/([^/]+)\/?$/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export type ParsedDmStoryShare = {
  storyId: string | null;
  authorId: string | null;
  expiresAt: string | null;
  authorHandle: string | null;
  legacy: boolean;
};

export function parseDmStoryShare(input: {
  body: string | null;
  media?: unknown;
}): ParsedDmStoryShare | null {
  const marker = readStoryShareMarker(input.media);
  const legacyId = storyIdFromDmBody(input.body);
  if (!marker && !legacyId) return null;
  const authorFromKey = parsePostMedia(input.media)
    .map((item) => parseSocialMediaObjectKey(item.key)?.userId)
    .find((id): id is string => !!id);
  return {
    storyId: marker?.storyId ?? legacyId,
    authorId: marker?.authorId ?? authorFromKey ?? null,
    expiresAt: marker?.expiresAt ?? null,
    authorHandle: marker?.authorHandle ?? null,
    legacy: !marker && !!legacyId,
  };
}

/** Typed note above the card. The system line and legacy calm lines are not notes. */
export function dmStoryComment(input: { body: string | null; media?: unknown }): string | null {
  if (!parseDmStoryShare(input)) return null;
  const body = input.body?.trim() ?? "";
  if (!body || storyIdFromDmBody(body)) return null;
  if (body === SOCIAL.dms.sentStory || body === SOCIAL.dms.sentYouStory) return null;
  const handle = readStoryShareMarker(input.media)?.authorHandle;
  if (handle && body === storySendSystemLine(handle)) return null;
  return body;
}

export type DmStoryLive = {
  status: string;
  expiresAt: string;
  authorId: string;
};

export type DmStoryShareCard = {
  storyId: string | null;
  authorId: string | null;
  unavailable: boolean;
  kind: "image" | "video" | null;
  url: string | null;
  playbackId?: string;
  playbackPolicy?: "public" | "signed";
  href: string | null;
};

export function presentDmStoryShare(input: {
  body: string | null;
  media?: unknown;
  live?: DmStoryLive | null;
  now?: Date;
}): DmStoryShareCard | null {
  const parsed = parseDmStoryShare(input);
  if (!parsed) return null;
  const authorId = parsed.authorId ?? input.live?.authorId ?? null;
  const expiresAt = parsed.expiresAt ?? input.live?.expiresAt ?? null;
  const removed = input.live ? input.live.status !== "active" : false;
  const expired = expiresAt ? !isStoryLive(expiresAt, input.now) : false;
  const unknownLegacy = parsed.legacy && !input.live && !parsed.expiresAt;
  const proxies = authorId ? socialMediaProxies(input.media, authorId, "stories") : [];
  const item = proxies[0] ?? null;
  const unavailable = removed || expired || unknownLegacy || !authorId || !item;
  const kind = unavailable || !item ? null : item.kind;
  const storyId = parsed.storyId;
  return {
    storyId,
    authorId,
    unavailable,
    kind,
    url: kind && item ? item.url : null,
    playbackId: kind === "video" ? item?.playbackId : undefined,
    ...(kind === "video" && item?.playbackPolicy ? { playbackPolicy: item.playbackPolicy } : {}),
    href: kind === "image" && storyId ? socialStoryHref(storyId) : null,
  };
}

/** Inbox line for a story share. Null for an ordinary message. Never a URL. */
export function dmStoryInboxExcerpt(input: {
  body: string | null;
  media?: unknown;
  senderId: string | null;
  viewerId: string;
}): string | null {
  if (!parseDmStoryShare(input)) return null;
  const comment = dmStoryComment(input);
  if (comment) return comment;
  const handle = readStoryShareMarker(input.media)?.authorHandle;
  if (handle) return storySendSystemLine(handle);
  if (input.senderId && input.senderId === input.viewerId) return SOCIAL.dms.sentStory;
  return SOCIAL.dms.sentYouStory;
}
