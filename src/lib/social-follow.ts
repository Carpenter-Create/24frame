import { isNotificationChannelOn, type NotificationPrefs } from "@/lib/notification-prefs";
import { displayHandle, handleDisplay, SOCIAL, socialProfileHref } from "@/lib/social";

/** Follow confirm auto-clears. Unfollow clears immediately. */
export const FOLLOW_CONFIRM_MS = 3500;

export function isFollowUniqueViolation(error: { message: string; code?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || error.message.toLowerCase().includes("duplicate");
}

/** Actor-facing inline toast after a follow persist. Not used for unfollow. */
export function followedConfirmCopy(handle: string): string {
  return `${SOCIAL.follow.following} ${displayHandle(handle)}`;
}

export function followButtonLabel(following: boolean, followsYou = false): string {
  if (following) return SOCIAL.follow.following;
  if (followsYou) return SOCIAL.follow.followBack;
  return SOCIAL.follow.follow;
}

export function socialFollowsSearchMatches(
  person: { handle: string; display_name?: string | null },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const handle = handleDisplay(person.handle).toLowerCase();
  const name = (person.display_name ?? "").trim().toLowerCase();
  return handle.includes(needle) || name.includes(needle);
}

export function filterSocialFollowsPeople<T extends { handle: string; display_name?: string | null }>(
  people: readonly T[],
  query: string,
): T[] {
  const needle = query.trim();
  if (!needle) return [...people];
  return people.filter((person) => socialFollowsSearchMatches(person, needle));
}

export function shouldNotifyNewFollower(prefs: NotificationPrefs): boolean {
  return isNotificationChannelOn(prefs, "new_follower", "in_app");
}

export function newFollowerNoticeCopy(handle: string): { title: string; body: string } {
  return {
    title: SOCIAL.follow.newFollowerTitle,
    body: `${displayHandle(handle)} followed you`,
  };
}

export function newFollowerSourceRefs(input: { actorId: string; handle: string }): {
  actor_id: string;
  handle: string;
  path: string;
} {
  return {
    actor_id: input.actorId,
    handle: input.handle,
    path: socialProfileHref(input.handle),
  };
}
