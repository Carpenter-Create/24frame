import Link from "next/link";
import { Camera } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { DashboardViewAll } from "@/components/dashboard/dashboard-view-alts";
import { Artwork } from "@/components/layout/artwork";
import { StatusProgressTrack } from "@/components/ui/status-progress-track";
import { cn } from "@/lib/cn";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_LICENSING_NEST_CLASS,
  DASHBOARD_LICENSING_THUMB_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import {
  DASHBOARD_LICENSING,
  type LicensingEndpointRow,
  type LicensingStatusSnapshot,
  type LicensingTitleGroup,
} from "@/lib/dashboard-licensing";

function LicensingThumb({ title, stillUrl }: { title: string; stillUrl: string | null }) {
  return (
    <div className={DASHBOARD_LICENSING_THUMB_CLASS} data-dashboard-licensing-thumb="">
      {stillUrl ? (
        <Artwork
          src={stillUrl}
          title={title}
          rounded="rounded-none"
          className="absolute inset-0 h-full w-full"
          sizes="64px"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-surface-muted"
          data-dashboard-licensing-empty-art=""
        >
          <Camera className="h-4 w-4 text-ink-3" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} aria-hidden />
        </div>
      )}
    </div>
  );
}

function LicensingEndpointRowView({ row }: { row: LicensingEndpointRow }) {
  return (
    <li
      data-dashboard-licensing-endpoint={row.deliveryId}
      className="flex min-h-10 items-center justify-between gap-[var(--space-2)]"
    >
      <span
        data-dashboard-licensing-endpoint-meta=""
        className="min-w-0 truncate t-body-sm text-ink-3"
      >
        {row.endpoint}
      </span>
      <StatusProgressTrack
        pipeline="delivery"
        status={row.status}
        data-dashboard-licensing-track=""
      />
    </li>
  );
}

function LicensingTitleGroupView({ group }: { group: LicensingTitleGroup }) {
  return (
    <li data-dashboard-licensing-title={group.id} className={DASHBOARD_LICENSING_NEST_CLASS}>
      <div className="flex items-start gap-[var(--space-3)]">
        <LicensingThumb title={group.title} stillUrl={group.stillUrl} />
        <div className="min-w-0 flex-1">
          <Link
            href={group.href}
            className="block truncate t-body-sm font-medium text-ink hover:text-ink-2"
          >
            {group.title}
          </Link>
          <ul className="mt-[var(--space-2)]" data-dashboard-licensing-endpoints="">
            {group.endpoints.map((row) => (
              <LicensingEndpointRowView key={row.deliveryId} row={row} />
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

export function DashboardLicensingStatus({
  snapshot,
}: {
  snapshot: LicensingStatusSnapshot;
}) {
  return (
    <section
      aria-label={DASHBOARD_LICENSING.title}
      data-dashboard-module="licensing-status"
      className={DASHBOARD_CARD_CLASS}
    >
      <div className={cn("flex items-center justify-between", DASHBOARD_RELATED_GAP_CLASS, DASHBOARD_CARD_PAD_LIST)}>
        <p className={DASHBOARD_SECTION_TITLE_CLASS}>{DASHBOARD_LICENSING.title}</p>
        <DashboardViewAll href={DASHBOARD_LICENSING.viewAllHref} />
      </div>
      {snapshot.groups.length === 0 ? (
        <p
          data-dashboard-licensing-empty=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {DASHBOARD_LICENSING.empty}
        </p>
      ) : (
        <ul className="divide-y divide-hairline border-t border-hairline">
          {snapshot.groups.map((group) => (
            <LicensingTitleGroupView key={group.id} group={group} />
          ))}
        </ul>
      )}
    </section>
  );
}
