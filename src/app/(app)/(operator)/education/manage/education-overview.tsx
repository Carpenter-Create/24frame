"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretDown, CaretRight, DotsSixVertical } from "@phosphor-icons/react";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

import { HouseEmpty } from "@/components/chrome/house";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { courseLessonDurationLabel } from "@/lib/courses";
import type { CourseOutlineModule } from "@/lib/courses";
import type { InstructorRow } from "@/lib/education-admin";
import {
  COURSE_STATUS_LABELS,
  EDUCATION_ADMIN,
  educationCourseHref,
  canRefreshEducationEncode,
  canStartEducationEncode,
  educationCommercialLabel,
  educationEncodePill,
  moveOrderedIds,
  type CourseStatus,
} from "@/lib/education";

import { reorderEducationLessons, reorderEducationModules, updateEducationCourse } from "./actions";
import { EducationDrawer } from "./education-drawer";
import {
  AddModuleForm,
  CoverUploadForm,
  EditCourseForm,
  EditLessonButton,
  LessonMediaPane,
  NewLessonButton,
} from "./education-forms";

function StatusPill({ children }: { children: string }) {
  return (
    <span
      data-education-status-pill=""
      className="inline-flex rounded-full border border-hairline px-[var(--space-2)] py-0.5 t-body-sm text-ink-2"
    >
      {children}
    </span>
  );
}

