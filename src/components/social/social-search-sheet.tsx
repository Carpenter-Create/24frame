"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { CaretLeft, MagnifyingGlass, X } from "@phosphor-icons/react";

import { HOUSE_HEADER_TRAILING_HIT_CLASS } from "@/lib/house-lead-chrome";
import {
  HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
  HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
} from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_SEARCH_RECENT_CLEAR_CLASS,
  SOCIAL_SEARCH_RECENT_FACE_CLASS,
  SOCIAL_SEARCH_RECENT_HEAD_CLASS,
  SOCIAL_SEARCH_RECENT_LIST_CLASS,
  SOCIAL_SEARCH_RECENT_ROW_CLASS,
  SOCIAL_SEARCH_SHEET_BACK_CLASS,
  SOCIAL_SEARCH_SHEET_CHROME_CLASS,
  SOCIAL_SEARCH_SHEET_FIELD_CLASS,
  SOCIAL_SEARCH_SHEET_HOST_CLASS,
  type SocialSearchRecentItem,
} from "@/lib/social-search";
import { HOUSE_EMPTY_CLASS } from "@/lib/house-sheet";
import { cn } from "@/lib/cn";

export function SocialSearchSheet({
  field,
  defaultOpen = false,
  recents = [],
  onClearRecent,
}: {
  field: React.ReactNode;
  defaultOpen?: boolean;
  recents?: SocialSearchRecentItem[];
  onClearRecent?: (id: string) => void;
}) {
  const titleId = useId();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const input = document.querySelector<HTMLInputElement>(
      "[data-social-search-sheet-field] input",
    );
    input?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={SOCIAL.explore.searchSocial}
        data-house-lead-search-icon=""
        data-social-header-search-icon=""
        className={cn(
          HOUSE_HEADER_TRAILING_HIT_CLASS,
          HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
          "md:hidden",
        )}
        onClick={() => setOpen(true)}
      >
        <MagnifyingGlass
          className={HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS}
          weight={HOUSE_PHONE_CHROME_ICON_WEIGHT}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-social-search-sheet=""
          className={SOCIAL_SEARCH_SHEET_HOST_CLASS}
        >
          <div data-social-search-sheet-chrome="" className={SOCIAL_SEARCH_SHEET_CHROME_CLASS}>
            <button
              type="button"
              aria-label={SOCIAL.explore.searchBack}
              data-social-search-sheet-back=""
              className={SOCIAL_SEARCH_SHEET_BACK_CLASS}
              onClick={() => setOpen(false)}
            >
              <CaretLeft
                className="size-5"
                weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
                aria-hidden
              />
            </button>
            <div data-social-search-sheet-field="" className={SOCIAL_SEARCH_SHEET_FIELD_CLASS}>
              {field}
            </div>
          </div>
          <div data-social-search-recent="" className="min-h-0 flex-1 overflow-y-auto">
            <div className={SOCIAL_SEARCH_RECENT_HEAD_CLASS}>
              <h2 id={titleId} className="t-body font-medium text-ink">
                {SOCIAL.explore.recent}
              </h2>
            </div>
            {recents.length === 0 ? (
              <p data-social-search-recent-empty="" className={`px-[var(--space-6)] ${HOUSE_EMPTY_CLASS}`}>
                {SOCIAL.explore.recentEmpty}
              </p>
            ) : (
              <ul data-social-search-recent-list="" className={SOCIAL_SEARCH_RECENT_LIST_CLASS}>
                {recents.map((row) => (
                  <li key={row.id} className={SOCIAL_SEARCH_RECENT_ROW_CLASS}>
                    <Link
                      href={row.href}
                      data-social-search-recent-row=""
                      className="flex min-w-0 flex-1 items-center gap-[var(--space-3)]"
                    >
                      <span className={SOCIAL_SEARCH_RECENT_FACE_CLASS} aria-hidden>
                        {row.initial ?? row.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate t-body font-medium text-ink">{row.name}</span>
                        {row.meta ? (
                          <span className="block truncate t-body-sm text-ink-3">{row.meta}</span>
                        ) : null}
                      </span>
                    </Link>
                    {onClearRecent ? (
                      <button
                        type="button"
                        aria-label={SOCIAL.explore.clearRecent}
                        data-social-search-recent-clear=""
                        className={SOCIAL_SEARCH_RECENT_CLEAR_CLASS}
                        onClick={() => onClearRecent(row.id)}
                      >
                        <X className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} aria-hidden />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
