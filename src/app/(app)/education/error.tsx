"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { SOCIAL } from "@/lib/social";

export default function SocialCoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div data-course-error="">
      <PageHeader title={SOCIAL.courses.title} />
      <div className="flex flex-col items-start gap-[var(--space-3)]">
        <HouseEmpty>{SOCIAL.courses.error}</HouseEmpty>
        <button type="button" data-course-retry="" className={TEXT_ACTION_CLASS} onClick={reset}>
          {SOCIAL.courses.retry}
        </button>
      </div>
    </div>
  );
}
