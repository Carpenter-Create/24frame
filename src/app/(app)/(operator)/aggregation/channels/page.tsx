import Link from "next/link";
import { Storefront } from "@phosphor-icons/react/ssr";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { ChannelCard } from "@/components/channels/channel-card";
import { ChannelCardGrid } from "@/components/channels/channel-card-grid";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { UNPAGINATED_MAX, rangeFor, splitProbe } from "@/lib/list-bounds";
import {
  STAFF_DIRECTORY_COUNT_CLASS,
  STAFF_DIRECTORY_EMPTY_CLASS,
  STAFF_DIRECTORY_STACK_CLASS,
  STAFF_DIRECTORY_TOOLBAR_CLASS,
  directoryCountLabel,
  searchParamString,
} from "@/lib/staff-directory";
import { countLicensedTitlesByVendor } from "@/lib/vendor-profile";
import {
  CHANNELS_PAGE,
  channelCardTags,
  filterVendorDirectory,
  normalizeVendorDirectory,
  parseVendorDirectoryFilter,
  vendorDirectoryHref,
} from "@/lib/vendors-directory";

import { ChannelsStatusFilter } from "./channels-status-filter";

export default async function GcChannelsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));
  const filter = parseVendorDirectoryFilter(searchParamString(sp.status));

  const supabase = await createClient();
  const [{ data: vendors }, deliveryProbe] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name, delivery_mode, active")
      .order("name", { ascending: true })
      .range(...rangeFor(UNPAGINATED_MAX)),
    supabase
      .from("deliveries")
      .select("vendor_id, title_id, status")
      .range(...rangeFor(UNPAGINATED_MAX + 1)),
  ]);
  const { rows: deliveryRows, truncated: titlesTruncated } = splitProbe(
    deliveryProbe.data,
    UNPAGINATED_MAX,
  );
  const directory = normalizeVendorDirectory(vendors);
  const list = filterVendorDirectory(directory, filter);
  const titleCounts = countLicensedTitlesByVendor(deliveryRows);
  const emptyDirectory = directory.length === 0;

  const cards = list.map((vn) => {
    const titles = titleCounts.get(vn.id) ?? 0;
    return {
      id: vn.id,
      name: vn.name,
      href: vendorDirectoryHref(vn),
      tags: channelCardTags(vn),
      meta:
        titles > 0
          ? directoryCountLabel(titles, "licensed title", "licensed titles", titlesTruncated)
          : null,
    };
  });

  return (
    <>
      <PageHeader
        title={CHANNELS_PAGE.title}
        subtitle={CHANNELS_PAGE.identity}
        className="items-center"
        actions={
          <>
            <ChannelsStatusFilter status={filter} />
            {emptyDirectory ? null : (
              <Link
                href={CHANNELS_PAGE.addHref}
                data-channels-add=""
                className="t-body-sm text-accent transition-colors hover:underline"
              >
                {CHANNELS_PAGE.addChannel}
              </Link>
            )}
          </>
        }
      />

      <div data-channels-directory="" className={STAFF_DIRECTORY_STACK_CLASS}>
        <div
          data-channels-toolbar=""
          className={cn(STAFF_DIRECTORY_TOOLBAR_CLASS, "justify-end")}
        >
          <span data-channels-count="" className={STAFF_DIRECTORY_COUNT_CLASS}>
            {directoryCountLabel(cards.length, "channel", "channels")}
          </span>
        </div>

        {cards.length > 0 ? (
          <ChannelCardGrid>
            {cards.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </ChannelCardGrid>
        ) : emptyDirectory ? (
          <div
            data-channels-empty=""
            className="flex flex-col items-center gap-[var(--space-4)] rounded-[var(--radius-lg)] bg-surface-muted px-[var(--space-6)] py-[var(--space-12)] text-center"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-ink-3">
              <Storefront className="size-6" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
            </span>
            <p className="t-body font-medium text-ink">{CHANNELS_PAGE.emptyTitle}</p>
            <Link
              href={CHANNELS_PAGE.addHref}
              data-channels-add=""
              className="t-body-sm text-accent transition-colors hover:underline"
            >
              {CHANNELS_PAGE.addChannel}
            </Link>
          </div>
        ) : (
          <p data-channels-filter-miss="" className={STAFF_DIRECTORY_EMPTY_CLASS}>
            {CHANNELS_PAGE.filterMiss}
          </p>
        )}
      </div>
    </>
  );
}
