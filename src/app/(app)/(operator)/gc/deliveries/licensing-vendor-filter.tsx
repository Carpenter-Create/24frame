"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import {
  GC_LICENSING_STATUS,
  GC_LICENSING_VENDOR_ALL,
  gcLicensingHref,
  gcLicensingVendorLabel,
  gcLicensingVendorOptions,
  parseGcLicensingVendorFilter,
  type DeliveryStatusFilter,
  type GcLicensingVendor,
} from "@/lib/gc-deliveries";

// Channel lens — house-page-select consumer (Dashboard All time SoT).
// Status stays on StatusFilter chips. Do not invent a second select grammar.

export function LicensingVendorFilter({
  status,
  vendor,
  vendors,
  q = "",
  defaultOpen = false,
}: {
  status: DeliveryStatusFilter;
  vendor: string | null;
  vendors: readonly GcLicensingVendor[];
  q?: string;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const options = gcLicensingVendorOptions(vendors);
  const current = vendor ?? GC_LICENSING_VENDOR_ALL;

  return (
    <div data-gc-licensing-vendor="" className="w-auto shrink-0">
      <HousePageSelect
        value={current}
        label={gcLicensingVendorLabel(vendor, vendors)}
        options={options}
        ariaLabel={GC_LICENSING_STATUS.vendorFilterLabel}
        sheetTitle={GC_LICENSING_STATUS.vendorFilterLabel}
        closeLabel="Close"
        defaultOpen={defaultOpen}
        menuAlign="end"
        onPick={(key) => {
          router.replace(gcLicensingHref(status, parseGcLicensingVendorFilter(key), q), {
            scroll: false,
          });
        }}
        attrs={{
          current: { "data-gc-licensing-vendor-current": "" },
          trigger: { "data-gc-licensing-vendor-trigger": "" },
          menu: { "data-gc-licensing-vendor-menu": "" },
          sheet: { "data-gc-licensing-vendor-sheet": "" },
          option: (key) => ({ "data-gc-licensing-vendor-option": key }),
        }}
      />
    </div>
  );
}
