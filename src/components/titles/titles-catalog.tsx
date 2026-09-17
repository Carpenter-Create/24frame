import Link from "next/link";

import { Artwork } from "@/components/layout/artwork";
import { cn } from "@/lib/cn";
import { catalogStatusPillClass, TITLES_CATALOG } from "@/lib/titles-catalog";

// Client `/titles` chrome only. Not the shared Card, BannerCard, or DataTable —
// those must not restyle home, Deliveries, Catalog Health, or staff surfaces.
// Desktop is the unboxed 5-up still grid under the house shell: full-bleed 2:3
// art, type in air, year and TITLE_STATUS_LABELS ink pill. Phone is a hairline
// list — not a snap rail, not a crushed 5-up. Accent is the one Add Title
// Sporty Blue pill. Page-local still crop: every catalog img is object-cover /
// object-center so Artwork's default treatment cannot diverge.

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

export function TitlesCatalogHeader({
  action,
  count,
}: {
  action?: React.ReactNode;
  count?: string;
}) {
  return (
    <header className="titles-catalog-header flex items-center justify-between gap-[var(--space-2)] md:items-start md:gap-[var(--space-6)]">
      <div className="min-w-0 flex-1">
        <h1 className="t-section text-ink">{TITLES_CATALOG.title}</h1>
        {count ? (
          <p
            className="mt-[var(--space-1)] t-body-sm text-ink-3"
            data-titles-catalog-count=""
          >
            {count}
          </p>
        ) : null}
      </div>
      {action ? (
        <div
          className="titles-catalog-operate flex shrink-0 items-center gap-[var(--space-4)]"
          data-titles-catalog-operate=""
        >
          {action}
        </div>
      ) : null}
    </header>
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

export function TitlesCatalogGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="titles-catalog-grid hidden gap-x-[var(--space-8)] gap-y-[var(--space-16)] md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      data-titles-catalog-grid=""
    >
      {children}
    </div>
  );
}

export function TitlesCatalogList({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="titles-catalog-list overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface md:hidden"
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

export function TitlesCatalogListRow({
  href,
  title,
  status,
  statusLabel,
  year,
}: {
  href: string;
  title: string;
  status: string;
  statusLabel: string;
  year?: string | null;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center justify-between gap-[var(--space-4)] border-b border-hairline px-[var(--space-4)] py-[var(--space-4)] last:border-b-0"
      data-titles-catalog-list-row=""
      data-title-status={status}
    >
      <span className="flex min-w-0 flex-col gap-[var(--space-1)]">
        <span
          className="min-w-0 truncate t-body font-medium text-ink"
          data-titles-catalog-list-name=""
        >
          {title}
        </span>
        {year ? (
          <span className="t-body-sm text-ink-3" data-titles-catalog-list-year="">
            {year}
          </span>
        ) : null}
      </span>
      <TitleStatusPill status={status} statusLabel={statusLabel} />
    </Link>
  );
}

export function TitlesCatalogStill({
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
      className="titles-catalog-card flex flex-col gap-[var(--space-3)]"
      data-titles-catalog-card=""
      data-title-status={status}
    >
      <div
        className="relative aspect-[2/3] w-full overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center"
        data-titles-catalog-frame=""
        data-titles-catalog-crop="cover"
      >
        {stillUrl ? (
          <Artwork
            src={stillUrl}
            title={title}
            rounded="rounded-none"
            className="absolute inset-0 h-full w-full"
            sizes="(max-width: 768px) 140px, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-muted" data-titles-catalog-empty-art="" />
        )}
      </div>
      <div
        className="flex flex-col gap-[var(--space-1)]"
        data-titles-catalog-stack=""
      >
        <span
          className="min-w-0 truncate t-body-sm font-medium text-ink"
          data-titles-catalog-name=""
        >
          {title}
        </span>
        <div
          className="flex min-w-0 flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-1)]"
          data-titles-catalog-meta=""
        >
          {year ? (
            <span className="t-body-sm text-ink-3" data-titles-catalog-year="">
              {year}
            </span>
          ) : null}
          <TitleStatusPill status={status} statusLabel={statusLabel} />
        </div>
      </div>
    </Link>
  );
}