export function EducationCourseOverview({
  course,
  modules,
  instructors,
  coverUrl,
}: {
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    catalogCode: string;
    status: CourseStatus;
    isFlagshipFree: boolean;
    priceCents: number | null;
    instructorId: string | null;
  };
  modules: CourseOutlineModule[];
  instructors: InstructorRow[];
  coverUrl?: string | null;
}) {
  const router = useRouter();
  const consumePath = educationCourseHref(course.slug);
  const firstLessonId = modules.flatMap((row) => row.lessons).at(0)?.id ?? null;
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(firstLessonId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const selectedModule = modules.find((row) => row.lessons.some((lesson) => lesson.id === firstLessonId));
    return Object.fromEntries(modules.map((row) => [row.id, row.id === selectedModule?.id]));
  });
  const [publishing, setPublishing] = useState(false);

  const selectedModule = modules.find((row) => row.lessons.some((lesson) => lesson.id === selectedLessonId));
  const selectedLesson = selectedModule?.lessons.find((row) => row.id === selectedLessonId) ?? null;
  const selected = selectedModule && selectedLesson ? { courseModule: selectedModule, lesson: selectedLesson } : null;

  function toggleModule(moduleId: string) {
    setOpenModules((current) => ({ ...current, [moduleId]: !current[moduleId] }));
  }

  function selectLesson(moduleId: string, lessonId: string) {
    setSelectedLessonId(lessonId);
    setOpenModules((current) => ({ ...current, [moduleId]: true }));
  }

  async function onModuleDrop(fromId: string, toId: string) {
    if (fromId === toId) return;
    const ids = modules.map((row) => row.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) return;
    await reorderEducationModules({
      courseId: course.id,
      orderedIds: moveOrderedIds(ids, fromIndex, toIndex),
    });
    router.refresh();
  }

  async function onLessonDrop(moduleId: string, fromId: string, toId: string) {
    if (fromId === toId) return;
    const courseModule = modules.find((row) => row.id === moduleId);
    if (!courseModule) return;
    const ids = courseModule.lessons.map((lesson) => lesson.id);
    const fromIndex = ids.indexOf(fromId);
    const toIndex = ids.indexOf(toId);
    if (fromIndex < 0 || toIndex < 0) return;
    await reorderEducationLessons({
      moduleId,
      orderedIds: moveOrderedIds(ids, fromIndex, toIndex),
    });
    router.refresh();
  }

  async function onPublish() {
    setPublishing(true);
    await updateEducationCourse({
      courseId: course.id,
      title: course.title,
      description: course.description,
      model: course.isFlagshipFree ? "free" : "paid",
      price: course.priceCents != null ? (course.priceCents / 100).toFixed(2) : "",
      status: "published",
      instructorId: course.instructorId ?? undefined,
    });
    setPublishing(false);
    router.refresh();
  }

  return (
    <div data-education-overview="" data-education-workspace="" data-gc-education-course={course.slug}>
      <PageHeader
        title={course.title}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-[var(--space-2)]">
            <NewLessonButton
              courseId={course.id}
              modules={modules}
              defaultModuleId={modules[0]?.id}
            />
            <Button
              type="button"
              variant="secondary"
              data-education-edit-settings=""
              onClick={() => setSettingsOpen(true)}
            >
              {EDUCATION_ADMIN.editSettings}
            </Button>
            {course.status === "draft" ? (
              <Button
                type="button"
                variant="secondary"
                data-education-publish=""
                disabled={publishing}
                onClick={() => void onPublish()}
              >
                {publishing ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.publish}
              </Button>
            ) : null}
          </div>
        }
      />
      <p className="mb-[var(--space-6)] flex flex-wrap items-center gap-x-[var(--space-2)] gap-y-[var(--space-2)] t-body-sm text-ink-3">
        <span data-education-catalog-code="">{course.catalogCode}</span>
        <StatusPill>{COURSE_STATUS_LABELS[course.status]}</StatusPill>
        <span data-education-model="">{educationCommercialLabel(course.isFlagshipFree, course.priceCents)}</span>
        <Link href={consumePath} className="text-ink-2">
          {EDUCATION_ADMIN.consume}
        </Link>
      </p>

      <Card className="mb-[var(--space-6)]" data-education-cover-card="">
        <CardBody>
          <CoverUploadForm courseId={course.id} existingSrc={coverUrl} />
        </CardBody>
      </Card>

      <section className="flex flex-col gap-[var(--space-6)]" data-education-videos="">
        <div className="rounded-[var(--radius-lg)] border border-hairline bg-surface">
          <div className="border-b border-hairline px-[var(--space-4)] py-[var(--space-4)]">
            <h2 className="t-body font-medium text-ink">{EDUCATION_ADMIN.videos}</h2>
          </div>
          {modules.length === 0 ? (
            <div className="px-[var(--space-4)] py-[var(--space-6)]">
              <HouseEmpty>{EDUCATION_ADMIN.emptyOutline}</HouseEmpty>
            </div>
          ) : (
            <ul className="flex flex-col">
              {modules.map((module) => {
                const open = openModules[module.id] ?? false;
                return (
                  <li
                    key={module.id}
                    data-education-module={module.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/education-module", module.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const fromId = event.dataTransfer.getData("text/education-module");
                      if (fromId) void onModuleDrop(fromId, module.id);
                    }}
                  >
                    <div className="flex items-center gap-[var(--space-2)] border-b border-hairline px-[var(--space-4)] py-[var(--space-3)]">
                      <span data-education-drag="module" className="text-ink-3" aria-hidden>
                        <DotsSixVertical className="h-4 w-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
                      </span>
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-[var(--space-2)] text-left"
                        onClick={() => toggleModule(module.id)}
                        aria-expanded={open}
                      >
                        {open ? (
                          <CaretDown className="h-4 w-4 shrink-0 text-ink-3" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
                        ) : (
                          <CaretRight className="h-4 w-4 shrink-0 text-ink-3" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
                        )}
                        <span className="truncate t-body font-medium text-ink">{module.title}</span>
                      </button>
                    </div>
                    {open ? (
                      <ul className="flex flex-col">
                        {module.lessons.map((lesson) => {
                          const pill = educationEncodePill(lesson.encode_status, Boolean(lesson.source_key));
                          const duration = courseLessonDurationLabel(lesson.duration_seconds);
                          const active = lesson.id === selectedLessonId;
                          return (
                            <li
                              key={lesson.id}
                              data-education-lesson-row={lesson.id}
                              draggable
                              onDragStart={(event) => {
                                event.stopPropagation();
                                event.dataTransfer.setData("text/education-lesson", `${module.id}:${lesson.id}`);
                              }}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                const payload = event.dataTransfer.getData("text/education-lesson");
                                const [fromModule, fromId] = payload.split(":");
                                if (fromModule === module.id && fromId) {
                                  void onLessonDrop(module.id, fromId, lesson.id);
                                }
                              }}
                            >
                              <button
                                type="button"
                                data-education-select-lesson={lesson.id}
                                onClick={() => selectLesson(module.id, lesson.id)}
                                className={`flex w-full items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] text-left ${
                                  active ? "bg-surface-muted" : ""
                                }`}
                              >
                                <span data-education-drag="lesson" className="text-ink-3" aria-hidden>
                                  <DotsSixVertical className="h-4 w-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate t-body text-ink">{lesson.title}</span>
                                  <span className="mt-1 flex flex-wrap items-center gap-[var(--space-2)] t-body-sm text-ink-3">
                                    {duration ? <span data-education-duration="">{duration}</span> : null}
                                    <span
                                      data-education-encode-pill=""
                                      className="inline-flex rounded-full border border-hairline px-[var(--space-2)] py-0.5"
                                    >
                                      {pill}
                                    </span>
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-hairline px-[var(--space-4)] py-[var(--space-4)]">
            <AddModuleForm courseId={course.id} />
          </div>
        </div>

        <section
          className="rounded-[var(--radius-lg)] border border-hairline bg-surface px-[var(--space-6)] py-[var(--space-6)]"
          data-education-video-pane=""
        >
          {selected ? (
            <div className="flex flex-col gap-[var(--space-6)]">
              <div className="flex flex-col gap-[var(--space-2)]">
                <h2 className="t-body font-medium text-ink">{selected.lesson.title}</h2>
                <div className="flex flex-wrap items-center gap-[var(--space-2)] t-body-sm text-ink-3">
                  {courseLessonDurationLabel(selected.lesson.duration_seconds) ? (
                    <span>{courseLessonDurationLabel(selected.lesson.duration_seconds)}</span>
                  ) : null}
                  {selected.lesson.education_video_id ? (
                    <span data-education-video-id="" className="tabular-nums">
                      {selected.lesson.education_video_id}
                    </span>
                  ) : null}
                </div>
                {selected.lesson.summary ? (
                  <p className="t-body-sm text-ink-2">{selected.lesson.summary}</p>
                ) : null}
              </div>
              <EditLessonButton
                courseId={course.id}
                modules={modules}
                lesson={{
                  id: selected.lesson.id,
                  moduleId: selected.courseModule.id,
                  title: selected.lesson.title,
                  summary: selected.lesson.summary ?? "",
                  durationSeconds: selected.lesson.duration_seconds,
                }}
              />
              <LessonMediaPane
                courseId={course.id}
                lessonId={selected.lesson.id}
                encodePill={educationEncodePill(selected.lesson.encode_status, Boolean(selected.lesson.source_key))}
                encodeError={selected.lesson.encode_error}
                canStartEncode={canStartEducationEncode(selected.lesson)}
                canRefresh={canRefreshEducationEncode(selected.lesson.encode_status)}
              />
            </div>
          ) : (
            <HouseEmpty>
              {modules.length === 0 ? EDUCATION_ADMIN.emptyOutline : EDUCATION_ADMIN.selectVideo}
            </HouseEmpty>
          )}
        </section>
      </section>

      <EducationDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={EDUCATION_ADMIN.settings}
      >
        <EditCourseForm
          courseId={course.id}
          title={course.title}
          description={course.description}
          catalogCode={course.catalogCode}
          consumePath={consumePath}
          status={course.status}
          isFlagshipFree={course.isFlagshipFree}
          priceCents={course.priceCents}
          instructorId={course.instructorId}
          instructors={instructors}
          onSaved={() => setSettingsOpen(false)}
        />
      </EducationDrawer>
    </div>
  );
}
