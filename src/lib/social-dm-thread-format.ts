import {
  bareHandle,
  conversationRoomLabel,
  SOCIAL,
  socialMemberHref,
  socialPersonIdentity,
  socialPersonLabel,
} from "@/lib/social";
import { storySendSystemLine } from "@/lib/social-dm-story";

// DM thread message format lock v1.
// docs/design-locks/dm-thread-message-format-lock-v1.md
// Chat column, not a center activity log. Day and time stay visible.
// Card geometry and "You sent @handle's story" stay Send craft v1.5.

export const DM_THREAD_ZONE = "America/Chicago";
export const DM_THREAD_BURST_GAP_MS = 5 * 60 * 1000;

// Immersive thread lock v1. Social header and phone dock are gone on
// this route, so the column is the viewport. Desktop stays 680 centered.
// docs/design-locks/dm-thread-immersive-real-estate-lock-v1.md
export const DM_THREAD_ROOT_CLASS =
  "mx-auto flex h-dvh max-h-dvh w-full max-w-[680px] flex-col overflow-hidden";

export const DM_THREAD_COLUMN_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#FAFAFB] px-4 text-ink";

export const DM_THREAD_LIST_CLASS = "mt-auto flex flex-col";

// House scale: 8 same-author, 16 other-author and day/time separators.
export const DM_THREAD_SAME_AUTHOR_GAP_CLASS = "mt-2";
export const DM_THREAD_OTHER_AUTHOR_GAP_CLASS = "mt-4";
export const DM_THREAD_SEPARATOR_GAP_CLASS = "mt-4";

export function dmThreadBlockGapClass(input: {
  kind: "day" | "time" | "group";
  senderId: string | null;
  previous: { kind: "separator" | "group"; senderId: string | null } | null;
}): string {
  const { previous } = input;
  if (!previous) return "";
  if (input.kind === "day" || input.kind === "time") {
    return previous.kind === "separator"
      ? DM_THREAD_SAME_AUTHOR_GAP_CLASS
      : DM_THREAD_SEPARATOR_GAP_CLASS;
  }
  if (previous.kind === "separator") return DM_THREAD_SEPARATOR_GAP_CLASS;
  return previous.senderId === input.senderId
    ? DM_THREAD_SAME_AUTHOR_GAP_CLASS
    : DM_THREAD_OTHER_AUTHOR_GAP_CLASS;
}

export const DM_THREAD_DAY_CLASS = "text-center t-body-sm text-ink-2";

export const DM_THREAD_TIME_CLASS = "text-center t-body-sm text-ink-2";

// Lock type is 0.9375rem. That step is house t-body-sm (--text-sm).
export const DM_THREAD_BUBBLE_MINE_CLASS =
  "max-w-[75%] rounded-[18px] bg-surface-muted px-[12px] py-[8px] t-body-sm text-ink break-words whitespace-pre-wrap";

export const DM_THREAD_BUBBLE_THEIRS_CLASS =
  "max-w-[75%] rounded-[18px] border border-hairline bg-surface px-[12px] py-[8px] t-body-sm text-ink break-words whitespace-pre-wrap";

export const DM_THREAD_SYSTEM_LINE_CLASS =
  "max-w-[168px] t-body-sm text-ink-2 break-words";

export const DM_THREAD_AVATAR_CLASS = "size-7 shrink-0";

// Composer strip is 48 (field row) + 8/8 before the safe-area inset.
// Surface is white. No phone dock sits under it.
export const DM_THREAD_COMPOSER_CLASS =
  "shrink-0 border-t border-hairline bg-surface px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]";

export const DM_THREAD_COMPOSER_ROW_CLASS = "flex h-12 items-center gap-2";

export const DM_THREAD_COMPOSER_FIELD_CLASS =
  "flex h-10 min-w-0 flex-1 items-center rounded-[20px] border border-hairline bg-surface-muted px-3";

export const DM_THREAD_COMPOSER_SEND_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast";

// Far-right media accessory. Hit 40, ink via text-ink. Glyph size is separate.
// docs/design-locks/dm-voice-note-lock-v1.md §B chrome only — Send stays left of the camera.
export const DM_THREAD_COMPOSER_CAMERA_GLYPH = 24;

export const DM_THREAD_COMPOSER_CAMERA_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center text-ink active:opacity-70";

