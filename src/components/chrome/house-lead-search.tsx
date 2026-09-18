"use client";

import Link from "next/link";
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
import { HOUSE_ICON_BUTTON_CLASS, HOUSE_SEARCH_PILL_CLASS } from "@/lib/house-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";

// One mid-lead search SoT for Social live Explore and Education quiet
// courses/videos. Slot into HouseLeadChrome search / phoneSearch.
// Geometry is HOUSE_LEAD_SEARCH_PILL_CLASS + HOUSE_SEARCH_PILL_CLASS —
// same tokens the Titles catalog search reuses. Do not fork the pill.
// Do not import the catalog search control. Aggregation keeps no top search.

export type HouseLeadSearchTone = "live" | "quiet";
export type HouseLeadSearchPresentation = "field" | "icon";

export function HouseLeadSearch({
  tone,
  presentation = "field",
  action,
  placeholder,
  label,
  inputId,
  className,
}: {
  tone: HouseLeadSearchTone;
  presentation?: HouseLeadSearchPresentation;
  action?: string;
  placeholder?: string;
  label?: string;
  inputId?: string;
  className?: string;
}) {
  const live = tone === "live";
  const resolvedPlaceholder =
    placeholder ?? (live ? SOCIAL.explore.searchSocial : EDUCATION_SEARCH.placeholder);
  const resolvedLabel = label ?? (live ? SOCIAL.explore.searchSocial : EDUCATION_SEARCH.label);
  const resolvedAction = action ?? (live ? SOCIAL_ROUTES.explore : undefined);
  const resolvedInputId = inputId ?? (live ? "social-header-q" : "education-header-q");

  if (presentation === "icon") {
    return (
      <Link
        href={resolvedAction ?? SOCIAL_ROUTES.explore}
        prefetch
        aria-label={resolvedLabel}
        data-house-lead-search-icon=""
        data-social-header-search-icon={live ? "" : undefined}
        className={cn(
          "flex size-8 items-center justify-center text-ink-2 md:hidden",
          HOUSE_ICON_BUTTON_CLASS,
        )}
      >
        <MagnifyingGlass
          className="size-5"
          weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
          aria-hidden
        />
      </Link>
    );
  }

  if (!live) {
    return (
      <QuietHouseLeadSearchField
        action={resolvedAction}
        placeholder={resolvedPlaceholder}
        label={resolvedLabel}
        inputId={resolvedInputId}
        className={className}
      />
    );
  }

  return (
    <HouseLeadSearchField
      tone="live"
      action={resolvedAction ?? SOCIAL_ROUTES.explore}
      placeholder={resolvedPlaceholder}
      label={resolvedLabel}
      inputId={resolvedInputId}
      className={className}
    />
  );
}

function QuietHouseLeadSearchField({
  action,
  placeholder,
  label,
  inputId,
  className,
}: {
  action?: string;
  placeholder: string;
  label: string;
  inputId: string;
  className?: string;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const q = parseEducationSearchQuery(params.get("q"));

  return (
    <HouseLeadSearchField
      tone="quiet"
      action={action ?? educationSearchAction(pathname)}
      placeholder={placeholder}
      label={label}
      inputId={inputId}
      defaultValue={q}
      className={className}
    />
  );
}

function HouseLeadSearchField({
  tone,
  action,
  placeholder,
  label,
  inputId,
  defaultValue,
  className,
}: {
  tone: HouseLeadSearchTone;
  action: string;
  placeholder: string;
  label: string;
  inputId: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <form
      data-house-lead-search-field=""
      data-house-lead-search-tone={tone}
      data-social-header-search={tone === "live" ? "" : undefined}
      data-education-header-search={tone === "quiet" ? "" : undefined}
      action={action}
      method="get"
      className={cn(HOUSE_LEAD_SEARCH_PILL_CLASS, HOUSE_SEARCH_PILL_CLASS, className)}
    >
      <MagnifyingGlass
        className="size-4 shrink-0 text-ink-3"
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden
      />
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Input
        variant="bare"
        id={inputId}
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-full min-w-0 flex-1 placeholder:text-ink-3"
      />
    </form>
  );
}
