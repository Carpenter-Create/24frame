// House gospel 2026-09-19 (Adam): on mobile, never truncate —
// prefer vertical stack. Non-negotiable. Wrap is allowed.
// Horizontal squeeze, ellipsis, and overflow-x-auto are not
// the phone solution. Desktop rows may spread; phone stacks.
// Consume these tokens — do not invent a lookalike fork.

export const HOUSE_PHONE_GOSPEL =
  "on mobile, never truncate — prefer vertical stack" as const;

export const HOUSE_PHONE_GOSPEL_LOCKED = "2026-09-19" as const;

export const HOUSE_PHONE_WRAP_CLASS =
  "min-w-0 max-w-full whitespace-normal break-words";

export const HOUSE_PHONE_STACK_CLASS =
  "flex min-w-0 w-full flex-col items-stretch";

// Surface containment for a phone column. Clip sideways overflow;
// do not scroll it. Pair with STACK / WRAP on children. Not a
// second app shell.
export const HOUSE_PHONE_CONTAIN_CLASS =
  "min-w-0 max-w-full overflow-x-clip";

export const HOUSE_PHONE_TRUNCATE_ABSENT = [
  "truncate",
  "ellipsis",
  "text-ellipsis",
  "overflow-x-auto",
] as const;

export function housePhoneForbidsTruncate(className: string): boolean {
  return HOUSE_PHONE_TRUNCATE_ABSENT.every((token) => !className.includes(token));
}
