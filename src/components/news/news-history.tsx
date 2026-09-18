"use client";

import { useState } from "react";

import { NewsRail } from "@/components/news/news-rail";
import { NewsSourcesPhone, NewsSourcesRail } from "@/components/news/news-sources-filter";
import { DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS } from "@/lib/dashboard-craft";
import {
  filterNewsBySources,
  newsHistoryEmptyCopy,
  newsHistoryHref,
  type NewsItem,
  type NewsSourceId,
} from "@/lib/news";

// /home/news body: dense list column + Sources rail (desktop) or
// under-nav sheet (phone). Filter is client-side over the loaded
// 90-day window; URL ?source= stays the share/refresh contract.

export function NewsHistory({
  items,
  now,
  selected: initialSelected,
  defaultSheetOpen = false,
}: {
  items: readonly NewsItem[];
  now: Date | string;
  selected: readonly NewsSourceId[];
  defaultSheetOpen?: boolean;
}) {
  const [selected, setSelected] = useState<NewsSourceId[]>([...initialSelected]);
  const at = now instanceof Date ? now : new Date(now);
  const visible = filterNewsBySources(items, selected);

  function onSelect(next: NewsSourceId[]) {
    setSelected(next);
    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", newsHistoryHref(next));
    }
  }

  return (
    <div data-news-history-layout="" className={DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS}>
      <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
        <NewsSourcesPhone
          selected={selected}
          onSelect={onSelect}
          defaultOpen={defaultSheetOpen}
        />
        <NewsRail
          items={visible}
          now={at}
          history
          empty={newsHistoryEmptyCopy(items, visible)}
        />
      </div>
      <NewsSourcesRail selected={selected} onSelect={onSelect} />
    </div>
  );
}
