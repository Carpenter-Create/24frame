"use client";

import { useRouter } from "next/navigation";

import { HousePageSelect } from "@/components/chrome/house-page-select";
import {
  CLIENTS_PAGE,
  CLIENT_DIRECTORY_FILTERS,
  clientDirectoryFilterLabel,
  parseClientDirectoryFilter,
  type ClientDirectoryFilter,
} from "@/lib/clients";
import { filterHref } from "@/lib/staff-directory";

// Clients status lens — house-page-select consumer (Dashboard All time SoT).
// Trailing on PageHeader like Titles status / Dashboard period.
// Visible at every breakpoint. No chip-strip filter on this page.

export function ClientsStatusFilter({
  status,
  defaultOpen = false,
}: {
  status: ClientDirectoryFilter;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const currentLabel = clientDirectoryFilterLabel(status);

  return (
    <div data-gc-clients-status-compact="" className="w-auto shrink-0">
      <HousePageSelect
        value={status}
        label={currentLabel}
        options={CLIENT_DIRECTORY_FILTERS}
        ariaLabel={CLIENTS_PAGE.statusFilterLabel}
        sheetTitle={CLIENTS_PAGE.statusFilterLabel}
        closeLabel="Close"
        defaultOpen={defaultOpen}
        menuAlign="end"
        onPick={(key) => {
          router.replace(filterHref("/gc/clients", parseClientDirectoryFilter(key)), {
            scroll: false,
          });
        }}
        attrs={{
          current: { "data-gc-clients-status-current": "" },
          trigger: { "data-gc-clients-status-trigger": "" },
          menu: { "data-gc-clients-status-menu": "" },
          sheet: { "data-gc-clients-status-sheet": "" },
          option: (key) => ({ "data-gc-clients-status-option": key }),
        }}
      />
    </div>
  );
}
