import Link from "next/link";
import { Send } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { StatusFilter } from "@/components/layout/status-filter";
import { InlineNotice } from "@/components/ui/inline-notice";
import { loadMyDeliveries } from "@/lib/my-lists";
import { StatusProgressTrack } from "@/components/ui/status-progress-track";
import { deliveryStatusProgress } from "@/lib/status-progress";
import {
  DEFAULT_DELIVERY_SORT,
  DELIVERIES_FILTER_MISS,
  DELIVERIES_NO_DATA,
  DELIVERIES_TRUNCATED,
  DELIVERY_STATUS_FILTERS,
  deliveriesCountLabel,
  deliveriesShowAllHref,
  deliveriesStatusHref,
  deliveryPackageLabel,
  deliveryTitleHref,
  filterDeliveries,
  groupDeliveriesByTitle,
  parseDeliveryStatusFilter,
} from "@/lib/deliveries-browse";

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const statusFilter = parseDeliveryStatusFilter(sp.status);

  const supabase = await createClient();
  // Untrusted RPC payload — loader validates rows and probes one past the cap.
  const { rows, truncated } = await loadMyDeliveries(supabase);
  const filtered = filterDeliveries(rows, statusFilter);
  const grouped = groupDeliveriesByTitle(filtered);

  const statusHref = (key: (typeof DELIVERY_STATUS_FILTERS)[number]["key"]) =>
    deliveriesStatusHref(statusFilter, DEFAULT_DELIVERY_SORT, key);

  return (
    <>
      <PageHeader
        title="Deliveries"
        subtitle={rows.length > 0 ? deliveriesCountLabel(groupDeliveriesByTitle(rows)) : undefined}
      />

      {truncated ? (
        <InlineNotice tone="info" className="mb-4" data-my-list-truncated="deliveries">
          {DELIVERIES_TRUNCATED}
        </InlineNotice>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Send}
          title={DELIVERIES_NO_DATA.title}
          description={DELIVERIES_NO_DATA.description}
          action={
            <Link
              href={DELIVERIES_NO_DATA.actionHref}
              className="t-body-sm text-accent transition-colors hover:underline"
            >
              {DELIVERIES_NO_DATA.actionLabel}
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <StatusFilter
            current={statusFilter}
            options={DELIVERY_STATUS_FILTERS}
            hrefFor={statusHref}
          />
          {filtered.length === 0 ? (
            <EmptyState
              icon={Send}
              title={DELIVERIES_FILTER_MISS.title}
              description={DELIVERIES_FILTER_MISS.description}
              action={
                <Link
                  href={deliveriesShowAllHref(statusFilter, DEFAULT_DELIVERY_SORT)}
                  className="t-body-sm text-accent transition-colors hover:underline"
                >
                  {DELIVERIES_FILTER_MISS.actionLabel}
                </Link>
              }
            />
          ) : (
            <div
              className="overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface"
              data-deliveries-pipeline=""
            >
              {grouped.map((row) => (
                <Link
                  key={row.title_id}
                  href={deliveryTitleHref(row)}
                  prefetch={false}
                  className="flex items-center justify-between gap-[var(--space-4)] border-b border-hairline px-[var(--space-4)] py-[var(--space-4)] last:border-b-0"
                  data-deliveries-row=""
                >
                  <span className="flex min-w-0 flex-col gap-[var(--space-1)]">
                    <span className="truncate t-body font-medium text-ink">{row.title}</span>
                    <span className="t-body-sm text-ink-3">
                      {deliveryPackageLabel(row.packageCount)}
                    </span>
                  </span>
                  <StatusProgressTrack
                    {...deliveryStatusProgress(row.status)}
                    data-deliveries-status=""
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
