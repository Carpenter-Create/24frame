import Link from "next/link";
import { notFound } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { loadEducationAdminDetail } from "@/lib/education-admin";
import {
  COURSE_STATUS_LABELS,
  EDUCATION_ADMIN,
  EDUCATION_HREF,
  educationCommercialLabel,
  educationEncodeLabel,
} from "@/lib/education";
import { SOCIAL_ROUTES, socialCourseHref } from "@/lib/social";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  AddModuleForm,
  CoverUploadForm,
  EditCourseForm,
  LessonAdminForm,
  NewLessonButton,
} from "../education-forms";

export default async function GcEducationCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await loadEducationAdminDetail(createAdminClient(), slug);

  if (detail.failed) {
    return (
      <div data-gc-education-error="">
        <PageHeader title={EDUCATION_ADMIN.title} backLink={{ href: EDUCATION_HREF, label: EDUCATION_ADMIN.title }} />
        <HouseEmpty>{EDUCATION_ADMIN.error}</HouseEmpty>
      </div>
    );
  }

  if (!detail.course) notFound();

  const course = detail.course;

  return (
    <div data-gc-education-course={course.slug}>
      <PageHeader
        title={course.title}
        backLink={{ href: EDUCATION_HREF, label: EDUCATION_ADMIN.title }}
        actions={
          <NewLessonButton
            courseId={course.id}
            modules={detail.modules}
            defaultModuleId={detail.modules[0]?.id}
          />
        }
      />
      <p className="mb-[var(--space-6)] t-body-sm text-ink-3">
        <span data-education-catalog-code="">{course.catalog_code}</span>
        {" · "}
        {COURSE_STATUS_LABELS[course.status]}
        {" · "}
        <span data-education-model="">
          {educationCommercialLabel(course.is_flagship_free, course.price_cents)}
        </span>
        {" · "}
        <Link href={socialCourseHref(course.slug)}>{EDUCATION_ADMIN.consume}</Link>
        {" · "}
        {SOCIAL_ROUTES.courses}/{course.slug}
      </p>
      <div className="flex flex-col gap-[var(--space-8)]">
        <EditCourseForm
          courseId={course.id}
          title={course.title}
          description={course.description ?? ""}
          slug={course.slug}
          catalogCode={course.catalog_code}
          status={course.status}
          isFlagshipFree={course.is_flagship_free}
          priceCents={course.price_cents}
          instructorId={course.instructor_id}
          instructors={detail.instructors}
        />
        <CoverUploadForm courseId={course.id} />
        <AddModuleForm courseId={course.id} />
        {detail.modules.length === 0 ? <HouseEmpty>{EDUCATION_ADMIN.empty}</HouseEmpty> : null}
        {detail.modules.map((module) => (
          <Card key={module.id}>
            <CardHeader>
              <CardTitle>{module.title}</CardTitle>
            </CardHeader>
            <CardBody className="flex flex-col gap-[var(--space-6)]">
              {module.lessons.map((lesson) => (
                <LessonAdminForm
                  key={lesson.id}
                  courseId={course.id}
                  lessonId={lesson.id}
                  title={lesson.title}
                  summary={lesson.summary ?? ""}
                  durationSeconds={lesson.duration_seconds}
                  encodeLabel={educationEncodeLabel(lesson.encode_status)}
                  hasSource={Boolean(lesson.source_key)}
                />
              ))}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
