import { SOCIAL_DM_ROOM_LIMIT } from "@/lib/social-dm-bounds";

// DM membership lock v1.1.
// docs/design-locks/dm-vs-group-membership-lock-v1.md
// Cap is 16 people including the creator. Others ≤ 15.

export const DM_MEMBERSHIP_CAP = SOCIAL_DM_ROOM_LIMIT;

export function dmMembershipTotal(otherCount: number): number {
  return otherCount + 1;
}

export function dmMembershipHelper(otherCount: number, cap = DM_MEMBERSHIP_CAP): string {
  const total = Math.min(dmMembershipTotal(otherCount), cap);
  if (dmMembershipTotal(otherCount) >= cap) return `${cap}/${cap} · Chat is full`;
  return `${total}/${cap} selected`;
}

export function dmMembershipCanSelectMore(otherCount: number, cap = DM_MEMBERSHIP_CAP): boolean {
  return dmMembershipTotal(otherCount) < cap;
}

export function dmComposeCta(otherCount: number, cap = DM_MEMBERSHIP_CAP): "chat" | null {
  const total = dmMembershipTotal(otherCount);
  if (otherCount >= 1 && total <= cap) return "chat";
  return null;
}

export function dmComposeVisiblePeople<T extends { id: string }>(
  selected: readonly T[],
  hits: readonly T[],
): T[] {
  const chosen = new Set(selected.map((person) => person.id));
  return [...selected, ...hits.filter((person) => !chosen.has(person.id))];
}

export const DM_COMPOSE_HOST_CLASS = "flex flex-col p-4";

export const DM_COMPOSE_SEARCH_CLASS =
  "flex h-10 items-center rounded-[20px] bg-surface-muted px-3";

export const DM_COMPOSE_HELPER_CLASS = "pt-2 t-body-sm text-ink-2";

export const DM_COMPOSE_ROW_CLASS = "flex w-full items-center gap-2 py-2 text-left disabled:opacity-40";

export const DM_COMPOSE_AVATAR_CLASS = "size-10 shrink-0";

export const DM_COMPOSE_CTA_CLASS =
  "mt-4 flex h-12 w-full items-center justify-center rounded-full bg-accent t-body-sm font-medium text-accent-contrast disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-3";
