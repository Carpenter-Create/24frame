import Link from "next/link";
import { Camera } from "lucide-react";

import { DashboardViewAll } from "@/components/dashboard/dashboard-view-alts";
import { Artwork } from "@/components/layout/artwork";
import { cn } from "@/lib/cn";
import {
  DASHBOARD_CARD_CLASS,
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_LICENSING_SUMMARY_CLASS,
  DASHBOARD_LICENSING_THUMB_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import {
  DASHBOARD_LICENSING,
  type LicensingRow,
  type LicensingStatusSnapshot,
} from "@/lib/dashboard-licensing";
import { catalogStatusPillClass } from "@/lib/titles-catalog";

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
          <Camera className="h-4 w-4 text-ink-3" strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  );
}

function LicensingStatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      data-dashboard-status-pill=""
      data-dashboard-licensing-pill=""
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-[var(--space-3)] py-[var(--space-1)] t-body-sm",
        catalogStatusPillClass(status),
      )}
    >
      {label}
    </span>
  );
}

export function DashboardLicensingStatus({
  snapshot,
}: {
  snapshot: LicensingStatusSnapshot;
}) {
  const counts = [
    { key: "ready", label: DASHBOARD_LICENSING.ready, value: snapshot.ready },
    {
      key: "needsAttention",
      label: DASHBOARD_LICENSING.needsAttention,
      value: snapshot.needsAttention,
    },
    { key: "inReview", label: DASHBOARD_LICENSING.inReview, value: snapshot.inReview },
  ] as const;

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
      <dl className={DASHBOARD_LICENSING_SUMMARY_CLASS} data-dashboard-licensing-summary="">
        {counts.map((count) => (
          <div key={count.key} className="min-w-0">
            <dt className="t-label text-ink-3">{count.label}</dt>
            <dd
              data-dashboard-licensing-count={count.key}
              className="t-data t-body-sm text-ink"
            >
              {count.value}
            </dd>
          </div>
        ))}
      </dl>
      {snapshot.rows.length === 0 ? (
        <p
          data-dashboard-licensing-empty=""
          className="border-t border-hairline px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink-3"
        >
          {DASHBOARD_LICENSING.empty}
        </p>
      ) : (
        <ul className={DASHBOARD_ROW_LIST_CLASS}>
          {snapshot.rows.map((row: LicensingRow) => (
            <li key={row.id}>
              <Link
                href={row.href}
                data-dashboard-licensing-row={row.id}
                className={cn(DASHBOARD_ROW_CLASS, "hover:text-ink-2")}
              >
                <LicensingThumb title={row.title} stillUrl={row.stillUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-body-sm font-medium text-ink">
                    {row.title}
                  </span>
                  {row.meta ? (
                    <span
                      data-dashboard-licensing-meta=""
                      className="block truncate t-body-sm text-ink-3"
                    >
                      {row.meta}
                    </span>
                  ) : null}
                </span>
                <LicensingStatusPill status={row.status} label={row.statusLabel} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
