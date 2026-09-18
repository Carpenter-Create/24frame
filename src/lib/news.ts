import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";

// Industry News — house SoT (Adam lock 2026-09-18).
// Name: News. Home: latest 12 + View all. /news: 30-day history.
// Link-out cards only. Allowlist verified 2026-09-18.
// Persistence is Supabase news_items. Ingest is the united Vercel
// cron (CRON_SECRET), same array as transcode-poll / title-s3-purge.
// Copy lives here.

export const NEWS_HREF = "/news";
export const NEWS_INGEST_PATH = "/api/cron/news-ingest";
export const NEWS_CRON_SCHEDULE = "*/30 * * * *";
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

// Verified 2026-09-18. Kill switch: enabled: false skips ingest (deploy).
// news_source_health.enabled = false is a second kill without a deploy.
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

export type NewsSourceHealth = {
  source: NewsSourceId;
  enabled: boolean;
  last_success_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
};

export function isNewsSourceId(value: string): value is NewsSourceId {
  return SOURCE_BY_ID.has(value as NewsSourceId);
}

export function newsSourceLabel(source: string): string {
  return SOURCE_BY_ID.get(source as NewsSourceId)?.label ?? source;
}

export function newsSourceConstEnabled(source: NewsSourceId): boolean {
  return NEWS_SOURCES.find((row) => row.id === source)?.enabled === true;
}

export function newsSourceIsLive(
  source: NewsSourceId,
  health: NewsSourceHealth | null,
): boolean {
  if (!newsSourceConstEnabled(source)) return false;
  return health?.enabled !== false;
}

export function newsWindowStart(now: Date): Date {
  return new Date(now.getTime() - NEWS_WINDOW_MS);
}

export function newsInWindow(iso: string, now: Date): boolean {
  const at = Date.parse(iso);
  return Number.isFinite(at) && at >= newsWindowStart(now).getTime() && at <= now.getTime();
}

export function newsTitleDedupeKey(source: string, title: string): string {
  return `${source}:${title.trim().toLowerCase()}`;
}

export function dedupeNewsHeadlines<T extends Pick<NewsItem, "url" | "source" | "title">>(
  rows: readonly T[],
): T[] {
  const urls = new Set<string>();
  const titles = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (urls.has(row.url)) continue;
    const titleKey = newsTitleDedupeKey(row.source, row.title);
    if (titles.has(titleKey)) continue;
    urls.add(row.url);
    titles.add(titleKey);
    out.push(row);
  }
  return out;
}

export function overviewNewsHeadlines<T>(rows: readonly T[], cap = NEWS_HOME_CAP): T[] {
  return rows.slice(0, cap);
}
