"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { cn } from "@/lib/cn";
import {
  DASHBOARD_NEWS_SOURCE_CHIP_CLASS,
  DASHBOARD_NEWS_SOURCE_CHIP_OFF_CLASS,
  DASHBOARD_NEWS_SOURCE_CHIP_ON_CLASS,
  DASHBOARD_NEWS_SOURCE_CHIPS_CLASS,
} from "@/lib/dashboard-craft";
import {
  NEWS_PAGE,
  NEWS_SOURCE_ALL,
  NEWS_SOURCES,
  newsHistoryHref,
  newsSourceFilterIsAll,
  toggleNewsSourceFilter,
  type NewsSourceId,
} from "@/lib/news";

// Sources lens for /home/news. House pills under the H1 —
// All + one chip per allowlisted source. Selected is accent fill
// (HOUSE_PILL_SELECTED_CLASS); idle is muted track. Multi-select
// writes ?source= comma-separated ids. Phone scrolls the row; never
// a checkbox rail or a second bottom float.

export function NewsSourceChips({
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
      data-news-source-chips=""
      className={DASHBOARD_NEWS_SOURCE_CHIPS_CLASS}
    >
      <NewsSourceChip
        sourceId={NEWS_SOURCE_ALL}
        href={newsHistoryHref([])}
        selected={all}
        label={NEWS_PAGE.sourcesAll}
        onPick={() => onSelect([])}
      />
      {NEWS_SOURCES.map((source) => (
        <NewsSourceChip
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

function NewsSourceChip({
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
      className={cn(
        DASHBOARD_NEWS_SOURCE_CHIP_CLASS,
        selected ? DASHBOARD_NEWS_SOURCE_CHIP_ON_CLASS : DASHBOARD_NEWS_SOURCE_CHIP_OFF_CLASS,
      )}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}
