"use client";

import { useRouter } from "next/navigation";

import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";

export function CourseRetry({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      data-course-retry=""
      className={TEXT_ACTION_CLASS}
      onClick={() => {
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
