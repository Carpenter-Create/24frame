import type { SocialMediaItem } from "@/lib/social-media";

// Stories sit on the Pack 2 media spine. 24h live window. Unseen means
// the viewer has not finished every live story from that author.

export const STORY_TTL_HOURS = 24;

export function storyExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + STORY_TTL_HOURS * 60 * 60 * 1000);
}

export function isStoryLive(expiresAt: string, now = new Date()): boolean {
  const expires = new Date(expiresAt);
  if (Number.isNaN(expires.getTime())) return false;
  return expires.getTime() > now.getTime();
}

/** Oldest still-live item. Tray href uses this. Preview face stays newest. */
export function oldestLiveStoryId(
  rows: readonly { id: string; created_at: string }[],
): string | null {
  if (rows.length === 0) return null;
  let oldest = rows[0];
  if (!oldest) return null;
  for (const row of rows) {
    const byTime = Date.parse(row.created_at) - Date.parse(oldest.created_at);
    if (byTime < 0 || (byTime === 0 && row.id.localeCompare(oldest.id) < 0)) oldest = row;
  }
  return oldest.id;
}

export function storyRailUnseen(
  storyIds: readonly string[],
  viewedIds: ReadonlySet<string>,
): boolean {
  if (storyIds.length === 0) return false;
  return storyIds.some((id) => !viewedIds.has(id));
}

export function storyInsertRow(input: {
  authorId: string;
  body: string | null;
  media: SocialMediaItem[];
  now?: Date;
}) {
  return {
    author_id: input.authorId,
    body: input.body,
    media: input.media,
    status: "active" as const,
    expires_at: storyExpiresAt(input.now ?? new Date()).toISOString(),
  };
}

export function storyViewInsertRow(storyId: string, viewerId: string) {
  return {
    story_id: storyId,
    viewer_id: viewerId,
  };
}
