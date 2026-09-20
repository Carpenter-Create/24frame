import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { StaffDirectoryRow } from "@/components/staff/staff-directory-row";
import {
  StaffDirectoryFields,
  StaffDirectoryList,
  StaffDirectorySection,
} from "@/components/staff/staff-directory-list";
import {
  CLIENTS_PAGE,
  GC_CLIENTS_HREF,
  CLIENT_PROFILE,
  clientDirectorySecondary,
  clientOrgFields,
  clientSeatSecondary,
  toClientOrgs,
  type ClientDirectoryRow,
} from "@/lib/clients";
import { UNPAGINATED_MAX, splitProbe } from "@/lib/list-bounds";
import {
  STAFF_DIRECTORY_EMPTY_CLASS,
  STAFF_DIRECTORY_STACK_CLASS,
  STAFF_DIRECTORY_SURFACE_CLASS,
  directoryCountLabel,
} from "@/lib/staff-directory";

export default async function ClientOrgProfilePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("gc_client_directory", { p_limit: UNPAGINATED_MAX + 1 });
  const { rows: seats, truncated } = splitProbe(data as ClientDirectoryRow[] | null, UNPAGINATED_MAX);
  const org = toClientOrgs(seats).find((row) => row.orgId === orgId);
  if (!org) notFound();

  // Profile consumes seat StaffDirectory rows. The list page never nests these.
  const people = org.seats.map((seat) => ({
    id: seat.userId,
    name: seat.email,
    secondary: clientSeatSecondary(seat),
  }));

  return (
    <>
      <PageHeader
        title={org.organization}
        subtitle={clientDirectorySecondary(org)}
        backLink={{ href: GC_CLIENTS_HREF, label: CLIENTS_PAGE.title }}
      />

      <div data-client-profile="" className={STAFF_DIRECTORY_STACK_CLASS}>
        {truncated ? (
          <InlineNotice tone="error">
            Showing the first {UNPAGINATED_MAX} seats. More exist — this list is not paginated yet.
          </InlineNotice>
        ) : null}

        <div data-client-profile-identity="" className={STAFF_DIRECTORY_SURFACE_CLASS}>
          <StaffDirectoryRow
            row={{
              id: org.orgId,
              name: org.organization,
              secondary: clientDirectorySecondary(org),
              trailing: org.status,
            }}
          />
        </div>

        <StaffDirectorySection title={CLIENT_PROFILE.infoTitle}>
          <StaffDirectoryFields fields={clientOrgFields(org)} />
        </StaffDirectorySection>

        <StaffDirectoryList
          rows={people}
          countLabel={directoryCountLabel(people.length, "person", "people")}
          filters={<h2 className="t-body font-medium text-ink">{CLIENT_PROFILE.peopleTitle}</h2>}
          empty={<p className={STAFF_DIRECTORY_EMPTY_CLASS}>{CLIENT_PROFILE.peopleEmpty}</p>}
        />
      </div>
    </>
  );
}
