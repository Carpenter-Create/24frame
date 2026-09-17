import Link from "next/link";
import { Camera } from "lucide-react";

import { Artwork } from "@/components/layout/artwork";
import { TitlesCatalogStatusFilter } from "@/components/titles/titles-status-filter";

export { TitlesCatalogStatusFilter } from "@/components/titles/titles-status-filter";
import { cn } from "@/lib/cn";
import {
  TITLES_CATALOG,
  TITLES_LIST_CLASS,
  TITLES_LIST_ROW_CLASS,
  TITLES_ROW_COPY_CLASS,
  TITLES_ROW_META_CLASS,
  TITLES_ROW_NAME_CLASS,
  TITLES_THUMB_CLASS,
  TITLES_TITLE_DESKTOP_CLASS,
  TITLES_TITLE_MOBILE_CLASS,
  catalogStatusPillClass,
  type CatalogStatusFilter,
} from "@/lib/titles-catalog";

// Client `/titles` chrome only. Not the shared Card, BannerCard, or DataTable —
// those must not restyle home, Deliveries, Catalog Health, or staff surfaces.
// Phone (`< md`): full-width 16:9 art on top, title / year / status under.
// Desktop (`md+`): landscape-thumb row — art leading, title/year, status.
// Type is the Dashboard register. Accent is the one Add Title Sporty Blue pill.
// Status filter is HousePageSelect (Dashboard All time SoT) — not native select.

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
      <h1 data-titles-catalog-title="">
        <span data-titles-catalog-title-mobile="" className={TITLES_TITLE_MOBILE_CLASS}>
          {TITLES_CATALOG.title}
        </span>
        <span data-titles-catalog-title-desktop="" className={TITLES_TITLE_DESKTOP_CLASS}>
          {TITLES_CATALOG.title}
        </span>
      </h1>
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
  // Phone: search row, then ONE chrome row — left house select (intrinsic) +
  // right Sporty Blue Add Title. Kill stacked All row + lone Add Title row.
  // Desktop: search · house select · Add Title on one row.
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
      {filters || action ? (
        <div
          className="flex w-full min-w-0 items-center gap-[var(--space-2)] md:contents"
          data-titles-catalog-chrome=""
        >
          {filters ? (
            <div
              className="min-w-0 w-auto shrink-0 md:min-w-0"
              data-titles-catalog-filters=""
            >
              <TitlesCatalogStatusFilter q={q} status={status} />
            </div>
          ) : null}
          {action ? (
            <div
              className="ml-auto flex shrink-0 justify-end md:ml-auto"
              data-titles-catalog-operate=""
            >
              {action}
            </div>
          ) : null}
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
    <div className={TITLES_LIST_CLASS} data-titles-catalog-list="">
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
      className={TITLES_THUMB_CLASS}
      data-titles-catalog-frame=""
      data-titles-catalog-crop="cover"
    >
      {stillUrl ? (
        <Artwork
          src={stillUrl}
          title={title}
          rounded="rounded-none"
          className="absolute inset-0 h-full w-full"
          sizes="(max-width: 768px) 100vw, 160px"
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
      className={TITLES_LIST_ROW_CLASS}
      data-titles-catalog-list-row=""
      data-title-status={status}
    >
      <TitlesCatalogThumb title={title} stillUrl={stillUrl} />
      <span className={TITLES_ROW_META_CLASS} data-titles-catalog-row-meta="">
        <span className={TITLES_ROW_COPY_CLASS}>
          <span
            className={TITLES_ROW_NAME_CLASS}
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
      </span>
    </Link>
  );
}
