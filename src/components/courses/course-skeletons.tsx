import { HeaderSkeleton } from "@/components/layout/page-skeletons";
import { Skeleton } from "@/components/layout/skeleton";
import { COURSE_COVER_ASPECT_CLASS } from "@/lib/courses";

function CoverTile() {
  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <Skeleton className={`${COURSE_COVER_ASPECT_CLASS} w-full rounded-[var(--radius)]`} />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function CourseDiscoverSkeleton() {
  return (
    <div data-course-loading="">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-2">
        <CoverTile />
        <CoverTile />
        <CoverTile />
        <CoverTile />
      </div>
    </div>
  );
}

export function CourseDetailSkeleton() {
  return (
    <div data-course-loading="">
      <HeaderSkeleton />
      <div className="mt-[var(--space-12)] flex flex-col gap-[var(--space-6)] lg:flex-row lg:items-start">
        <Skeleton className={`${COURSE_COVER_ASPECT_CLASS} min-w-0 w-full flex-1 rounded-[var(--radius)]`} />
        <div className="flex w-full shrink-0 flex-col gap-[var(--space-4)] lg:w-[20rem]">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
