// Period presets: desktop chip row (Reports cluster) + phone HousePageSelect
// (Dashboard All time SoT). Phone is one trigger — Month must not sit
// alone on a second line. Home Net revenue consumes this. Do not fork
// a Home-only chip row.

import { REPORTS_PERIOD_CLUSTER_CLASS } from "@/lib/reports-craft";

export type HousePeriodPresetItem = {
  key: string;
  label: string;
  href: string;
};

/** Desktop-only chip row — hidden below md. Same Reports cluster. No wrap. */
export const HOUSE_PERIOD_PRESETS_CHIPS_CLASS = REPORTS_PERIOD_CLUSTER_CLASS;

/** Phone-only HousePageSelect host. Hidden from md up. */
export const HOUSE_PERIOD_PRESETS_PHONE_CLASS = "md:hidden";

export const HOUSE_PERIOD_PRESETS_HOST_CLASS = "min-w-0";
