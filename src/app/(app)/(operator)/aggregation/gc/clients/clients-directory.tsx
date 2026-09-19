import { createClient } from "@/lib/supabase/server";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StaffDirectoryList } from "@/components/staff/staff-directory-list";
import { TitlesCatalogHeader } from "@/components/titles/titles-catalog";
import {
  CLIENTS_PAGE,
  clientDirectorySecondary,
  clientOrgHref,
  filterClientOrgs,
  toClientOrgs,
  type ClientDirectoryFilter,
  type ClientDirectoryRow,
} from "@/lib/clients";
import { UNPAGINATED_MAX, splitProbe } from "@/lib/list-bounds";
import {
  STAFF_DIRECTORY_EMPTY_CLASS,
  directoryCountLabel,
} from "@/lib/staff-directory";

import { ClientsStatusFilter } from "./clients-status-filter";

// GC-wide client roster. /gc/clients is the dedicated operator URL; `/`
// reuses this same surface as the staff home when the session has no client
// org. The RPC re-checks is_gc_staff, so a direct call fails closed even if
// a React tree renders this outside the (operator) layout.
//
// Chrome is TitlesCatalogHeader + HousePageSelect (Titles / Dashboard All
// time SoT). Rows stay StaffDirectory. Seats stay on /gc/clients/[orgId].

export async function GcClientsDirectory({
  statusFilter = "all",
  showFilters = false,
}: {
  statusFilter?: ClientDirectoryFilter;
  showFilters?: boolean;
} = {}) {
  const supabase = await createClient();

  // Probe one past the bound so truncation is VISIBLE rather than a short list
  // that looks complete (src/lib/list-bounds.ts). The bound is on seats, not
  // orgs — the RPC returns seats.
  const { data } = await supabase.rpc("gc_client_directory", { p_limit: UNPAGINATED_MAX + 1 });
  const { rows: seats, truncated } = splitProbe(data as ClientDirectoryRow[] | null, UNPAGINATED_MAX);
  const orgs = filterClientOrgs(toClientOrgs(seats), statusFilter);
  const rows = orgs.map((org) => ({
    id: org.orgId,
    name: org.organization,
    secondary: clientDirectorySecondary(org),
    trailing: org.status,
    href: clientOrgHref(org.orgId),
  }));

  return (
    <>
      <TitlesCatalogHeader
        title={CLIENTS_PAGE.title}
        filters={showFilters ? <ClientsStatusFilter status={statusFilter} /> : undefined}
      />

      {truncated ? (
        <InlineNotice tone="error" className="mb-4">
          Showing the first {UNPAGINATED_MAX} seats. More exist — this list is not paginated yet.
        </InlineNotice>
      ) : null}

      <StaffDirectoryList
        rows={rows}
        countLabel={directoryCountLabel(rows.length, "client", "clients")}
        empty={<p className={STAFF_DIRECTORY_EMPTY_CLASS}>{CLIENTS_PAGE.empty}</p>}
      />
    </>
  );
}
