import { bareHandle, socialPersonLabel } from "@/lib/social";
import { DM_MEMBERSHIP_CAP, dmMembershipCanSelectMore } from "@/lib/social-dm-membership";

// DM compose immersive IA v1.1.
// docs/design-locks/dm-compose-immersive-ia-lock-v1.md
// Screen A is a 1:1. Screen B is a fresh multi-party DM.
// Column matches the immersive thread: 680, house light, no shell.

export const DM_COMPOSE_SKELETON_ROWS = 6;

export type DmComposeMode = "direct" | "group";

export type DmComposePerson = {
  id: string;
  handle: string;
  name: string;
  photoUrl: string | null;
};

export function dmComposePersonFromProfile(input: {
  id: string;
  handle: string;
  displayName?: string | null;
  photoUrl?: string | null;
}): DmComposePerson {
  return {
    id: input.id,
    handle: bareHandle(input.handle),
    name: socialPersonLabel({ handle: input.handle, displayName: input.displayName }),
    photoUrl: input.photoUrl ?? null,
  };
}

export const DM_COMPOSE_ROOT_CLASS =
  "mx-auto flex h-dvh max-h-dvh w-full max-w-[680px] flex-col overflow-hidden bg-[#FAFAFB] text-ink shadow-none";

export const DM_COMPOSE_HEADER_HOST_CLASS =
  "sticky top-0 z-10 w-full shrink-0 border-b border-hairline bg-surface pt-[env(safe-area-inset-top)] shadow-none";

export const DM_COMPOSE_HEADER_CLASS = "relative flex h-12 w-full items-center px-4";

export const DM_COMPOSE_HEADER_BACK_CLASS =
  "inline-flex size-10 shrink-0 items-center justify-center text-ink";

export const DM_COMPOSE_HEADER_TITLE_CLASS =
  "pointer-events-none absolute inset-x-16 text-center t-body font-medium text-ink";

export const DM_COMPOSE_TO_CLASS = "flex min-h-10 flex-wrap items-center gap-2 px-4";

export const DM_COMPOSE_TO_LABEL_CLASS = "shrink-0 t-body text-ink";

export const DM_COMPOSE_CHIP_CLASS =
  "inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-surface-muted py-0.5 pl-0.5 pr-1";

export const DM_COMPOSE_CHIP_AVATAR_CLASS = "size-6 shrink-0";

export const DM_COMPOSE_ENTRY_CLASS = "flex w-full items-center gap-2 px-4 py-2 text-left text-ink";

export const DM_COMPOSE_ENTRY_ICON_CLASS =
  "flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink";

export const DM_COMPOSE_NAME_CLASS =
  "mx-4 mb-2 flex h-10 items-center rounded-[8px] border border-hairline bg-surface px-4";

export const DM_COMPOSE_SUGGESTED_LABEL_CLASS = "px-4 pb-2 pt-4 t-label text-ink-2";

export const DM_COMPOSE_LIST_CLASS = "min-h-0 flex-1 overflow-y-auto overscroll-contain";

export const DM_COMPOSE_CTA_HOST_CLASS =
  "shrink-0 border-t border-hairline bg-surface px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-none";

/** Screen A keeps a single chip. A second tap replaces it. Multi-select is Screen B. */
export function dmDirectSelected<T extends { id: string }>(current: readonly T[], person: T): T[] {
  if (current.length === 1 && current[0]?.id === person.id) return [current[0]];
  return [person];
}

/** Screen B toggle. At the cap, a new person does not join. */
export function dmGroupSelected<T extends { id: string }>(
  current: readonly T[],
  person: T,
  cap = DM_MEMBERSHIP_CAP,
): T[] {
  if (current.some((item) => item.id === person.id)) {
    return current.filter((item) => item.id !== person.id);
  }
  if (!dmMembershipCanSelectMore(current.length, cap)) return [...current];
  return [...current, person];
}
