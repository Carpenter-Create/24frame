import { isNotificationChannelOn, type NotificationPrefs } from "@/lib/notification-prefs";
import { displayHandle, SOCIAL, socialProfileHref } from "@/lib/social";

export function isFollowUniqueViolation(error: { message: string; code?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || error.message.toLowerCase().includes("duplicate");
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
