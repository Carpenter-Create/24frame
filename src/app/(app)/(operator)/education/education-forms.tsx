"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Textarea } from "@/components/ui/textarea";
import type { InstructorRow } from "@/lib/education-admin";
import {
  COURSE_STATUSES,
  COURSE_STATUS_LABELS,
  EDUCATION_ADMIN,
  EDUCATION_HREF,
  EDUCATION_NAME_MAX,
  EDUCATION_SUMMARY_MAX,
  durationSecondsToMinutesInput,
  educationCharCount,
  educationPriceInputValue,
  educationProductModel,
  type CourseStatus,
  type EducationProductModel,
} from "@/lib/education";
import type { CourseModuleRow } from "@/lib/courses";
import {
  createEducationCourse,
  createEducationLesson,
  createEducationModule,
  refreshEducationLessonEncode,
  startEducationLessonEncode,
  updateEducationCourse,
  updateEducationLesson,
  uploadEducationCover,
  uploadEducationLessonCover,
  uploadEducationLessonSource,
} from "./actions";

const field = "flex flex-col gap-1";
const label = "t-body-sm text-ink-2";
const countClass = "t-body-sm tabular-nums text-ink-3";

function CourseProductFields({
  defaultModel,
  defaultPriceCents,
}: {
  defaultModel: EducationProductModel;
  defaultPriceCents?: number | null;
}) {
  const [model, setModel] = useState<EducationProductModel>(defaultModel);
  return (
    <fieldset className="flex flex-col gap-3" data-education-product="">
      <legend className={label}>{EDUCATION_ADMIN.model}</legend>
      <div className="flex gap-[var(--space-4)]">
        <label className="flex items-center gap-2 t-body-sm text-ink-2">
          <input
            type="radio"
            name="model"
            value="free"
            checked={model === "free"}
            onChange={() => setModel("free")}
          />
          {EDUCATION_ADMIN.free}
        </label>
        <label className="flex items-center gap-2 t-body-sm text-ink-2">
          <input
            type="radio"
            name="model"
            value="paid"
            checked={model === "paid"}
            onChange={() => setModel("paid")}
          />
          {EDUCATION_ADMIN.paid}
        </label>
      </div>
      {model === "paid" ? (
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.price}</span>
          <span className="t-body-sm text-ink-3">{EDUCATION_ADMIN.oneTime}</span>
          <Input
            name="price"
            inputMode="decimal"
            required
            defaultValue={educationPriceInputValue(defaultPriceCents)}
          />
        </label>
      ) : null}
    </fieldset>
  );
}