// Header density geometry, hosted at the top of the thread viewport.
// Safe-area sits above the 48 row. Surface #FFFFFF is bg-surface.
export const DM_THREAD_HEADER_HOST_CLASS =
  "sticky top-0 z-10 w-full shrink-0 border-b border-hairline bg-surface pt-[env(safe-area-inset-top)] shadow-none";

export const DM_THREAD_HEADER_CLASS = "flex h-12 w-full items-center gap-2 px-4";

export const DM_THREAD_HEADER_BACK_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center text-ink";

export const DM_THREAD_HEADER_PEER_CLASS = "flex min-w-0 flex-1 items-center gap-2";

export const DM_THREAD_HEADER_AVATAR_CLASS = "size-8 shrink-0";

export const DM_THREAD_HEADER_LABEL_CLASS = "min-w-0 flex-1 truncate t-body-sm font-medium text-ink";

export type DmThreadHeaderPeer = {
  handle: string;
  displayName?: string | null;
  photoUrl?: string | null;
};

export type DmThreadHeaderModel = {
  label: string;
  href: string | null;
  photoUrl: string | null;
  avatarName: string;
};

// get_dm_inbox and the thread participant filter both drop the caller.
// A direct room with no other person is a note to self: show the viewer.
export function dmThreadHeaderPeers(input: {
  kind: string;
  peers: readonly DmThreadHeaderPeer[];
  self: DmThreadHeaderPeer | null;
}): readonly DmThreadHeaderPeer[] {
  if (input.kind === "direct" && input.peers.length === 0 && input.self && bareHandle(input.self.handle)) {
    return [input.self];
  }
  return input.peers;
}

// One other person: display name, or the bare handle when the name is empty.
// Never both, and never an @ in the bar. A room with several people keeps the
// title or joined names and has no single profile target.
export function dmThreadHeaderModel(input: {
  title?: string | null;
  peers: readonly DmThreadHeaderPeer[];
}): DmThreadHeaderModel {
  const peers = input.peers.filter((peer) => bareHandle(peer.handle));
  if (peers.length === 1) {
    const peer = peers[0];
    const identity = socialPersonIdentity({
      handle: peer.handle,
      displayName: peer.displayName,
    });
    return {
      label: identity.label,
      href: socialMemberHref(identity.handle),
      photoUrl: peer.photoUrl ?? null,
      avatarName: identity.avatarName,
    };
  }
  const first = peers[0];
  return {
    label: conversationRoomLabel(
      input.title,
      peers.map((peer) => socialPersonLabel({ handle: peer.handle, displayName: peer.displayName })),
    ),
    href: null,
    photoUrl: first?.photoUrl ?? null,
    avatarName: first
      ? socialPersonLabel({ handle: first.handle, displayName: first.displayName })
      : "",
  };
}

export type DmThreadAlign = "mine" | "theirs";

export type DmThreadClusterMessage = {
  id: string;
  senderId: string | null;
  createdAt: string;
  mine: boolean;
};

export type DmThreadBlock<T extends DmThreadClusterMessage> =
  | { kind: "day"; key: string; label: string }
  | { kind: "time"; key: string; label: string }
  | { kind: "group"; key: string; mine: boolean; showAvatar: boolean; messages: T[] };

export function dmThreadAlign(mine: boolean): DmThreadAlign {
  return mine ? "mine" : "theirs";
}

export function dmThreadShowsAvatar(mine: boolean): boolean {
  return !mine;
}

export function dmThreadSideClass(mine: boolean): string {
  return mine
    ? "flex w-full justify-end"
    : "flex w-full items-start justify-start gap-2";
}

export function dmThreadStackClass(mine: boolean): string {
  return mine
    ? "flex min-w-0 w-full flex-col items-end gap-2"
    : "flex min-w-0 flex-1 flex-col items-start gap-2";
}

export function dmThreadBubbleClass(mine: boolean): string {
  return mine ? DM_THREAD_BUBBLE_MINE_CLASS : DM_THREAD_BUBBLE_THEIRS_CLASS;
}

export function dmThreadSystemLineAlignClass(mine: boolean): string {
  return mine ? "w-[168px] text-right" : "w-[168px] text-left";
}

