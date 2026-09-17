import Link from "next/link";
import { Camera } from "lucide-react";

import { Artwork } from "@/components/layout/artwork";
import { TitlesCatalogStatusFilter } from "@/components/titles/titles-status-filter";
import { StatusProgressTrack } from "@/components/ui/status-progress-track";

export { TitlesCatalogStatusFilter } from "@/components/titles/titles-status-filter";
import { cn } from "@/lib/cn";
import { titleStatusProgress } from "@/lib/status-progress";
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
  type CatalogStatusFilter,
} from "@/lib/titles-catalog";

// Client `/titles` chrome only. Not the shared Card, BannerCard, or DataTable —
// those must not restyle home, Deliveries, Catalog Health, or staff surfaces.
// Phone (`< md`): full-width 16:9 art on top, title / year / status under.
// Desktop (`md+`): landscape-thumb row — art leading, title/year, status.
// Type is the Dashboard register. Accent is Sporty Blue Add Title:
// phone header + (house 44), desktop labeled pill. Not a list FAB.
// Status filter is HousePageSelect trailing on the header (Dashboard All time SoT).
// Row status is the shared Sporty Blue segment track — not a greyscale pill.
// Vertical air above the rows is tight: H1 → toolbar → list at 8.

export function TitlesCatalogFrame({
  className,
  empty = false,
  ...props
}: React.ComponentProps<"div"> & { empty?: boolean }) {
  return (
    <div
      className={cn(
        "titles-catalog mx-auto flex w-full flex-col gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-12)] md:px-[var(--space-10)] md:py-0 md:pt-[var(--space-8)]",
        className,
      )}
      style={{ maxWidth: "var(--content-max)" }}
      data-titles-catalog=""
      {...(empty ? { "data-titles-catalog-empty": "" } : {})}
      {...props}
    />
  );
}

export function TitlesCatalogHeader({
  q,
  status,
  action,
}: {
  q?: string;
  status?: CatalogStatusFilter;
  action?: React.ReactNode;
}) {
  // Dashboard All time SoT: title cluster left, house select trailing on the
  // same identity row (desktop + phone). No count subtitle under Titles.
  // Phone trailing cluster is All + plus. Desktop header stays title · All.
  const showStatus = typeof q === "string" && status != null;
  return (
    <header
      className="titles-catalog-header flex flex-row items-center justify-between gap-[var(--space-2)] md:items-center md:gap-[var(--space-6)]"
      data-titles-catalog-header-row=""
    >
      <div className="min-w-0">
        <h1 data-titles-catalog-title="">
          <span data-titles-catalog-title-mobile="" className={TITLES_TITLE_MOBILE_CLASS}>
            {TITLES_CATALOG.title}
          </span>
          <span data-titles-catalog-title-desktop="" className={TITLES_TITLE_DESKTOP_CLASS}>
            {TITLES_CATALOG.title}
          </span>
        </h1>
      </div>
      {showStatus || action ? (
        <div
          className="flex w-auto shrink-0 items-center justify-end gap-[var(--space-2)]"
          data-titles-catalog-header-cluster=""
        >
          {showStatus ? (
            <div
              className="flex w-auto shrink-0 items-center justify-end"
              data-titles-catalog-filters=""
            >
              <TitlesCatalogStatusFilter q={q} status={status} />
            </div>
          ) : null}
          {action ? (
            <div className="md:hidden" data-titles-catalog-header-operate="">
              {action}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}

export function TitlesCatalogToolbar({
  search,
  action,
}: {
  search?: React.ReactNode;
  action?: React.ReactNode;
}) {
  // Status lives on TitlesCatalogHeader (Dashboard period SoT).
  // Phone toolbar is search only. Desktop toolbar is search + labeled Add Title.
  if (!search && !action) return null;
  return (
    <div
      className={cn(
        "titles-catalog-toolbar flex flex-col gap-[var(--space-4)] md:flex-row md:items-center",
        !search && "max-md:hidden",
      )}
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
      {action ? (
        <div
          className="hidden w-full min-w-0 items-center justify-end md:contents"
          data-titles-catalog-chrome=""
        >
          <div
            className="ml-auto flex shrink-0 justify-end md:ml-auto"
            data-titles-catalog-operate=""
          >
            {action}
          </div>
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
  liveCount = 0,
}: {
  status: string;
  liveCount?: number;
}) {
  const model = titleStatusProgress(status, liveCount);
  return <StatusProgressTrack {...model} data-titles-catalog-status="" />;
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
  liveCount = 0,
  year,
  publicId,
}: {
  href: string;
  title: string;
  stillUrl: string | null;
  status: string;
  liveCount?: number;
  year?: string | null;
  publicId?: string | null;
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
          {year || publicId ? (
            <span className="t-body-sm text-ink-3">
              {year ? (
                <span
                  className="t-body-sm text-ink-3"
                  data-titles-catalog-year=""
                  data-titles-catalog-list-year=""
                >
                  {year}
                </span>
              ) : null}
              {year && publicId ? " · " : null}
              {publicId ? (
                <span
                  className="tabular-nums"
                  data-titles-catalog-public-id=""
                >
                  {publicId}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
        <TitleStatusPill status={status} liveCount={liveCount} />
      </span>
    </Link>
  );
}
