import { DashboardHomeStatusPill } from "@/components/dashboard/dashboard-home";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_LICENSING_THUMB_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
} from "@/lib/dashboard-craft";
import { newsSourceLabel, type NewsItem } from "@/lib/news";
import { socialRelativeTime } from "@/lib/social";

// Link-out card: title · thumbnail · source badge · relative time.
// House card pad + related gap. Same card on Home and /news.
// No summary. No rewrite.

export function NewsCard({ item, now }: { item: NewsItem; now: Date }) {
  return (
    <li data-news-card={item.id}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        data-news-link={item.id}
        className={`flex items-start ${DASHBOARD_RELATED_GAP_CLASS} ${DASHBOARD_CARD_PAD}`}
      >
        <div data-news-thumb="" className={DASHBOARD_LICENSING_THUMB_CLASS}>
          {item.image_url ? (
            // Publisher media URL from the feed enclosure — not next/image remotes.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image_url} alt="" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="t-body-sm font-medium text-ink">{item.title}</p>
          <div className="mt-[var(--space-2)] flex flex-wrap items-center gap-[var(--space-2)]">
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
