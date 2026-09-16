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
      <Skeleton className={`${COURSE_COVER_ASPECT_CLASS} w-full rounded-[var(--radius)]`} />
      <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-3)]">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
