"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  EDUCATION_SEARCH,
  educationSearchAction,
  parseEducationSearchQuery,
} from "@/lib/course-search";
import { HOUSE_LEAD_SEARCH_PILL_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_SEARCH_PILL_CLASS } from "@/lib/house-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

export function EducationHeaderSearch({
  className,
  inputId = "education-header-q",
}: {
  className?: string;
  inputId?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const q = parseEducationSearchQuery(params.get("q"));
  const action = educationSearchAction(pathname);

  return (
    <form
      data-education-header-search=""
      action={action}
      method="get"
      className={cn(
        HOUSE_LEAD_SEARCH_PILL_CLASS,
        HOUSE_SEARCH_PILL_CLASS,
        className,
      )}
    >
      <MagnifyingGlass
        className="size-4 shrink-0 text-ink-3"
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden
      />
      <label className="sr-only" htmlFor={inputId}>
        {EDUCATION_SEARCH.label}
      </label>
      <Input
        variant="bare"
        id={inputId}
        name="q"
        defaultValue={q}
        placeholder={EDUCATION_SEARCH.placeholder}
        className="h-full min-w-0 flex-1 placeholder:text-ink-3"
      />
    </form>
  );
}
