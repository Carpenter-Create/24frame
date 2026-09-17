import Link from "next/link";
import { Camera } from "lucide-react";

import { Artwork } from "@/components/layout/artwork";
import { StatusFilter } from "@/components/layout/status-filter";
import { cn } from "@/lib/cn";
import {
  CATALOG_STATUS_FILTERS,
  TITLES_CATALOG,
  catalogFilterHref,
  catalogStatusPillClass,
  type CatalogStatusFilter,
} from "@/lib/titles-catalog";

// Client `/titles` chrome only. Not the shared Card, BannerCard, or DataTable —
// those must not restyle home, Deliveries, Catalog Health, or staff surfaces.
// Landscape-thumb rows in the house shell: 16:9 art, ink title, quiet year,
// TITLE_STATUS_LABELS pill. Phone uses the same row grammar with a readable
// leading thumb. Accent is the one Add Title Sporty Blue pill.

export function TitlesCatalogFrame({
  className,
  empty = false,
  ...props
}: React.ComponentProps<"div"> & { empty?: boolean }) {
  return (
    <div
      className={cn(
        "titles-catalog mx-auto flex w-full flex-col gap-[var(--space-6)] px-[var(--space-4)] py-[var(--space-12)] md:px-[var(--space-10)] md:py-0 md:pt-[var(--space-8)]",
        empty ? undefined : "md:gap-[var(--space-8)]",
        className,
      )}
      style={{ maxWidth: "var(--content-max)" }}
      data-titles-catalog=""
      {...props}
    />
  );
}

export function TitlesCatalogHeader({ count }: { count?: string }) {
  return (
    <header className="titles-catalog-header">
      <h1 className="t-section text-ink">{TITLES_CATALOG.title}</h1>
      {count ? (
        <p
          className="mt-[var(--space-1)] t-body-sm text-ink-3"
          data-titles-catalog-count=""
        >
          {count}
        </p>
      ) : null}
    </header>
  );
}

export function TitlesCatalogToolbar({
  q,
  status,
  search,
  action,
  filters = true,
}: {
  q: string;
  status: CatalogStatusFilter;
  search?: React.ReactNode;
  action?: React.ReactNode;
  filters?: boolean;
}) {
  return (
    <div
      className="titles-catalog-toolbar flex flex-col gap-[var(--space-4)] md:flex-row md:items-center"
      data-titles-catalog-toolbar=""
    >
      {search ? (
        <div
          className="min-w-0 w-full md:w-auto [&_input]:w-full [&_input]:sm:w-full md:[&_input]:w-56"
          data-titles-catalog-search=""
        >
          {search}
        </div>
      ) : null}
      {filters ? (
        <div className="min-w-0 flex-1" data-titles-catalog-filters="">
          <StatusFilter
            current={status}
            options={CATALOG_STATUS_FILTERS}
            hrefFor={(key) => catalogFilterHref(q, key)}
          />
        </div>
      ) : null}
      {action ? (
        <div
          className="flex shrink-0 justify-end md:ml-auto"
          data-titles-catalog-operate=""
        >
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function TitlesCatalogEmpty({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "titles-catalog-empty overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-4)]",
        className,
      )}
    >
      <p className="t-body-sm text-ink-3">{children}</p>
    </div>
  );
}

export function TitlesCatalogList({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="titles-catalog-list overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface"
      data-titles-catalog-list=""
    >
      {children}
    </div>
  );
}

export function TitleStatusPill({
  status,
  statusLabel,
}: {
  status: string;
  statusLabel: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-[var(--space-3)] py-[var(--space-1)] t-body-sm",
        catalogStatusPillClass(status),
      )}
      data-titles-catalog-status=""
    >
      {statusLabel}
    </span>
  );
}

function TitlesCatalogThumb({
  title,
  stillUrl,
}: {
  title: string;
  stillUrl: string | null;
}) {
  return (
    <div
      className="relative aspect-[16/9] w-[40%] max-w-[168px] shrink-0 overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted md:w-[160px] md:max-w-none [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center"
      data-titles-catalog-frame=""
      data-titles-catalog-crop="cover"
    >
      {stillUrl ? (
        <Artwork
          src={stillUrl}
          title={title}
          rounded="rounded-none"
          className="absolute inset-0 h-full w-full"
          sizes="(max-width: 768px) 40vw, 160px"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-surface-muted"
          data-titles-catalog-empty-art=""
        >
          <Camera className="h-4 w-4 text-ink-3" strokeWidth={1.5} aria-hidden />
        </div>
      )}
    </div>
  );
}

export function TitlesCatalogListRow({
  href,
  title,
  stillUrl,
  status,
  statusLabel,
  year,
}: {
  href: string;
  title: string;
  stillUrl: string | null;
  status: string;
  statusLabel: string;
  year?: string | null;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-[var(--space-4)] border-b border-hairline px-[var(--space-4)] py-[var(--space-4)] last:border-b-0"
      data-titles-catalog-list-row=""
      data-title-status={status}
    >
      <TitlesCatalogThumb title={title} stillUrl={stillUrl} />
      <span className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
        <span
          className="min-w-0 truncate t-body font-medium text-ink"
          data-titles-catalog-name=""
          data-titles-catalog-list-name=""
        >
          {title}
        </span>
        {year ? (
          <span
            className="t-body-sm text-ink-3"
            data-titles-catalog-year=""
            data-titles-catalog-list-year=""
          >
            {year}
          </span>
        ) : null}
      </span>
      <TitleStatusPill status={status} statusLabel={statusLabel} />
    </Link>
  );
}
