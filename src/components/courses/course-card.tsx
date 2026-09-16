import Link from "next/link";

import { CourseCover } from "@/components/courses/course-cover";
import { socialCourseHref } from "@/lib/social";
import type { CourseRow } from "@/lib/courses";

// Discover card: 16:9 cover + title + quiet lesson meta.
// No Social engagement chrome, no invented access badges.

export function CourseCard({
  course,
  coverUrl,
  metaLabel,
}: {
  course: CourseRow;
  coverUrl?: string | null;
  metaLabel?: string | null;
}) {
  return (
    <li data-course-card={course.slug}>
      <Link href={socialCourseHref(course.slug)} className="flex flex-col gap-[var(--space-3)]">
        <CourseCover title={course.title} src={coverUrl} />
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="t-body font-medium text-ink">{course.title}</span>
          {metaLabel ? (
            <span data-course-card-meta="" className="t-body-sm text-ink-3">
              {metaLabel}
            </span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
