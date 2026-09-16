"use client";

import { useState } from "react";

import { CourseCover } from "@/components/courses/course-cover";
import { CourseLessonPlayer } from "@/components/courses/course-lesson-player";
import { HouseEmpty } from "@/components/chrome/house";
import {
  courseLessonDurationLabel,
  firstOutlineLesson,
  lessonInOutline,
  type CourseOutlineModule,
} from "@/lib/courses";
import { SOCIAL } from "@/lib/social";
import { cn } from "@/lib/cn";

// In-detail consume only. No lesson deep-link route. Desktop: player
// with playlist on the right. Mobile: player, then playlist below.
// Playback chrome stays on CourseLessonPlayer.

export function CourseConsume({
  modules,
  hasAccess,
  coverUrl,
}: {
  modules: CourseOutlineModule[];
  hasAccess: boolean;
  coverUrl?: string | null;
}) {
  const initial = firstOutlineLesson(modules);
  const [selectedId, setSelectedId] = useState(initial?.id ?? null);
  const selected = selectedId ? lessonInOutline(modules, selectedId) : null;
  const duration = selected ? courseLessonDurationLabel(selected.duration_seconds) : null;
  const preview = Boolean(selected?.free_preview && !hasAccess);

  return (
    <div
      data-course-consume=""
      className="flex flex-col gap-[var(--space-6)] lg:flex-row lg:items-start"
    >
      <div data-course-player="" className="flex min-w-0 flex-1 flex-col gap-[var(--space-3)]">
        {selected?.playbackUrl ? (
          <CourseLessonPlayer src={selected.playbackUrl} title={selected.title} />
        ) : (
          <CourseCover title={selected?.title ?? SOCIAL.courses.title} src={coverUrl} />
        )}
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
      <section
        data-course-playlist=""
        data-course-modules=""
        className="w-full shrink-0 lg:w-[20rem]"
      >
        <h2 className="t-label text-ink-3">{SOCIAL.courses.playlist}</h2>
        <ol className="mt-[var(--space-4)] flex flex-col gap-[var(--space-6)]">
          {modules.map((module) => (
            <li key={module.id} data-course-module={module.id}>
              <h3 className="px-[var(--space-4)] t-body-sm font-medium text-ink-3">{module.title}</h3>
              {module.lessons.length === 0 ? (
                <p className="mt-[var(--space-2)] px-[var(--space-4)] t-body-sm text-ink-3">
                  {SOCIAL.courses.empty}
                </p>
              ) : (
                <ol className="mt-[var(--space-2)] flex flex-col">
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
                            "flex w-full items-start justify-between gap-[var(--space-3)] border-l-2 p-[var(--space-4)] text-left t-body-sm",
                            active
                              ? "border-accent bg-surface-muted font-medium text-ink"
                              : "border-transparent text-ink-2",
                          )}
                          onClick={() => setSelectedId(lesson.id)}
                        >
                          <span>
                            {lesson.title}
                            {lessonPreview ? (
                              <span className="text-ink-3"> ({SOCIAL.courses.preview})</span>
                            ) : null}
                          </span>
                          {lessonDuration ? (
                            <span className="shrink-0 text-ink-3">{lessonDuration}</span>
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
