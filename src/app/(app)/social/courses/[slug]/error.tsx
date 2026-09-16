"use client";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";

export default function SocialCourseDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div data-course-error="">
      <PageHeader
        title={SOCIAL.courses.title}
        backLink={{ href: SOCIAL_ROUTES.courses, label: SOCIAL.courses.title }}
      />
      <div className="flex flex-col items-start gap-[var(--space-3)]">
        <HouseEmpty>{SOCIAL.courses.detailError}</HouseEmpty>
        <button type="button" data-course-retry="" className={TEXT_ACTION_CLASS} onClick={reset}>
          {SOCIAL.courses.retry}
        </button>
      </div>
    </div>
  );
}
