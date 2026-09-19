// /settings/refer — house empty page. Copy lives here, not in JSX.
// Door only. Do not invent a referral program, rewards, or product.
// Retired /refer 404s. No leftover hop.

import { USER_MENU } from "@/lib/user-menu";

export const REFER = {
  title: USER_MENU.refer,
  href: USER_MENU.referHref,
  empty: "Refer a friend is empty.",
} as const;
