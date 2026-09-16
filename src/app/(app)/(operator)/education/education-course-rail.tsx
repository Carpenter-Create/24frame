"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";

import type { EducationAdminCourseRow, InstructorRow } from "@/lib/education-admin";
import { educationCourseHref, moveOrderedIds } from "@/lib/education";
import { cn } from "@/lib/cn";

import { reorderEducationCourses } from "./actions";
import { NewCourseButton } from "./education-forms";

// V1 left rail: course names + New course only. No landing chrome.

export function EducationCourseRail({
  courses,
  instructors,
}: {
  courses: EducationAdminCourseRow[];
  instructors: InstructorRow[];
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function onDrop(fromId: string, toId: string) {
    if (fromId === toId) return;
    const ids = courses.map((course) => course.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) return;
    await reorderEducationCourses({ orderedIds: moveOrderedIds(ids, fromIndex, toIndex) });
    router.refresh();
  }

  return (
    <aside
      data-education-course-rail=""
      className="flex w-full shrink-0 flex-col gap-[var(--space-4)] rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-4)] py-[var(--space-4)] lg:w-[16rem]"
    >
      <NewCourseButton instructors={instructors} />
      <ul className="flex flex-col">
        {courses.map((course) => {
          const href = educationCourseHref(course.slug);
          const current = pathname === href;
          return (
            <li
              key={course.id}
              data-education-course-row={course.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/education-course", course.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData("text/education-course");
                if (fromId) void onDrop(fromId, course.id);
              }}
            >
              <div className="flex items-center gap-[var(--space-2)]">
                <span data-education-drag="course" className="text-ink-3" aria-hidden>
                  <GripVertical className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <Link
                  href={href}
                  data-education-course-name=""
                  className={cn(
                    "min-w-0 flex-1 truncate rounded-[var(--radius-sm)] px-[var(--space-2)] py-[var(--space-2)] t-body",
                    current ? "bg-surface-muted font-medium text-ink" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {course.title}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
