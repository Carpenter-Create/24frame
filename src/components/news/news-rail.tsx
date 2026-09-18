import { TextAction } from "@/components/chrome/house";
import { NewsCard } from "@/components/news/news-card";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_NEWS_HISTORY_LIST_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import { NEWS_HREF, NEWS_PAGE, type NewsItem } from "@/lib/news";
import { overviewModuleHeaderAction } from "@/lib/overview";

// Home News rail + /home/news history. Light section header on Home;
// history is labeled by the page H1 only. Each article is its own
// stacked house card. Home stays one column. History uses the house
// pair grid on desktop.

export function NewsRail({
  items,
  now,
  viewAll = false,
  history = false,
  testId = "news",
}: {
  items: readonly NewsItem[];
  now: Date;
  viewAll?: boolean;
  history?: boolean;
  testId?: string;
}) {
  const action = viewAll
    ? overviewModuleHeaderAction(NEWS_PAGE.title, NEWS_HREF, NEWS_PAGE.viewAll)
    : null;
  const listClass = history
    ? DASHBOARD_NEWS_HISTORY_LIST_CLASS
    : `flex flex-col ${DASHBOARD_SECTION_AIR_CLASS}`;
  return (
    <section
      aria-label={history ? undefined : NEWS_PAGE.title}
      data-overview-module={testId}
      className={`flex flex-col ${DASHBOARD_SECTION_AIR_CLASS}`}
    >
      {history ? null : (
        <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS}`}>
          <p className={DASHBOARD_SECTION_TITLE_CLASS}>{NEWS_PAGE.title}</p>
          {action ? <TextAction href={action.href}>{action.label}</TextAction> : null}
        </div>
      )}
      {items.length > 0 ? (
        <ul data-news-list="" className={listClass}>
          {items.map((item) => (
            <NewsCard key={item.id} item={item} now={now} />
          ))}
        </ul>
      ) : (
        <div className={`${DASHBOARD_MODULE_CARD_CLASS} ${DASHBOARD_CARD_PAD}`}>
          <p className="t-body-sm text-ink-3">{NEWS_PAGE.empty}</p>
        </div>
      )}
    </section>
  );
}