function CoverDropzone({
  file,
  onFile,
  accept,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className={field}>
      <span className={label}>{EDUCATION_ADMIN.cover}</span>
      <button
        type="button"
        data-education-cover-dropzone=""
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-[var(--radius)] border border-dashed border-hairline bg-surface-muted text-ink-3 transition hover:border-accent"
      >
        {preview ? (
          // Preview only. Signed consume covers stay on CourseCover.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="px-[var(--space-4)] text-center t-body-sm">{EDUCATION_ADMIN.coverHint}</span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onFile(event.currentTarget.files?.[0] ?? null)}
      />
    </div>
  );
}

function CountedInput({
  name,
  labelText,
  max,
  value,
  onChange,
  multiline,
  required,
}: {
  name: string;
  labelText: string;
  max: number;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <label className={field}>
      <span className="flex items-baseline justify-between gap-3">
        <span className={label}>{labelText}</span>
        <span className={countClass} data-education-char-count={name}>
          {educationCharCount(value, max)}
        </span>
      </span>
      {multiline ? (
        <Textarea
          name={name}
          required={required}
          maxLength={max}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      ) : (
        <Input
          name={name}
          required={required}
          maxLength={max}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )}
    </label>
  );
}

async function uploadCover(args: {
  kind: "cover" | "lesson_cover";
  courseId: string;
  lessonId?: string;
  file: File;
}): Promise<string | null> {
  const body = new FormData();
  body.set("courseId", args.courseId);
  body.set("file", args.file);
  if (args.kind === "cover") {
    const attached = await uploadEducationCover(body);
    return attached.error ?? null;
  }
  body.set("lessonId", args.lessonId ?? "");
  const attached = await uploadEducationLessonCover(body);
  return attached.error ?? null;
}

export function NewCourseButton({ instructors }: { instructors: InstructorRow[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" data-education-create="" onClick={() => setOpen(true)}>
        {EDUCATION_ADMIN.newCourse}
      </Button>
      <NewCourseModal open={open} onClose={() => setOpen(false)} instructors={instructors} />
    </>
  );
}

export function NewCourseModal({
  open,
  onClose,
  instructors,
}: {
  open: boolean;
  onClose: () => void;
  instructors: InstructorRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [cover, setCover] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await createEducationCourse({
      title,
      description: summary,
      slug: String(form.get("slug") ?? ""),
      model: String(form.get("model") ?? "free"),
      price: String(form.get("price") ?? ""),
      instructorId: String(form.get("instructorId") ?? "") || undefined,
      instructorName: String(form.get("instructorName") ?? "") || undefined,
    });
    if (res.error || !res.slug || !res.courseId) {
      setSaving(false);
      return setError(res.error ?? EDUCATION_ADMIN.invalid);
    }
    if (cover) {
      const uploadError = await uploadCover({ kind: "cover", courseId: res.courseId, file: cover });
      if (uploadError) {
        setSaving(false);
        router.push(`${EDUCATION_HREF}/${res.slug}`);
        router.refresh();
        return setError(uploadError);
      }
    }
    setSaving(false);
    onClose();
    router.push(`${EDUCATION_HREF}/${res.slug}`);
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} title={EDUCATION_ADMIN.newCourse}>
      <form onSubmit={onSubmit} className="flex flex-col gap-[var(--space-6)]" data-education-new-course="">
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <CoverDropzone file={cover} onFile={setCover} accept="image/jpeg,image/png,image/webp" />
        <CountedInput
          name="title"
          labelText={EDUCATION_ADMIN.courseTitle}
          max={EDUCATION_NAME_MAX}
          value={title}
          onChange={setTitle}
          required
        />
        <CountedInput
          name="description"
          labelText={EDUCATION_ADMIN.description}
          max={EDUCATION_SUMMARY_MAX}
          value={summary}
          onChange={setSummary}
          multiline
        />
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.slug}</span>
          <span className="t-body-sm text-ink-3">{EDUCATION_ADMIN.slugHint}</span>
          <Input name="slug" maxLength={80} />
        </label>
        <InstructorFields instructors={instructors} />
        <CourseProductFields defaultModel="free" />
        <div className="flex items-center justify-end gap-[var(--space-3)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            {EDUCATION_ADMIN.cancel}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.create}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function InstructorFields({
  instructors,
  defaultInstructorId,
}: {
  instructors: InstructorRow[];
  defaultInstructorId?: string | null;
}) {
  return (
    <fieldset className="flex flex-col gap-3" data-education-instructor="">
      <legend className={label}>{EDUCATION_ADMIN.instructor}</legend>
      <span className="t-body-sm text-ink-3">{EDUCATION_ADMIN.instructorHint}</span>
      {instructors.length > 0 ? (
        <select
          name="instructorId"
          defaultValue={defaultInstructorId ?? ""}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 t-control text-ink"
        >
          <option value=""></option>
          {instructors.map((instructor) => (
            <option key={instructor.id} value={instructor.id}>
              {instructor.name}
            </option>
          ))}
        </select>
      ) : null}
      <Input name="instructorName" maxLength={160} placeholder="" />
    </fieldset>
  );
}

export function EditCourseForm({
  courseId,
  title,
  description,
  slug,
  catalogCode,
  status,
  isFlagshipFree,
  priceCents,
  instructorId,
  instructors,
}: {
  courseId: string;
  title: string;
  description: string;
  slug: string;
  catalogCode: string;
  status: CourseStatus;
  isFlagshipFree: boolean;
  priceCents: number | null;
  instructorId: string | null;
  instructors: InstructorRow[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(title);
  const [summary, setSummary] = useState(description);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await updateEducationCourse({
      courseId,
      title: name,
      description: summary,
      slug: String(form.get("slug") ?? ""),
      model: String(form.get("model") ?? "free"),
      price: String(form.get("price") ?? ""),
      status: String(form.get("status") ?? status),
      instructorId: String(form.get("instructorId") ?? "") || undefined,
      instructorName: String(form.get("instructorName") ?? "") || undefined,
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    if (res.slug && res.slug !== slug) {
      router.push(`${EDUCATION_HREF}/${res.slug}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-[var(--space-6)]" data-education-edit="">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <p className="t-body-sm text-ink-3" data-education-catalog-code="">
        {EDUCATION_ADMIN.catalogCode}
        {": "}
        {catalogCode}
      </p>
      <CountedInput
        name="title"
        labelText={EDUCATION_ADMIN.courseTitle}
        max={EDUCATION_NAME_MAX}
        value={name}
        onChange={setName}
        required
      />
      <CountedInput
        name="description"
        labelText={EDUCATION_ADMIN.description}
        max={EDUCATION_SUMMARY_MAX}
        value={summary}
        onChange={setSummary}
        multiline
      />
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.slug}</span>
        <span className="t-body-sm text-ink-3">{EDUCATION_ADMIN.slugHint}</span>
        <Input name="slug" maxLength={80} defaultValue={slug} />
      </label>
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.status}</span>
        <select
          name="status"
          defaultValue={status}
          className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 t-control text-ink"
        >
          {COURSE_STATUSES.map((value) => (
            <option key={value} value={value}>
              {COURSE_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <InstructorFields instructors={instructors} defaultInstructorId={instructorId} />
      <CourseProductFields
        defaultModel={educationProductModel(isFlagshipFree)}
        defaultPriceCents={priceCents}
      />
      <Button type="submit" disabled={saving}>
        {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.save}
      </Button>
    </form>
  );
}

export function CoverUploadForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.set("courseId", courseId);
      body.set("file", file);
      const attached = await uploadEducationCover(body);
      if (attached.error) {
        setError(attached.error);
        return;
      }
      router.refresh();
    } catch {
      setError(EDUCATION_ADMIN.uploadFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-[var(--space-4)]" data-education-cover="">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <CoverDropzone file={file} onFile={setFile} accept="image/jpeg,image/png,image/webp" />
      <Button type="submit" variant="secondary" disabled={saving || !file}>
        {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.uploadCover}
      </Button>
    </form>
  );
}

export function AddModuleForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await createEducationModule({
      courseId,
      title: String(form.get("title") ?? ""),
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3" data-education-add-module="">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.moduleTitle}</span>
        <Input name="title" required maxLength={160} />
      </label>
      <Button type="submit" variant="secondary" disabled={saving}>
        {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.addModule}
      </Button>
    </form>
  );
}

export function NewLessonButton({
  courseId,
  modules,
  defaultModuleId,
}: {
  courseId: string;
  modules: CourseModuleRow[];
  defaultModuleId?: string;
}) {
  const [open, setOpen] = useState(false);
  if (modules.length === 0) {
    return (
      <p className="t-body-sm text-ink-3" data-education-needs-module="">
        {EDUCATION_ADMIN.needsModule}
      </p>
    );
  }
  return (
    <>
      <Button type="button" data-education-add-lesson="" onClick={() => setOpen(true)}>
        {EDUCATION_ADMIN.newLesson}
      </Button>
      <NewLessonModal
        open={open}
        onClose={() => setOpen(false)}
        courseId={courseId}
        modules={modules}
        defaultModuleId={defaultModuleId}
      />
    </>
  );
}

export function NewLessonModal({
  open,
  onClose,
  courseId,
  modules,
  defaultModuleId,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  modules: CourseModuleRow[];
  defaultModuleId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [cover, setCover] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const durationRaw = String(form.get("durationMinutes") ?? "").trim();
    setSaving(true);
    setError("");
    const res = await createEducationLesson({
      moduleId: String(form.get("moduleId") ?? ""),
      title: name,
      summary,
      durationMinutes: durationRaw === "" ? null : Number(durationRaw),
      lessonType: "lesson",
    });
    if (res.error || !res.lessonId) {
      setSaving(false);
      return setError(res.error ?? EDUCATION_ADMIN.invalid);
    }
    if (cover) {
      const uploadError = await uploadCover({
        kind: "lesson_cover",
        courseId,
        lessonId: res.lessonId,
        file: cover,
      });
      if (uploadError) {
        setSaving(false);
        router.refresh();
        return setError(uploadError);
      }
    }
    setSaving(false);
    setName("");
    setSummary("");
    setCover(null);
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onClose={onClose} title={EDUCATION_ADMIN.newLesson}>
      <form onSubmit={onSubmit} className="flex flex-col gap-[var(--space-6)]" data-education-new-lesson="">
        {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
        <CoverDropzone file={cover} onFile={setCover} accept="image/jpeg,image/png,image/webp" />
        <fieldset className="flex flex-col gap-3" data-education-lesson-types="">
          <legend className={label}>{EDUCATION_ADMIN.lessonType}</legend>
          <div
            data-education-lesson-type="lesson"
            className="rounded-[var(--radius)] border border-accent bg-surface px-[var(--space-4)] py-[var(--space-4)]"
          >
            <p className="t-body font-medium text-ink">{EDUCATION_ADMIN.lessonTypeLesson}</p>
          </div>
        </fieldset>
        <CountedInput
          name="title"
          labelText={EDUCATION_ADMIN.lessonTitle}
          max={EDUCATION_NAME_MAX}
          value={name}
          onChange={setName}
          required
        />
        <CountedInput
          name="summary"
          labelText={EDUCATION_ADMIN.lessonSummary}
          max={EDUCATION_SUMMARY_MAX}
          value={summary}
          onChange={setSummary}
          multiline
        />
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.duration}</span>
          <Input name="durationMinutes" type="number" min={1} max={24 * 60} />
        </label>
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.modulePlacement}</span>
          <select
            name="moduleId"
            required
            defaultValue={defaultModuleId ?? modules[0]?.id}
            className="w-full rounded-[var(--radius-sm)] border border-hairline bg-surface px-3 py-2 t-control text-ink"
          >
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center justify-end gap-[var(--space-3)]">
          <Button type="button" variant="ghost" onClick={onClose}>
            {EDUCATION_ADMIN.cancel}
          </Button>
          <Button type="submit" disabled={saving} data-education-add-lesson-submit="">
            {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.addLesson}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function LessonAdminForm({
  courseId,
  lessonId,
  title,
  summary,
  durationSeconds,
  encodeLabel,
  hasSource,
}: {
  courseId: string;
  lessonId: string;
  title: string;
  summary: string;
  durationSeconds: number | null;
  encodeLabel: string;
  hasSource: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(title);
  const [lessonSummary, setLessonSummary] = useState(summary);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const durationRaw = String(form.get("durationMinutes") ?? "").trim();
    setSaving(true);
    setError("");
    try {
      const res = await updateEducationLesson({
        lessonId,
        title: name,
        summary: lessonSummary,
        durationMinutes: durationRaw === "" ? null : Number(durationRaw),
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError(EDUCATION_ADMIN.invalid);
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.set("courseId", courseId);
      body.set("lessonId", lessonId);
      body.set("file", file);
      const attached = await uploadEducationLessonSource(body);
      if (attached.error) {
        setError(attached.error);
        return;
      }
      router.refresh();
    } catch {
      setError(EDUCATION_ADMIN.uploadFailed);
    } finally {
      setSaving(false);
    }
  }

  async function onEncode() {
    setSaving(true);
    setError("");
    try {
      const res = await startEducationLessonEncode({ lessonId });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError(EDUCATION_ADMIN.encodeFailed);
    } finally {
      setSaving(false);
    }
  }

  async function onRefresh() {
    setSaving(true);
    setError("");
    try {
      const res = await refreshEducationLessonEncode({ lessonId });
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    } catch {
      setError(EDUCATION_ADMIN.encodeFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3" data-education-lesson={lessonId}>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <p className="t-body-sm text-ink-3">{encodeLabel}</p>
      <form onSubmit={onSave} className="flex max-w-xl flex-col gap-[var(--space-4)]">
        <CountedInput
          name="title"
          labelText={EDUCATION_ADMIN.lessonTitle}
          max={EDUCATION_NAME_MAX}
          value={name}
          onChange={setName}
          required
        />
        <CountedInput
          name="summary"
          labelText={EDUCATION_ADMIN.lessonSummary}
          max={EDUCATION_SUMMARY_MAX}
          value={lessonSummary}
          onChange={setLessonSummary}
          multiline
        />
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.duration}</span>
          <Input
            name="durationMinutes"
            type="number"
            min={1}
            max={24 * 60}
            defaultValue={durationSecondsToMinutesInput(durationSeconds)}
          />
        </label>
        <Button type="submit" variant="secondary" disabled={saving}>
          {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.save}
        </Button>
      </form>
      <form onSubmit={onUpload} className="flex max-w-xl flex-col gap-3">
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.source}</span>
          <Input name="file" type="file" accept="video/mp4,video/quicktime,video/webm" required />
        </label>
        <Button type="submit" variant="secondary" disabled={saving}>
          {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.uploadSource}
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={saving || !hasSource} onClick={() => void onEncode()}>
          {EDUCATION_ADMIN.startEncode}
        </Button>
        <Button type="button" variant="ghost" disabled={saving} onClick={() => void onRefresh()}>
          {EDUCATION_ADMIN.refreshEncode}
        </Button>
      </div>
    </div>
  );
}

export function CreateCourseForm() {
  return <NewCourseButton instructors={[]} />;
}
