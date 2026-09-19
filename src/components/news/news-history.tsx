"use client";

import { useState, type ReactNode } from "react";

import { NewsRail } from "@/components/news/news-rail";
import { NewsSourceChips } from "@/components/news/news-sources-filter";
import { NewsStickyHeader } from "@/components/news/news-sticky-header";
import {
  DASHBOARD_NEWS_HISTORY_LAYOUT_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
} from "@/lib/dashboard-craft";
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
//
// Title + subtitle + chips pin as one NewsStickyHeader block while
// the feed scrolls. Do not leave a second non-sticky PageHeader on
// the page — heading is passed in so back / H1 / chips share the pin.

export function NewsHistory({
  items,
  now,
  selected: initialSelected,
  heading,
  notice,
}: {
  items: readonly NewsItem[];
  now: Date | string;
  selected: readonly NewsSourceId[];
  heading?: ReactNode;
  notice?: ReactNode;
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
      <NewsStickyHeader
        surface="page"
        className={`flex flex-col ${DASHBOARD_SECTION_AIR_CLASS}`}
      >
        {heading}
        <NewsSourceChips selected={selected} onSelect={onSelect} />
      </NewsStickyHeader>
      {notice}
      <NewsRail
        items={visible}
        now={at}
        history
        empty={newsHistoryEmptyCopy(items, visible)}
      />
    </div>
  );
}
