import {
  COURSE_COVER_ASPECT_CLASS,
  COURSE_GLANCE_BAND_CLASS,
  COURSE_GLANCE_ORB_CLASS,
} from "@/lib/courses";
import { cn } from "@/lib/cn";

// 16:9 house cover. Discover: signed photo or quiet empty.
// Home glance: solid plate + orb motif. Letter monograms are out.
// No shadows.

export function CourseCover({
  src,
  tone = "photo",
  plateClass,
  className,
  children,
}: {
  title: string;
  src?: string | null;
  tone?: "photo" | "plate";
  plateClass?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const plate = tone === "plate";
  return (
    <div
      data-course-cover=""
      data-course-cover-tone={tone}
      aria-hidden={plate || src ? undefined : true}
      className={cn(
        "relative w-full overflow-hidden rounded-[var(--radius)]",
        plate
          ? cn("border-0", plateClass)
          : "border border-hairline bg-surface-muted",
        COURSE_COVER_ASPECT_CLASS,
        className,
      )}
    >
      {plate ? (
        <>
          <span data-course-cover-band="" aria-hidden className={COURSE_GLANCE_BAND_CLASS} />
          <span data-course-cover-orb="" aria-hidden className={COURSE_GLANCE_ORB_CLASS} />
        </>
      ) : src ? (
        // Signed Education source URL — not in next/image remote patterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      {children}
    </div>
  );
}
