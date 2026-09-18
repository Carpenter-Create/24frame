import { COURSE_COVER_ASPECT_CLASS } from "@/lib/courses";
import { cn } from "@/lib/cn";

// 16:9 house cover. Real cover when signed; quiet empty otherwise.
// Letter monograms are out. No shadows.

export function CourseCover({
  src,
  className,
}: {
  title: string;
  src?: string | null;
  className?: string;
}) {
  return (
    <div
      data-course-cover=""
      aria-hidden={src ? undefined : true}
      className={cn(
        "relative w-full overflow-hidden rounded-[var(--radius)] border border-hairline bg-surface-muted",
        COURSE_COVER_ASPECT_CLASS,
        className,
      )}
    >
      {src ? (
        // Signed Education source URL — not in next/image remote patterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
    </div>
  );
}
