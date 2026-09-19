import { HeaderSkeleton } from "@/components/layout/page-skeletons";
import { Skeleton } from "@/components/layout/skeleton";
import { CHANNEL_GRID_CLASS } from "@/lib/channel-card";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton withActions />
      <div className={CHANNEL_GRID_CLASS}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-hairline p-[var(--space-4)]"
          >
            <Skeleton className="aspect-[3/2] w-full rounded-[var(--radius-lg)]" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </>
  );
}
