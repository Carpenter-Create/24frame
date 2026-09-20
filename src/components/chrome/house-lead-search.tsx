"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";

import { HouseVoiceMic } from "@/components/chrome/house-voice-mic";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  EDUCATION_SEARCH,
  educationSearchAction,
  parseEducationSearchQuery,
} from "@/lib/course-search";
import { HOUSE_VOICE_FOCUS_HOST_CLASS } from "@/lib/form-control";
import { HOUSE_HEADER_TRAILING_HIT_CLASS, HOUSE_LEAD_SEARCH_PILL_CLASS } from "@/lib/house-lead-chrome";
import {
  HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
  HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
} from "@/lib/house-phone-shell";
import { HOUSE_SEARCH_PILL_CLASS } from "@/lib/house-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import {
  SOCIAL,
  SOCIAL_ROUTES,
  SOCIAL_SEARCH_INTENT_PARAM,
  SOCIAL_SEARCH_PEOPLE_INTENT,
  socialSearchHref,
} from "@/lib/social";
import { ingestSpeechLearning } from "@/lib/speech-learning";

// One mid-lead search SoT for Social live people search and Education
// quiet courses/videos. Slot into HouseLeadChrome search / underNav /
// trailingSearch. Geometry is HOUSE_LEAD_SEARCH_PILL_CLASS +
// HOUSE_SEARCH_PILL_CLASS — same tokens the Titles catalog search
// reuses. Do not fork the pill. Do not import the catalog search
// control. Aggregation keeps no top search. Phone Social 🔍 opens
// Search with people intent (suggested people + search). Live Social
// field submits there too. Do not Link the icon to Explore.

export type HouseLeadSearchTone = "live" | "quiet";
export type HouseLeadSearchPresentation = "field" | "icon";

export function HouseLeadSearch({
  tone,
  presentation = "field",
  action,
  placeholder,
  label,
  inputId,
  autoFocus = false,
  className,
}: {
  tone: HouseLeadSearchTone;
  presentation?: HouseLeadSearchPresentation;
  action?: string;
  placeholder?: string;
  label?: string;
  inputId?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const live = tone === "live";
  const resolvedPlaceholder =
    placeholder ?? (live ? SOCIAL.search.searchPlaceholder : EDUCATION_SEARCH.placeholder);
  const resolvedLabel = label ?? (live ? SOCIAL.explore.searchSocial : EDUCATION_SEARCH.label);
  const resolvedAction = action ?? (live ? SOCIAL_ROUTES.search : undefined);
  const resolvedInputId = inputId ?? (live ? "social-header-q" : "education-header-q");

  if (presentation === "icon") {
    return (
      <Link
        href={socialSearchHref({ intent: "people" })}
        aria-label={resolvedLabel}
        data-house-lead-search-icon=""
        data-social-header-search-icon=""
        className={cn(
          HOUSE_HEADER_TRAILING_HIT_CLASS,
          HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
          "md:hidden",
        )}
      >
        <MagnifyingGlass
          className={HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS}
          weight={HOUSE_PHONE_CHROME_ICON_WEIGHT}
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
        autoFocus={autoFocus}
        className={className}
      />
    );
  }

  return (
    <HouseLeadSearchField
      tone="live"
      action={resolvedAction ?? SOCIAL_ROUTES.search}
      placeholder={resolvedPlaceholder}
      label={resolvedLabel}
      inputId={resolvedInputId}
      autoFocus={autoFocus}
      className={className}
    />
  );
}

function QuietHouseLeadSearchField({
  action,
  placeholder,
  label,
  inputId,
  autoFocus,
  className,
}: {
  action?: string;
  placeholder: string;
  label: string;
  inputId: string;
  autoFocus?: boolean;
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
      autoFocus={autoFocus}
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
  autoFocus,
  className,
}: {
  tone: HouseLeadSearchTone;
  action: string;
  placeholder: string;
  label: string;
  inputId: string;
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  const workspace = tone === "live" ? "social" : "education";
  const [value, setValue] = useState(defaultValue ?? "");
  const lastVoiceRef = useRef("");

  return (
    <form
      data-house-lead-search-field=""
      data-house-lead-search-tone={tone}
      data-house-voice-host=""
      data-social-header-search={tone === "live" ? "" : undefined}
      data-education-header-search={tone === "quiet" ? "" : undefined}
      action={action}
      method="get"
      className={cn(
        HOUSE_LEAD_SEARCH_PILL_CLASS,
        HOUSE_SEARCH_PILL_CLASS,
        HOUSE_VOICE_FOCUS_HOST_CLASS,
        className,
      )}
      onSubmit={() => {
        if (value.trim() === lastVoiceRef.current.trim()) return;
        ingestSpeechLearning({
          text: value,
          source: "typed",
          workspace,
        });
      }}
    >
      <MagnifyingGlass
        className="size-4 shrink-0 text-ink-3"
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden
      />
      {tone === "live" ? (
        <input type="hidden" name={SOCIAL_SEARCH_INTENT_PARAM} value={SOCIAL_SEARCH_PEOPLE_INTENT} />
      ) : null}
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Input
        variant="bare"
        id={inputId}
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="h-full min-w-0 flex-1 placeholder:text-ink-3"
      />
      <HouseVoiceMic
        surface="search"
        workspace={workspace}
        getValue={() => value}
        onValue={(next) => {
          lastVoiceRef.current = next;
          setValue(next);
        }}
      />
    </form>
  );
}
