"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CaretDown } from "@phosphor-icons/react";

import { AppearanceCheck } from "@/components/chrome/appearance-check";
import { Close44 } from "@/components/chrome/house";
import { OverviewModule } from "@/components/overview/overview-module";
import {
  DASHBOARD_NEWS_SOURCES_PHONE_CLASS,
  DASHBOARD_NEWS_SOURCES_RAIL_CLASS,
} from "@/lib/dashboard-craft";
import {
  HOUSE_PAGE_SELECT_CHEVRON_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS,
  HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS,
  HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS,
  HOUSE_PAGE_SELECT_SHEET_HOST_CLASS,
  HOUSE_PAGE_SELECT_TRIGGER_CLASS,
  HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS,
  housePageSelectOptionClass,
} from "@/lib/house-page-select";
import {
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import {
  NEWS_PAGE,
  NEWS_SOURCE_ALL,
  NEWS_SOURCES,
  newsHistoryHref,
  newsSourceFilterIsAll,
  newsSourceFilterLabel,
  toggleNewsSourceFilter,
  type NewsSourceId,
} from "@/lib/news";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

// Sources lens for /home/news. Desktop: far-right OverviewModule rail.
// Phone: under-nav trigger + house bottom sheet. Same All + source rows.
// Multi-select writes ?source= comma-separated ids. Never a 2-col cram.

export function NewsSourcesRail({
  selected,
  onSelect,
}: {
  selected: readonly NewsSourceId[];
  onSelect: (next: NewsSourceId[]) => void;
}) {
  return (
    <aside data-news-sources-rail="" className={DASHBOARD_NEWS_SOURCES_RAIL_CLASS}>
      <OverviewModule testId="news-sources" title={NEWS_PAGE.sources} empty={NEWS_PAGE.filterEmpty}>
        <NewsSourcesOptions selected={selected} onSelect={onSelect} />
      </OverviewModule>
    </aside>
  );
}

export function NewsSourcesPhone({
  selected,
  onSelect,
  defaultOpen = false,
}: {
  selected: readonly NewsSourceId[];
  onSelect: (next: NewsSourceId[]) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div data-news-sources-phone="" className={DASHBOARD_NEWS_SOURCES_PHONE_CLASS}>
      <button
        type="button"
        data-news-sources-trigger=""
        aria-label={NEWS_PAGE.sources}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((next) => !next)}
        className={HOUSE_PAGE_SELECT_TRIGGER_CLASS}
      >
        <span data-news-sources-current="" className={HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS}>
          {newsSourceFilterLabel(selected)}
        </span>
        <CaretDown
          className={HOUSE_PAGE_SELECT_CHEVRON_CLASS}
          weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        />
      </button>
      {open ? (
        <NewsSourcesSheet onClose={() => setOpen(false)}>
          <NewsSourcesOptions selected={selected} onSelect={onSelect} />
        </NewsSourcesSheet>
      ) : null}
    </div>
  );
}

export function NewsSourcesOptions({
  selected,
  onSelect,
}: {
  selected: readonly NewsSourceId[];
  onSelect: (next: NewsSourceId[]) => void;
}) {
  const all = newsSourceFilterIsAll(selected);
  return (
    <div
      role="group"
      aria-label={NEWS_PAGE.sources}
      data-news-sources-options=""
      className="flex flex-col pb-[var(--space-4)]"
    >
      <NewsSourceOption
        sourceId={NEWS_SOURCE_ALL}
        href={newsHistoryHref([])}
        selected={all}
        label={NEWS_PAGE.sourcesAll}
        onPick={() => onSelect([])}
      />
      {NEWS_SOURCES.map((source) => (
        <NewsSourceOption
          key={source.id}
          sourceId={source.id}
          href={newsHistoryHref(toggleNewsSourceFilter(selected, source.id))}
          selected={!all && selected.includes(source.id)}
          label={source.label}
          onPick={() => onSelect(toggleNewsSourceFilter(selected, source.id))}
        />
      ))}
    </div>
  );
}

function NewsSourceOption({
  sourceId,
  href,
  selected,
  label,
  onPick,
}: {
  sourceId: string;
  href: string;
  selected: boolean;
  label: string;
  onPick: () => void;
}) {
  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    event.preventDefault();
    onPick();
  }

  return (
    <Link
      href={href}
      scroll={false}
      data-news-source-option={sourceId}
      aria-pressed={selected}
      className={housePageSelectOptionClass(selected)}
      onClick={onClick}
    >
      <span className={HOUSE_PAGE_SELECT_OPTION_LABEL_CLASS}>{label}</span>
      <span className={HOUSE_PAGE_SELECT_OPTION_CHECK_GUTTER_CLASS} aria-hidden="true">
        <AppearanceCheck selected={selected} className={HOUSE_PAGE_SELECT_OPTION_CHECK_CLASS} />
      </span>
    </Link>
  );
}

function NewsSourcesSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  const sheet = (
    <div
      data-news-sources-sheet=""
      role="dialog"
      aria-label={NEWS_PAGE.sources}
      className={HOUSE_PAGE_SELECT_SHEET_HOST_CLASS}
    >
      <button
        type="button"
        aria-label={NEWS_PAGE.sourcesClose}
        className={APP_SHEET_SCRIM_CLASS}
        onClick={onClose}
      />
      <div className={`${APP_SHEET_SURFACE_CLASS} relative z-10 shadow-none`}>
        <div className={`${APP_SHEET_HEAD_CLASS} justify-between`}>
          <p className="t-label text-ink-3">{NEWS_PAGE.sources}</p>
          <Close44 label={NEWS_PAGE.sourcesClose} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
