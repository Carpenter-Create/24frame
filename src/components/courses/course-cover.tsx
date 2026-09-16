import { COURSE_COVER_ASPECT_CLASS } from "@/lib/courses";
import { cn } from "@/lib/cn";

// 16:9 house cover. Seeds have no signed cover URL. Do not invent S3
// signing or a third palette. No shadows.

export function CourseCover({
  title,
  src,
  className,
}: {
  title: string;
  src?: string | null;
  className?: string;
}) {
  const initial = (title.trim().charAt(0) || "·").toUpperCase();
  return (
    <div
      data-course-cover=""
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
      ) : (
        <span className="absolute inset-0 flex items-center justify-center t-data text-3xl font-medium text-ink-3/40">
          {initial}
        </span>
      )}
    </div>
  );
}
