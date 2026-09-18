// Phone Social search sheet. Behavior from the Facebook-home pattern
// (icon → dedicated surface) — not a Meta skin. No Meta AI branding.
// Recents are a UI shell: empty unless the caller already has rows.
// Do not invent a parallel search backend.

import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";
import { MOBILE_CHROME_LEAD_PAD_CLASS } from "@/lib/mobile-chrome";
import { SOCIAL_AVATAR_32_CLASS } from "@/lib/social-chrome";

export type SocialSearchRecentItem = {
  id: string;
  name: string;
  meta?: string;
  href: string;
  initial?: string;
};

export const SOCIAL_SEARCH_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex flex-col bg-bg md:hidden";

export const SOCIAL_SEARCH_SHEET_CHROME_CLASS = `flex shrink-0 items-center gap-[var(--space-2)] border-b border-hairline bg-surface ${MOBILE_CHROME_LEAD_PAD_CLASS} py-[var(--space-2)]`;

export const SOCIAL_SEARCH_SHEET_BACK_CLASS = `flex size-8 shrink-0 items-center justify-center ${HOUSE_ICON_BUTTON_CLASS} text-ink`;

export const SOCIAL_SEARCH_SHEET_FIELD_CLASS = "min-w-0 flex-1";

export const SOCIAL_SEARCH_RECENT_HEAD_CLASS =
  "flex items-center justify-between px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-2)]";

export const SOCIAL_SEARCH_RECENT_LIST_CLASS = "flex flex-col";

export const SOCIAL_SEARCH_RECENT_ROW_CLASS =
  "flex w-full items-center gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-2)]";

export const SOCIAL_SEARCH_RECENT_FACE_CLASS = SOCIAL_AVATAR_32_CLASS;

export const SOCIAL_SEARCH_RECENT_CLEAR_CLASS = `flex size-8 shrink-0 items-center justify-center ${HOUSE_ICON_BUTTON_CLASS} text-ink-3`;
