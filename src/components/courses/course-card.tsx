import Link from "next/link";

import { CourseCover } from "@/components/courses/course-cover";
import { socialCourseHref } from "@/lib/social";
import type { CourseRow } from "@/lib/courses";

// Discover card: cover + title + real description only. No Social
// engagement chrome, no invented access badges.

export function CourseCard({
  course,
  coverUrl,
}: {
  course: CourseRow;
  coverUrl?: string | null;
}) {
  return (
    <li data-course-card={course.slug}>
      <Link href={socialCourseHref(course.slug)} className="flex flex-col gap-[var(--space-3)]">
        <CourseCover title={course.title} src={coverUrl} />
        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="t-body font-medium text-ink">{course.title}</span>
          {course.description ? (
            <span className="t-body-sm text-ink-3">{course.description}</span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