/** Side-aligned share line. Mine keeps Send craft v1.5. Theirs names the sender when the author handle is known. */
export function dmThreadStorySystemLine(input: {
  mine: boolean;
  authorHandle: string | null;
  senderName: string | null;
}): string | null {
  const handle = bareHandle(input.authorHandle ?? "");
  if (input.mine) return handle ? storySendSystemLine(handle) : null;
  const name = input.senderName?.trim() ?? "";
  if (name && handle) return SOCIAL.dms.theySentAuthorStory(name, handle);
  return SOCIAL.dms.sentYouStory;
}

function chicagoParts(date: Date, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat("en-US", { timeZone: DM_THREAD_ZONE, ...options }).formatToParts(date);
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((item) => item.type === type)?.value ?? "";
}

export function chicagoDayKey(date: Date): string {
  const parts = chicagoParts(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

/** Calendar yesterday in Chicago. A 25-hour fallback day is not "24 hours ago". */
export function previousChicagoDayKey(now: Date): string {
  const today = chicagoDayKey(now);
  let probe = now.getTime();
  for (let hour = 0; hour < 48; hour += 1) {
    probe -= 60 * 60 * 1000;
    const key = chicagoDayKey(new Date(probe));
    if (key !== today) return key;
  }
  return chicagoDayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

export function dmThreadDayLabel(at: Date, now: Date): string {
  const key = chicagoDayKey(at);
  if (key === chicagoDayKey(now)) return "Today";
  if (key === previousChicagoDayKey(now)) return "Yesterday";
  const parts = chicagoParts(at, { month: "short", day: "numeric", year: "numeric" });
  return `${part(parts, "month")} ${part(parts, "day")}, ${part(parts, "year")}`;
}

export function dmThreadTimeLabel(at: Date): string {
  const parts = chicagoParts(at, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${part(parts, "hour")}:${part(parts, "minute")} ${part(parts, "dayPeriod")}`;
}

function parsedAt(createdAt: string): number | null {
  const ms = Date.parse(createdAt);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Chronological messages (oldest first, as loadDmThreadMessages returns).
 * Day header when the Chicago day changes, including the first message.
 * Time header when the gap is at least 5 minutes, or the item is first after a day header.
 * A sender change starts a new group. Under 5 minutes it does not add a time header.
 */
function pushDmThreadGroup<T extends DmThreadClusterMessage>(
  blocks: DmThreadBlock<T>[],
  group: T[],
) {
  if (group.length === 0) return;
  const first = group[0];
  blocks.push({
    kind: "group",
    key: `group:${first.id}`,
    mine: first.mine,
    showAvatar: dmThreadShowsAvatar(first.mine),
    messages: group,
  });
}

export function clusterDmThreadMessages<T extends DmThreadClusterMessage>(
  messages: readonly T[],
  now: Date = new Date(),
): DmThreadBlock<T>[] {
  const blocks: DmThreadBlock<T>[] = [];
  let group: T[] = [];
  let lastAt: number | null = null;
  let lastDay: string | null = null;

  for (const message of messages) {
    const at = parsedAt(message.createdAt);
    if (at === null) {
      pushDmThreadGroup(blocks, group);
      group = [];
      lastAt = null;
      lastDay = null;
      pushDmThreadGroup(blocks, [message]);
      continue;
    }

    const day = chicagoDayKey(new Date(at));
    const dayChanged = lastDay !== null && day !== lastDay;
    const first = lastAt === null || lastDay === null;
    const gap = lastAt === null ? DM_THREAD_BURST_GAP_MS : at - lastAt;
    const senderChanged = group.length > 0 && group[0].senderId !== message.senderId;
    const stamp = new Date(at);

    if (first || dayChanged) {
      pushDmThreadGroup(blocks, group);
      blocks.push({ kind: "day", key: `day:${day}:${message.id}`, label: dmThreadDayLabel(stamp, now) });
      blocks.push({ kind: "time", key: `time:${message.id}`, label: dmThreadTimeLabel(stamp) });
      group = [message];
    } else if (gap >= DM_THREAD_BURST_GAP_MS) {
      pushDmThreadGroup(blocks, group);
      blocks.push({ kind: "time", key: `time:${message.id}`, label: dmThreadTimeLabel(stamp) });
      group = [message];
    } else if (senderChanged) {
      pushDmThreadGroup(blocks, group);
      group = [message];
    } else {
      group = [...group, message];
    }

    lastAt = at;
    lastDay = day;
  }

  pushDmThreadGroup(blocks, group);
  return blocks;
}
