import { TextAction } from "@/components/chrome/house";
import {
  DashboardHomeEmpty,
  DashboardHomePanel,
} from "@/components/dashboard/dashboard-home";
import { NewsCard } from "@/components/news/news-card";
import {
  DASHBOARD_CARD_PAD_LIST,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_ROW_LIST_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import { NEWS_HREF, NEWS_PAGE, type NewsItem } from "@/lib/news";
import { overviewModuleHeaderAction } from "@/lib/overview";

// Home News rail + /news history. House panel + same card.

export function NewsRail({
  items,
  now,
  viewAll = false,
  testId = "news",
}: {
  items: readonly NewsItem[];
  now: Date;
  viewAll?: boolean;
  testId?: string;
}) {
  const action = viewAll
    ? overviewModuleHeaderAction(NEWS_PAGE.title, NEWS_HREF, NEWS_PAGE.viewAll)
    : null;
  return (
    <DashboardHomePanel aria-label={NEWS_PAGE.title} data-overview-module={testId}>
      <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD_LIST}`}>
        <p className={DASHBOARD_SECTION_TITLE_CLASS}>{NEWS_PAGE.title}</p>
        {action ? <TextAction href={action.href}>{action.label}</TextAction> : null}
      </div>
      {items.length > 0 ? (
        <ul data-news-list="" className={DASHBOARD_ROW_LIST_CLASS}>
          {items.map((item) => (
            <NewsCard key={item.id} item={item} now={now} />
          ))}
        </ul>
      ) : (
        <DashboardHomeEmpty>{NEWS_PAGE.empty}</DashboardHomeEmpty>
      )}
    </DashboardHomePanel>
  );
}
