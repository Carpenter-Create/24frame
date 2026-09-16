"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import {
  EDUCATION_ADMIN,
  EDUCATION_HREF,
  educationPriceInputValue,
  educationProductModel,
  type EducationProductModel,
} from "@/lib/education";
import {
  attachEducationCover,
  attachEducationLessonSource,
  createEducationCourse,
  createEducationLesson,
  createEducationModule,
  presignEducationUpload,
  refreshEducationLessonEncode,
  startEducationLessonEncode,
  updateEducationCourse,
  updateEducationLesson,
} from "./actions";

const field = "flex flex-col gap-1";
const label = "t-body-sm text-ink-2";

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

async function putObject(url: string, file: File): Promise<boolean> {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  return res.ok;
}

export function CreateCourseForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await createEducationCourse({
      slug: String(form.get("slug") ?? ""),
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      model: String(form.get("model") ?? "free"),
      price: String(form.get("price") ?? ""),
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    if (res.slug) {
      router.push(`${EDUCATION_HREF}/${res.slug}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4" data-education-create="">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.courseTitle}</span>
        <Input name="title" required maxLength={160} />
      </label>
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.slug}</span>
        <Input name="slug" required maxLength={80} />
      </label>
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.description}</span>
        <Input name="description" maxLength={2000} />
      </label>
      <CourseProductFields defaultModel="free" />
      <Button type="submit" disabled={saving}>
        {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.create}
      </Button>
    </form>
  );
}

export function EditCourseForm({
  courseId,
  title,
  description,
  isFlagshipFree,
  priceCents,
}: {
  courseId: string;
  title: string;
  description: string;
  isFlagshipFree: boolean;
  priceCents: number | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await updateEducationCourse({
      courseId,
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      model: String(form.get("model") ?? "free"),
      price: String(form.get("price") ?? ""),
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4" data-education-edit="">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.courseTitle}</span>
        <Input name="title" required maxLength={160} defaultValue={title} />
      </label>
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.description}</span>
        <Input name="description" maxLength={2000} defaultValue={description} />
      </label>
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    const signed = await presignEducationUpload({
      kind: "cover",
      courseId,
      contentType: file.type,
      byteLength: file.size,
    });
    if (signed.error || !signed.url || !signed.key) {
      setSaving(false);
      return setError(signed.error ?? EDUCATION_ADMIN.uploadFailed);
    }
    const ok = await putObject(signed.url, file);
    if (!ok) {
      setSaving(false);
      return setError(EDUCATION_ADMIN.uploadFailed);
    }
    const attached = await attachEducationCover({ courseId, key: signed.key });
    setSaving(false);
    if (attached.error) return setError(attached.error);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3" data-education-cover="">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.cover}</span>
        <Input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
      </label>
      <Button type="submit" variant="secondary" disabled={saving}>
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

export function AddLessonForm({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    const res = await createEducationLesson({
      moduleId,
      title: String(form.get("title") ?? ""),
      freePreview: form.get("freePreview") === "on",
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3" data-education-add-lesson="">
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <label className={field}>
        <span className={label}>{EDUCATION_ADMIN.lessonTitle}</span>
        <Input name="title" required maxLength={160} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-2 t-body-sm text-ink-2">
          <input type="checkbox" name="freePreview" />
          {EDUCATION_ADMIN.preview}
        </span>
        <span className="t-body-sm text-ink-3">{EDUCATION_ADMIN.previewHint}</span>
      </label>
      <Button type="submit" variant="secondary" disabled={saving}>
        {saving ? EDUCATION_ADMIN.saving : EDUCATION_ADMIN.addLesson}
      </Button>
    </form>
  );
}

export function LessonAdminForm({
  courseId,
  lessonId,
  title,
  durationSeconds,
  freePreview,
  encodeLabel,
  hasSource,
}: {
  courseId: string;
  lessonId: string;
  title: string;
  durationSeconds: number | null;
  freePreview: boolean;
  encodeLabel: string;
  hasSource: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const durationRaw = String(form.get("durationSeconds") ?? "").trim();
    setSaving(true);
    setError("");
    const res = await updateEducationLesson({
      lessonId,
      title: String(form.get("title") ?? ""),
      durationSeconds: durationRaw === "" ? null : Number(durationRaw),
      freePreview: form.get("freePreview") === "on",
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = (e.currentTarget.elements.namedItem("file") as HTMLInputElement | null)?.files?.[0];
    if (!file) return;
    setSaving(true);
    setError("");
    const signed = await presignEducationUpload({
      kind: "source",
      courseId,
      lessonId,
      contentType: file.type,
      byteLength: file.size,
    });
    if (signed.error || !signed.url || !signed.key) {
      setSaving(false);
      return setError(signed.error ?? EDUCATION_ADMIN.uploadFailed);
    }
    const ok = await putObject(signed.url, file);
    if (!ok) {
      setSaving(false);
      return setError(EDUCATION_ADMIN.uploadFailed);
    }
    const attached = await attachEducationLessonSource({ courseId, lessonId, key: signed.key });
    setSaving(false);
    if (attached.error) return setError(attached.error);
    router.refresh();
  }

  async function onEncode() {
    setSaving(true);
    setError("");
    const res = await startEducationLessonEncode({ lessonId });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  async function onRefresh() {
    setSaving(true);
    setError("");
    const res = await refreshEducationLessonEncode({ lessonId });
    setSaving(false);
    if (res.error) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3" data-education-lesson={lessonId}>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <p className="t-body-sm text-ink-3">{encodeLabel}</p>
      <form onSubmit={onSave} className="flex max-w-xl flex-col gap-3">
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.lessonTitle}</span>
          <Input name="title" required maxLength={160} defaultValue={title} />
        </label>
        <label className={field}>
          <span className={label}>{EDUCATION_ADMIN.duration}</span>
          <Input name="durationSeconds" type="number" min={1} defaultValue={durationSeconds ?? ""} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-2 t-body-sm text-ink-2">
            <input type="checkbox" name="freePreview" defaultChecked={freePreview} />
            {EDUCATION_ADMIN.preview}
          </span>
          <span className="t-body-sm text-ink-3">{EDUCATION_ADMIN.previewHint}</span>
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
