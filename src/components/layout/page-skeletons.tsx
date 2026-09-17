import { Skeleton, TableSkeleton } from "@/components/layout/skeleton";

// Route-level loading shells.
//
// WHY THESE EXIST AT ALL. Without a loading.tsx, the App Router waits for the ENTIRE
// server response before painting anything: the previous page sits frozen with no
// feedback, then the new one snaps in. At 300ms of real network that reads as sluggish
// even though the numbers are fine. A loading.tsx is a Suspense boundary the router can
// show the instant a Link is clicked.
//
// AND IT UNLOCKS PREFETCH. Next.js prefetches a dynamic route by fetching its LOADING
// state. With no loading.tsx there is nothing to prefetch, so every navigation starts
// cold at click time instead of being warmed on hover. This is the larger of the two
// wins and it is invisible until the file exists.
//
// Shape matters: a skeleton whose proportions differ from the real content causes a
// visible reflow on swap, which feels worse than no skeleton. Each of these mirrors the
// header + body of the surface it stands in for.

/** Header block matching PageHeader's title + subtitle proportions. */
export function HeaderSkeleton({ withActions = false }: { withActions?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      {withActions ? <Skeleton className="h-9 w-32 rounded-[var(--radius-sm)]" /> : null}
    </div>
  );
}

/** Catalog: header + search/filter chrome + landscape-thumb rows. */
export function CatalogSkeleton() {
  return (
    <div
      className="mx-auto flex w-full flex-col gap-[var(--space-6)] px-[var(--space-4)] md:px-[var(--space-10)] md:pt-[var(--space-8)]"
      style={{ maxWidth: "var(--content-max)" }}
      data-titles-catalog-skeleton=""
    >
      <div className="flex flex-row items-center justify-between gap-[var(--space-2)]">
        <Skeleton className="h-8 w-32" />
        <div className="flex shrink-0 items-center justify-end gap-[var(--space-2)]">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="size-[44px] rounded-full md:hidden" />
        </div>
      </div>
      <div className="flex flex-col gap-[var(--space-4)] md:flex-row md:items-center">
        <Skeleton className="h-8 w-full rounded-full md:w-56" />
        <Skeleton className="hidden h-8 w-40 rounded-full md:block" />
      </div>
      <div className="flex flex-col gap-[var(--space-4)] md:gap-0 md:overflow-hidden md:rounded-[var(--radius-lg)] md:border md:border-hairline md:bg-surface">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-hairline bg-surface md:flex-row md:items-center md:gap-[var(--space-4)] md:rounded-none md:border-0 md:border-b md:px-[var(--space-4)] md:py-[var(--space-4)] md:last:border-0"
          >
            <Skeleton className="aspect-[16/9] w-full md:w-[160px] md:rounded-[var(--radius-lg)]" />
            <div className="flex flex-col gap-2 px-[var(--space-4)] py-[var(--space-4)] md:min-w-0 md:flex-1 md:flex-row md:items-center md:justify-between md:p-0">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Any list-of-rows surface: deliveries, vendors, the GC queue. */
export function ListSkeleton({ rows = 6, withActions = false }: { rows?: number; withActions?: boolean }) {
  return (
    <>
      <HeaderSkeleton withActions={withActions} />
      <TableSkeleton rows={rows} />
    </>
  );
}

/** Stacked cards: messages, findings, catalog health. */
export function CardListSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <>
      <HeaderSkeleton />
      <div className="flex flex-col gap-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-hairline p-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Title detail: the landscape hero, then the two-column body. */
export function TitleDetailSkeleton() {
  return (
    <>
      <Skeleton className="aspect-[16/9] w-full rounded-[var(--radius-lg)]" />
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-32 w-full rounded-[var(--radius-lg)]" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
        </div>
      </div>
    </>
  );
}

/** Dashboard: charted hero, then the stacked snapshot cards. */
export function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-[260px] w-full rounded-[var(--radius-lg)]" />
      <div className="mt-3 flex flex-col gap-3">
        <Skeleton className="h-28 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
        <Skeleton className="h-24 w-full rounded-[var(--radius-lg)]" />
      </div>
    </>
  );
}
