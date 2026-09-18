import { DashboardHomeStatusPill } from "@/components/dashboard/dashboard-home";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_MODULE_CARD_CLASS,
  DASHBOARD_NEWS_THUMB_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
} from "@/lib/dashboard-craft";
import { cn } from "@/lib/cn";
import { newsSourceLabel, type NewsItem } from "@/lib/news";
import { socialRelativeTime } from "@/lib/social";

// Link-out card: media plate · headline · source · relative time.
// History: discrete house module card. Home: nested tile inside the
// shared OverviewModule shell (Education cover SoT — no second grey card).
// No side thumb. No summary. No rewrite.

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
        className="flex flex-col"
      >
        <div
          data-news-thumb=""
          className={cn(
            DASHBOARD_NEWS_THUMB_CLASS,
            home && "rounded-[var(--radius)] border border-hairline",
          )}
        >
          {item.image_url ? (
            // Publisher media URL from the feed enclosure — not next/image remotes.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" />
          ) : null}
        </div>
        <div className={`flex min-w-0 flex-col ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD}`}>
          <p className="t-body-sm font-medium text-ink">{item.title}</p>
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
