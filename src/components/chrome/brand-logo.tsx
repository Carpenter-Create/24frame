import {
  BRAND_LOGO_DARK_SRC,
  BRAND_LOGO_HEIGHT_PX,
  BRAND_LOGO_LIGHT_SRC,
} from "@/lib/brand";

// Full 24Frame wordmark. Light + dark colored SVGs swap on the house
// `.dark` class (same contract as the theme toggle). One SoT for every
// workspace — HouseLeadChrome is the only mount.

const LOGO_CLASS = "h-5 w-auto md:h-6";

export function BrandLogo() {
  return (
    <span data-brand-logo="" className="inline-flex shrink-0 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- same-origin brand SVGs; pair swaps on .dark */}
      <img
        src={BRAND_LOGO_LIGHT_SRC}
        alt=""
        height={BRAND_LOGO_HEIGHT_PX}
        data-brand-logo-mark="light"
        className={`${LOGO_CLASS} dark:hidden`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- same-origin brand SVGs; pair swaps on .dark */}
      <img
        src={BRAND_LOGO_DARK_SRC}
        alt=""
        height={BRAND_LOGO_HEIGHT_PX}
        data-brand-logo-mark="dark"
        className={`${LOGO_CLASS} hidden dark:block`}
      />
    </span>
  );
}
