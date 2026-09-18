import { TextAction } from "@/components/chrome/house";
import { NewsCard } from "@/components/news/news-card";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
  DASHBOARD_SECTION_TITLE_CLASS,
} from "@/lib/dashboard-craft";
import { NEWS_HREF, NEWS_PAGE, type NewsItem } from "@/lib/news";
import { overviewModuleHeaderAction } from "@/lib/overview";

// Home News rail + /news history. Light section header; each article
// is its own house card. No outer panel slab.

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
    <section
      aria-label={NEWS_PAGE.title}
      data-overview-module={testId}
      className={`flex flex-col ${DASHBOARD_SECTION_AIR_CLASS}`}
    >
      <div className={`flex items-center justify-between ${DASHBOARD_RELATED_GAP_CLASS}`}>
        <p className={DASHBOARD_SECTION_TITLE_CLASS}>{NEWS_PAGE.title}</p>
        {action ? <TextAction href={action.href}>{action.label}</TextAction> : null}
      </div>
      {items.length > 0 ? (
        <ul data-news-list="" className={`flex flex-col ${DASHBOARD_SECTION_AIR_CLASS}`}>
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
