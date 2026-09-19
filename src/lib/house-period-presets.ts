// Period presets: desktop segmented track + phone HousePageSelect
// (Dashboard All time SoT). Phone is one trigger — Month must not sit
// alone on a second line. Home Net revenue consumes this. Do not fork
// a Home-only chip row.

export type HousePeriodPresetItem = {
  key: string;
  label: string;
  href: string;
};

/** Phone-only HousePageSelect host. Hidden from md up. */
export const HOUSE_PERIOD_PRESETS_PHONE_CLASS = "md:hidden";

export const HOUSE_PERIOD_PRESETS_HOST_CLASS = "min-w-0";
