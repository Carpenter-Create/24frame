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

// Lock canvas #FAFAFB. House --bg and --surface are #FFFFFF.
// --surface-muted is the mine bubble (#F4F4F6), not this canvas.
// Lock E: the thread fills the house lead. A min-height column leaves
// the composer in normal flow with empty space below it.
// 2rem is the social frame's py-4. Phone dest clearance is the shell's
// 6.5rem pad plus the safe area, on max-md only.
export const DM_THREAD_ROOT_CLASS =
  "flex h-[calc(100dvh-var(--header-height)-2rem)] max-h-[calc(100dvh-var(--header-height)-2rem)] w-full flex-col overflow-hidden max-md:h-[calc(100dvh-var(--header-height)-2rem-6.5rem-env(safe-area-inset-bottom))] max-md:max-h-[calc(100dvh-var(--header-height)-2rem-6.5rem-env(safe-area-inset-bottom))]";

export const DM_THREAD_COLUMN_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-[#FAFAFB] px-4 text-ink";

export const DM_THREAD_LIST_CLASS = "mt-auto flex flex-col gap-2";

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

export const DM_THREAD_COMPOSER_CLASS =
  "shrink-0 flex flex-col gap-2 bg-[#FAFAFB] px-4 py-2";

export const DM_THREAD_COMPOSER_ROW_CLASS = "flex items-center gap-2";

export const DM_THREAD_COMPOSER_FIELD_CLASS =
  "flex h-10 min-w-0 flex-1 items-center rounded-[20px] border border-hairline bg-surface-muted px-3";

export const DM_THREAD_COMPOSER_SEND_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast";

// Header density lock v1. Phone and desktop share this row.
// docs/design-locks/dm-thread-header-density-lock-v1.md
// Surface #FFFFFF and hairline #ECEDF0 are bg-surface / border-hairline.
// Ink is text-ink. 0.9375rem is t-body-sm. Truncate is this label only.
export const DM_THREAD_HEADER_CLASS =
  "sticky top-0 z-10 flex h-12 w-full shrink-0 items-center gap-2 border-b border-hairline bg-surface px-4 shadow-none";

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
    ? "flex min-w-0 w-full flex-col items-end gap-1"
    : "flex min-w-0 flex-1 flex-col items-start gap-1";
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
