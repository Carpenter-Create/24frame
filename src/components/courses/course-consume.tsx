"use client";

import { useState } from "react";

import { CourseCover } from "@/components/courses/course-cover";
import { HouseEmpty } from "@/components/chrome/house";
import {
  courseLessonDurationLabel,
  firstOutlineLesson,
  lessonInOutline,
  type CourseOutlineModule,
} from "@/lib/courses";
import { SOCIAL } from "@/lib/social";
import { cn } from "@/lib/cn";

// In-detail consume only. No lesson deep-link route. No invented media
// pipeline. Seeds have titles only. The 16:9 well holds the selected lesson.

export function CourseConsume({
  modules,
  hasAccess,
}: {
  modules: CourseOutlineModule[];
  hasAccess: boolean;
}) {
  const initial = firstOutlineLesson(modules);
  const [selectedId, setSelectedId] = useState(initial?.id ?? null);
  const selected = selectedId ? lessonInOutline(modules, selectedId) : null;
  const duration = selected ? courseLessonDurationLabel(selected.duration_seconds) : null;
  const preview = Boolean(selected?.free_preview && !hasAccess);

  return (
    <div data-course-consume="">
      <div data-course-player="" className="flex flex-col gap-[var(--space-3)]">
        <CourseCover title={selected?.title ?? SOCIAL.courses.title} />
        {selected ? (
          <div className="flex flex-col gap-[var(--space-2)]">
            <p className="t-body font-medium text-ink">{selected.title}</p>
            {preview || duration ? (
              <p className="t-body-sm text-ink-3">
                {preview ? SOCIAL.courses.preview : null}
                {preview && duration ? " " : null}
                {duration}
              </p>
            ) : null}
          </div>
        ) : (
          <HouseEmpty>{SOCIAL.courses.playerEmpty}</HouseEmpty>
        )}
      </div>
      <section data-course-modules="" className="mt-[var(--space-6)]">
        <h2 className="t-label text-ink-3">{SOCIAL.courses.modules}</h2>
        <ol className="mt-[var(--space-3)] flex flex-col gap-[var(--space-6)]">
          {modules.map((module) => (
            <li key={module.id} data-course-module={module.id}>
              <h3 className="t-body font-medium text-ink">{module.title}</h3>
              {module.lessons.length === 0 ? (
                <p className="mt-[var(--space-2)] t-body-sm text-ink-3">{SOCIAL.courses.empty}</p>
              ) : (
                <ol className="mt-[var(--space-2)] flex flex-col gap-[var(--space-2)]">
                  {module.lessons.map((lesson) => {
                    const active = lesson.id === selected?.id;
                    const lessonPreview = lesson.free_preview && !hasAccess;
                    const lessonDuration = courseLessonDurationLabel(lesson.duration_seconds);
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          data-course-lesson={lesson.id}
                          data-course-preview={lessonPreview ? "" : undefined}
                          data-course-lesson-active={active ? "" : undefined}
                          aria-pressed={active}
                          className={cn(
                            "t-body-sm text-left",
                            active ? "font-medium text-ink" : "text-ink-2",
                          )}
                          onClick={() => setSelectedId(lesson.id)}
                        >
                          {lesson.title}
                          {lessonPreview ? (
                            <span className="text-ink-3"> ({SOCIAL.courses.preview})</span>
                          ) : null}
                          {lessonDuration ? (
                            <span className="text-ink-3"> {lessonDuration}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
