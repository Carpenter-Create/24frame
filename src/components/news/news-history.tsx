"use client";

import { useState } from "react";

import { NewsRail } from "@/components/news/news-rail";
import { NewsSourceChips } from "@/components/news/news-sources-filter";
import { DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS } from "@/lib/dashboard-craft";
import {
  filterNewsBySources,
  newsHistoryEmptyCopy,
  newsHistoryHref,
  type NewsItem,
  type NewsSourceId,
} from "@/lib/news";

// /home/news body: house source chips under the page H1, then a
// full-width list. Filter is client-side over the loaded 90-day
// window; URL ?source= stays the share/refresh contract.

export function NewsHistory({
  items,
  now,
  selected: initialSelected,
}: {
  items: readonly NewsItem[];
  now: Date | string;
  selected: readonly NewsSourceId[];
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
      <NewsSourceChips selected={selected} onSelect={onSelect} />
      <NewsRail
        items={visible}
        now={at}
        history
        empty={newsHistoryEmptyCopy(items, visible)}
      />
    </div>
  );
}
