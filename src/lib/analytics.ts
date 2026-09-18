// Legacy Analytics copy. The rail and slug are Reports — keep these aliases
// so older tests and imports do not invent a second surface.

import { REPORTS_HREF, REPORTS_PAGE } from "@/lib/reports";

export const ANALYTICS_HREF = REPORTS_HREF;

export const ANALYTICS_PAGE = {
  title: REPORTS_PAGE.title,
  subtitle: REPORTS_PAGE.subtitle,
  empty: REPORTS_PAGE.empty,
} as const;
