import { HouseActionArrow } from "@/components/chrome/house-action-arrow";
import { DashboardHomeStatusPill } from "@/components/dashboard/dashboard-home";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_NEWS_HISTORY_COPY_CLASS,
  DASHBOARD_NEWS_HISTORY_ROW_CLASS,
  DASHBOARD_NEWS_HISTORY_THUMB_CLASS,
  DASHBOARD_NEWS_THUMB_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
} from "@/lib/dashboard-craft";
import { cn } from "@/lib/cn";
import { newsSourceLabel, type NewsItem } from "@/lib/news";
import { socialRelativeTime } from "@/lib/social";

// Link-out card: media plate · headline · source · relative time.
// Home: stacked image-top tile inside OverviewModule (Education cover SoT).
// History: same Home stack on phone (full-bleed 16:9, flex-col);
// md+ is the dense image-led row. Image leads; type is secondary.
// Grey plate only when the article has no image. No summary. No rewrite.

export function NewsCard({
  item,
  now,
  density = "history",
}: {
  item: NewsItem;
  now: Date;
  density?: "home" | "history";
}) {
  const home = density === "home";
  const history = density === "history";
  return (
    <li
      data-news-card={item.id}
      data-news-card-density={density}
      className={home ? undefined : DASHBOARD_MODULE_CARD_CLASS}
    >
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        data-news-link={item.id}
        className={history ? DASHBOARD_NEWS_HISTORY_ROW_CLASS : "flex flex-col"}
      >
        <div
          data-news-thumb=""
          className={cn(
            history ? DASHBOARD_NEWS_HISTORY_THUMB_CLASS : DASHBOARD_NEWS_THUMB_CLASS,
            home && "rounded-[var(--radius)] border border-hairline",
          )}
        >
          {item.image_url ? (
            // Publisher media URL from the feed enclosure — not next/image remotes.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" />
          ) : null}
        </div>
        <div
          className={
            history
              ? DASHBOARD_NEWS_HISTORY_COPY_CLASS
              : `flex min-w-0 flex-col ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD}`
          }
        >
          <p
            className={cn(
              `flex items-start ${DASHBOARD_RELATED_GAP_CLASS} font-medium text-ink`,
              history ? "t-body" : "t-body-sm",
            )}
          >
            <span className="min-w-0 flex-1">{item.title}</span>
            <HouseActionArrow data-news-outbound="" />
          </p>
          <div className={`flex flex-wrap items-center ${DASHBOARD_RELATED_GAP_CLASS}`}>
            <DashboardHomeStatusPill label={newsSourceLabel(item.source)} />
            <time
              dateTime={item.published_at}
              data-news-time=""
              className="t-body-sm text-ink-3"
            >
              {socialRelativeTime(item.published_at, now.getTime())}
            </time>
          </div>
        </div>
      </a>
    </li>
  );
}
