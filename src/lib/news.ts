import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import { NEWS_INGEST_FUNCTION } from "@/lib/news-aws";

// Industry News — house SoT (Adam lock 2026-09-18).
// Name: News. Home: latest 12 + View all. /news: 30-day history.
// Link-out cards only. Allowlist verified 2026-09-18. Storage is AWS
// DynamoDB — not Supabase. Copy lives here.

export const NEWS_HREF = "/news";
export const NEWS_INGEST_PATH = NEWS_INGEST_FUNCTION;
export const NEWS_HOME_CAP = 12;
export const NEWS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
export const NEWS_READ_REVALIDATE_SECONDS = 60;

export const NEWS_PAGE = {
  title: "News",
  viewAll: DASHBOARD_HOME.viewAll,
  empty: "No headlines from the last 30 days.",
  subtitle: "Headlines from the last 30 days.",
  truncated: `Showing the first ${UNPAGINATED_MAX} headlines. More exist — this list is not complete.`,
} as const;

export const NEWS_SOURCE_IDS = [
  "indiewire",
  "variety",
  "deadline",
  "hollywood-reporter",
  "tvline",
  "no-film-school",
  "filmmaker-magazine",
  "moviemaker",
  "joblo",
  "film-threat",
  "screen-daily",
] as const;

export type NewsSourceId = (typeof NEWS_SOURCE_IDS)[number];

export type NewsSource = {
  id: NewsSourceId;
  label: string;
  feedUrl: string;
  enabled: boolean;
};

// Verified 2026-09-18. Kill switch: enabled: false skips ingest.
// Dynamo source health enabled=false is a second kill without a deploy.
export const NEWS_SOURCES = [
  { id: "indiewire", label: "IndieWire", feedUrl: "https://www.indiewire.com/feed/", enabled: true },
  { id: "variety", label: "Variety", feedUrl: "https://variety.com/feed/", enabled: true },
  { id: "deadline", label: "Deadline", feedUrl: "https://deadline.com/feed/", enabled: true },
  {
    id: "hollywood-reporter",
    label: "Hollywood Reporter",
    feedUrl: "https://www.hollywoodreporter.com/feed/",
    enabled: true,
  },
  { id: "tvline", label: "TVLine", feedUrl: "https://www.tvline.com/feed/", enabled: true },
  {
    id: "no-film-school",
    label: "No Film School",
    feedUrl: "https://nofilmschool.com/rss.xml",
    enabled: true,
  },
  {
    id: "filmmaker-magazine",
    label: "Filmmaker Magazine",
    feedUrl: "https://filmmakermagazine.com/feed/",
    enabled: true,
  },
  { id: "moviemaker", label: "MovieMaker", feedUrl: "https://www.moviemaker.com/feed/", enabled: true },
  { id: "joblo", label: "JoBlo", feedUrl: "https://www.joblo.com/feed/", enabled: true },
  { id: "film-threat", label: "Film Threat", feedUrl: "https://filmthreat.com/feed/", enabled: true },
  {
    id: "screen-daily",
    label: "Screen Daily",
    feedUrl: "https://www.screendaily.com/45202.rss",
    enabled: true,
  },
] satisfies readonly NewsSource[];

const SOURCE_BY_ID = new Map<NewsSourceId, NewsSource>(
  NEWS_SOURCES.map((source) => [source.id, source]),
);

export type NewsItem = {
  id: string;
  title: string;
  url: string;
  source: NewsSourceId;
  published_at: string;
  image_url: string | null;
};

export type NewsListResult = {
  rows: NewsItem[];
  truncated: boolean;
  failed: boolean;
};

export function isNewsSourceId(value: string): value is NewsSourceId {
  return SOURCE_BY_ID.has(value as NewsSourceId);
}

export function newsSourceLabel(source: string): string {
  return SOURCE_BY_ID.get(source as NewsSourceId)?.label ?? source;
}

export function newsWindowStart(now: Date): Date {
  return new Date(now.getTime() - NEWS_WINDOW_MS);
}

export function newsInWindow(iso: string, now: Date): boolean {
  const at = Date.parse(iso);
  return Number.isFinite(at) && at >= newsWindowStart(now).getTime() && at <= now.getTime();
}

export function overviewNewsHeadlines<T>(rows: readonly T[], cap = NEWS_HOME_CAP): T[] {
  return rows.slice(0, cap);
}
