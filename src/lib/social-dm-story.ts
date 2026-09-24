import { socialMediaProxies } from "@/lib/social-edge";
import {
  parsePostMedia,
  parseSocialMediaObjectKey,
  type SocialMediaItem,
} from "@/lib/social-media";
import { SOCIAL, socialStoryHref } from "@/lib/social";
import { isStoryLive } from "@/lib/social-stories";

// Send-story DM craft v1.1.
// Body is the calm line. Media items stay. Story id, author, and expiry
// ride beside those items so the thread never needs the story URL.
// No new column. No prod SQL.

export const STORY_DM_SHARE_KIND = "story-share";

export type StoryShareMarker = {
  storyId: string;
  authorId: string;
  expiresAt: string;
};

export function storyDmInsertRow(input: {
  senderId: string;
  conversationId: string;
  storyId: string;
  authorId: string;
  expiresAt: string;
  media: SocialMediaItem[];
}) {
  const marker: StoryShareMarker & { kind: typeof STORY_DM_SHARE_KIND } = {
    kind: STORY_DM_SHARE_KIND,
    storyId: input.storyId,
    authorId: input.authorId,
    expiresAt: input.expiresAt,
  };
  return {
    sender_id: input.senderId,
    conversation_id: input.conversationId,
    body: SOCIAL.dms.sentStory,
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
    return { storyId, authorId, expiresAt };
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
    legacy: !marker && !!legacyId,
  };
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
  if (input.senderId && input.senderId === input.viewerId) return SOCIAL.dms.sentStory;
  return SOCIAL.dms.sentYouStory;
}
