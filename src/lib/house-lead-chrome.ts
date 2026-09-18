// Shared top lead chrome for Aggregation · Social · Education · Home.
// Phone: Asset 8 emblem on every workspace (logoVisible always).
// Dest-rail phone adds hamburger before the emblem — house gap
// (--space-3). Emblem is a workspace-home link, not the rail.
// [ Emblem (phone) / wordmark (md+) · fixed lead slot ] — [ optional search · same gap ] ····· [ switcher · Ask 24Frame AI · theme · bell · avatar ]
// Social live explore search and Education quiet courses/videos
// search share Facebook-compact geometry (04-facebook.png SoT)
// via one HouseLeadSearch primitive — never twin files.
// Aggregation mid-lead stays empty (agg-search-no). Logo inset
// does not drift when the search slot is empty. Do not invent a
// fourth product or an Aggregation search.
//
// G6 chrome gutter — logo left = rail left; trailing right = canvas
// right. Desktop uses --chrome-gutter (not --content-inset). Phone
// keeps MOBILE_CHROME_LEAD_PAD_CLASS. Collapsed icon rail still
// shares the same left gutter.
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
} from "@/lib/house-shell";
import { MOBILE_CHROME_LEAD_PAD_CLASS } from "@/lib/mobile-chrome";

export const HOUSE_LEAD_SEARCH_WIDTH_PX = 240;

export const HOUSE_LEAD_SHELL_CLASS =
  "flex h-dvh flex-col overflow-hidden overscroll-none";

export const HOUSE_LEAD_SCROLL_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain";

export const HOUSE_LEAD_CHROME_CLASS = `sticky top-0 z-40 shrink-0 flex items-center justify-end gap-4 border-b border-hairline bg-surface/85 backdrop-blur ${MOBILE_CHROME_LEAD_PAD_CLASS} ${HOUSE_CHROME_GUTTER_X_CLASS}`;

export const HOUSE_LEAD_LOGO_CLASS = "inline-flex shrink-0 items-center";

export const HOUSE_LEAD_SLOT_CLASS = `min-w-0 items-center ${HOUSE_HEADER_SEARCH_GAP_CLASS}`;

export const HOUSE_LEAD_SEARCH_DESKTOP_CLASS = "hidden w-[240px] shrink-0 md:flex";

export const HOUSE_LEAD_SEARCH_PHONE_CLASS = "min-w-0 flex-1 md:hidden";

export const HOUSE_LEAD_SEARCH_PILL_CLASS =
  "flex h-9 w-full min-w-0 items-center gap-2 px-3";

// Header sun/moon · Ask · bell. Phone matches the 32 avatar so the
// trailing cluster does not crush the lead mark. Desktop stays 32.
// Circular quiet — no muted wash, no hairline box.
export const HOUSE_THEME_TOGGLE_CLASS =
  `flex size-8 min-h-8 min-w-8 shrink-0 items-center justify-center overflow-visible ${HOUSE_ICON_BUTTON_CLASS} text-ink-3 transition-colors hover:text-ink`;
