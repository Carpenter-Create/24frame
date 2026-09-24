import { SOCIAL } from "@/lib/social";

// Stories viewer IG actions lock v1. Heart is per story item.
// Count is hidden at 0. Send closes only after one DM succeeds.
// Craft v1.1: the sent toast is 2000ms and only after that close.

export const STORY_SEND_TOAST_MS = 2000;

export type SocialStoryLikeState = {
  liked: boolean;
  count: number;
};

export type StorySendPerson = {
  id: string;
  name: string;
  handle: string;
  photoUrl: string | null;
};

export function nextStoryHeart(state: SocialStoryLikeState): SocialStoryLikeState {
  const liked = !state.liked;
  return {
    liked,
    count: Math.max(0, state.count + (liked ? 1 : -1)),
  };
}

export function storyHeartCountVisible(count: number): boolean {
  return count > 0;
}

export function storySendUiAfter(
  result: { error?: string } | null | undefined,
): { close: boolean; error: string } {
  if (result && !result.error) return { close: true, error: "" };
  return { close: false, error: result?.error || SOCIAL.stories.sendFailed };
}

/**
 * Send craft v1.5. An open Send drawer owns the story surface.
 * No auto-advance, no next item, no next author, no tray hop.
 * Hold and the manual pause still block auto-advance after the drawer closes.
 */
export function storyAdvanceWhileSending(
  sheetOpen: boolean,
  reason: "auto" | "manual",
  playbackHeld: boolean,
): boolean {
  if (sheetOpen) return false;
  if (reason === "auto" && playbackHeld) return false;
  return true;
}

/** Toast only when the sheet is about to close. Failure keeps the sheet. */
export function storySendToast(
  result: { error?: string } | null | undefined,
): { show: boolean; ms: number } {
  if (!storySendUiAfter(result).close) return { show: false, ms: 0 };
  return { show: true, ms: STORY_SEND_TOAST_MS };
}

/** Recent direct peers first, then people you follow, then self if still missing. One id each. */
export function storySendPeopleOrder(input: {
  recentPeerIds: readonly (string | null)[];
  followeeIds: readonly string[];
  selfId: string;
}): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const id of [...input.recentPeerIds, ...input.followeeIds, input.selfId]) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

export function storySendPeopleQuery(
  people: readonly StorySendPerson[],
  query: string,
): StorySendPerson[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...people];
  return people.filter((person) => {
    return (
      person.name.toLowerCase().includes(needle) ||
      person.handle.toLowerCase().includes(needle)
    );
  });
}
