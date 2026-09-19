// Shared top lead chrome for Aggregation · Social · Education · Home.
// Phone: Asset 8 emblem on every workspace (logoVisible always).
// Emblem owns the phone left alone. No hamburger — leading or trailing.
// Destinations live on HousePhoneDestChips under this stack.
// Emblem is a workspace-home link, not the rail.
// Phone grammar Option 2 dest-chip amend (Adam 2026-09-18):
//   Left: [emblem]
//   Under-top: dest chips on Agg / Edu / Social. Home has none.
//   Trailing: [search if needed] [24Frame AI] [bell] [avatar]
//   Bottom: HousePhoneBottomNav — Home · Social · Aggregation · Education
// Phone top has no workspace pill. Bottom bar owns workspace switching.
// 24Frame AI sits immediately left of the notification bell on every
// house chrome path (Home · Social · Aggregation · Education ·
// Settings). It opens the Mercury ?ai=1 overlay window — never a
// workspace hop. Expand/collapse stays overlay-scoped. Close strips
// ?ai=1 and leaves the current path. Avatar-sheet AI may stay as a
// secondary door. Sun/moon stays desktop-only (hidden on phone).
// Desktop md+ keeps switcher · theme · Ask · bell · avatar. The Ask
// control is shared so phone and desktop do not fork a second mark.
// Social live explore search and Education quiet courses/videos
// search share Facebook-compact geometry (04-facebook.png SoT)
// via one HouseLeadSearch primitive — never twin files.
// Phone Education search is a full-width row under dest chips — not
// in the top nav. The Workspaces menu portals above this stack so it
// cannot clip under dest chips or search (header backdrop-blur).
// Phone Social is a trailing magnifying-glass that
// opens a dedicated sheet. Aggregation mid-lead stays empty
// (agg-search-no). Logo inset does not drift when the search slot is
// empty. Do not invent a fourth product or an Aggregation search.
//
// G6 chrome gutter — logo left = rail left; trailing right = canvas
// right. Desktop uses --chrome-gutter (not --content-inset). Phone
// left keeps --space-6; phone right uses --chrome-gutter so the
// avatar is not flush. Collapsed icon rail still shares the same
// left gutter.
//
// G9 — lead chrome stays pinned to the viewport. Mac rubber-band /
// pull-down overscroll must not carry the header. Document/body is
// not the scroll ancestor. The shell is a viewport column; page
// scroll lives on main. Social + Education share this contract —
// not an Aggregation-only sticky hack. Phone follows the same pin.

import {
  HOUSE_CHROME_GUTTER_X_CLASS,
  HOUSE_HEADER_SEARCH_GAP_CLASS,
  HOUSE_ICON_BUTTON_CLASS,
  HOUSE_PHONE_TRAILING_GUTTER_CLASS,
} from "@/lib/house-shell";

export const HOUSE_LEAD_SEARCH_WIDTH_PX = 240;

export const HOUSE_LEAD_SHELL_CLASS =
  "flex h-dvh flex-col overflow-hidden overscroll-none";

export const HOUSE_LEAD_SCROLL_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

// Stack pins header + Education under-nav as one unit. Do not put
// overflow-hidden on this row (#412).
export const HOUSE_LEAD_STACK_CLASS = "sticky top-0 z-40 shrink-0";

// Phone: --space-6 lead · --chrome-gutter trail. md+ uses chrome-gutter
// both sides. Do not put overflow-hidden on this row (#412).
export const HOUSE_LEAD_PHONE_PAD_CLASS =
  `max-md:pl-[var(--space-6)] ${HOUSE_PHONE_TRAILING_GUTTER_CLASS}`;

export const HOUSE_LEAD_CHROME_CLASS = `flex items-center justify-end gap-4 border-b border-hairline bg-surface/85 backdrop-blur ${HOUSE_LEAD_PHONE_PAD_CLASS} ${HOUSE_CHROME_GUTTER_X_CLASS}`;

export const HOUSE_LEAD_LOGO_CLASS = "inline-flex shrink-0 items-center";

export const HOUSE_LEAD_SLOT_CLASS = `min-w-0 items-center ${HOUSE_HEADER_SEARCH_GAP_CLASS}`;

export const HOUSE_LEAD_SEARCH_DESKTOP_CLASS = "hidden w-[240px] shrink-0 md:flex";

export const HOUSE_LEAD_SEARCH_PHONE_CLASS = "w-full min-w-0 md:hidden";

export const HOUSE_LEAD_UNDER_NAV_CLASS = `flex w-full items-center md:hidden border-b border-hairline bg-surface/85 backdrop-blur ${HOUSE_LEAD_PHONE_PAD_CLASS} ${HOUSE_CHROME_GUTTER_X_CLASS} py-[var(--space-2)]`;

export const HOUSE_LEAD_SEARCH_PILL_CLASS =
  "flex h-9 w-full min-w-0 items-center gap-2 px-3";

// Header sun/moon · Ask · bell. Phone matches the 32 avatar so the
// trailing cluster does not crush the lead mark. Desktop stays 32.
// Circular quiet — no muted wash, no hairline box.
export const HOUSE_THEME_TOGGLE_CLASS =
  `flex size-8 min-h-8 min-w-8 shrink-0 items-center justify-center overflow-visible ${HOUSE_ICON_BUTTON_CLASS} text-ink-3 transition-colors hover:text-ink`;
