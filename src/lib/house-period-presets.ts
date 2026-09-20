// Period presets: desktop house SegmentedTrack SoT + phone
// HousePageSelect (Dashboard All time SoT). Selected ink is the
// track visual index — same SoT as workspace and Activity chips.
// Phone is one trigger — Month must not sit alone on a second line.
// Home Net revenue consumes this. Do not fork a Home-only chip row.

export type HousePeriodPresetItem = {
  key: string;
  label: string;
  href: string;
};

/** Phone-only HousePageSelect host. Hidden from md up. */
export const HOUSE_PERIOD_PRESETS_PHONE_CLASS = "md:hidden";

export const HOUSE_PERIOD_PRESETS_HOST_CLASS = "min-w-0";
