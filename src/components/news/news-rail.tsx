import { OverviewModule } from "@/components/overview/overview-module";
import { NewsCard } from "@/components/news/news-card";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_NEWS_HISTORY_LIST_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
} from "@/lib/dashboard-craft";
import { NEWS_HREF, NEWS_PAGE, type NewsItem } from "@/lib/news";
import { OVERVIEW_MODULE_NEST_CLASS } from "@/lib/overview";

// Home News: same OverviewModule shell as Social/Education — header
// (News + View all) lives inside the grey panel. Articles nest like
// Education course tiles (no second grey card). History is dense
// horizontal rows; source chips live in NewsHistory under the H1.

export function NewsRail({
  items,
  now,
  viewAll = false,
  history = false,
  empty = NEWS_PAGE.empty,
  testId = "news",
}: {
  items: readonly NewsItem[];
  now: Date;
  viewAll?: boolean;
  history?: boolean;
  empty?: string;
  testId?: string;
}) {
  if (history) {
    return (
      <section
        data-overview-module={testId}
        data-news-history-main=""
        className={`flex flex-col ${DASHBOARD_SECTION_AIR_CLASS}`}
      >
        {items.length > 0 ? (
          <ul data-news-list="" className={DASHBOARD_NEWS_HISTORY_LIST_CLASS}>
            {items.map((item) => (
              <NewsCard key={item.id} item={item} now={now} density="history" />
            ))}
          </ul>
        ) : (
          <div className={`${DASHBOARD_MODULE_CARD_CLASS} ${DASHBOARD_CARD_PAD}`}>
            <p className="t-body-sm text-ink-3">{empty}</p>
          </div>
        )}
      </section>
    );
  }

  return (
    <OverviewModule
      testId={testId}
      title={NEWS_PAGE.title}
      href={viewAll ? NEWS_HREF : undefined}
      cta={viewAll ? NEWS_PAGE.viewAll : undefined}
      empty={NEWS_PAGE.empty}
    >
      {items.length > 0 ? (
        <ul data-news-list="" className={`flex flex-col ${OVERVIEW_MODULE_NEST_CLASS}`}>
          {items.map((item) => (
            <NewsCard key={item.id} item={item} now={now} density="home" />
          ))}
        </ul>
      ) : null}
    </OverviewModule>
  );
}
