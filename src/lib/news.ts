import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { UNPAGINATED_MAX } from "@/lib/list-bounds";
import { NEWS_INGEST_FUNCTION, NEWS_INGEST_SCHEDULE } from "@/lib/news-aws";

// Industry News — house SoT (Adam lock 2026-09-18).
// Name: News. Home: latest 15 + View all. /home/news: 90-day history.
// /news permanently redirects here. Home-owned only — not a workspace
// pill, dest rail, or bottom-bar. Link-out cards only.
// Allowlist verified 2026-09-18. Storage is AWS DynamoDB. Ingest is
// Lambda + EventBridge. Not Supabase. Not Vercel cron. Copy lives here.
// History filter URL: ?source=<id>,<id> (comma-separated allowlist ids,
// NEWS_SOURCE_IDS order). Repeated ?source=a&source=b is accepted.
// Absent / empty / all / only-invalid = All sources. Canonical write
// is one comma-separated `source` param so refresh/share keep the lens.

export const NEWS_HOME_HREF = "/home";
export const NEWS_HREF = "/home/news";
export const NEWS_LEGACY_HREF = "/news";
export const NEWS_INGEST_PATH = NEWS_INGEST_FUNCTION;
export { NEWS_INGEST_SCHEDULE };
export const NEWS_HOME_CAP = 15;
export const NEWS_WINDOW_DAYS = 90;
export const NEWS_WINDOW_MS = NEWS_WINDOW_DAYS * 24 * 60 * 60 * 1000;
export const NEWS_READ_REVALIDATE_SECONDS = 60;
export const NEWS_SOURCE_PARAM = "source";
export const NEWS_SOURCE_ALL = "all";

export const NEWS_PAGE = {
  title: "News",
  viewAll: DASHBOARD_HOME.viewAll,
  empty: "No headlines from the last 90 days.",
  subtitle: "Headlines from the last 90 days.",
  back: "Home",
  backHref: NEWS_HOME_HREF,
  sources: "Sources",
  sourcesAll: "All",
  sourcesClose: "Close",
  filterEmpty: "No headlines from the selected sources.",
  truncated: `Showing the first ${UNPAGINATED_MAX} headlines. More exist — this list is not complete.`,
} as const;

/** Home land crumb — News is a Home child, not a fifth workspace.
 *  House Text action (Sporty Blue) — same primitive as Home View all. */
export function newsHistoryBackLink(): {
  href: typeof NEWS_HOME_HREF;
  label: typeof NEWS_PAGE.back;
  className: typeof TEXT_ACTION_CLASS;
} {
  return {
    href: NEWS_PAGE.backHref,
    label: NEWS_PAGE.back,
    className: TEXT_ACTION_CLASS,
  };
}

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
// Dynamo SOURCE#<id> HEALTH enabled=false is a second kill without a deploy.
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

export function newsItemTtlEpoch(publishedAt: string): number {
  return Math.floor((Date.parse(publishedAt) + NEWS_WINDOW_MS) / 1000);
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

function splitNewsSourceParam(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function rawNewsSourceParts(raw: string | string[] | null | undefined): string[] {
  if (raw == null) return [];
  return (Array.isArray(raw) ? raw : [raw]).flatMap(splitNewsSourceParam);
}

/** Canonical selected sources. Empty means All. */
export function canonicalizeNewsSourceFilter(
  selected: readonly string[],
): NewsSourceId[] {
  const unique = NEWS_SOURCE_IDS.filter((id) => selected.includes(id));
  if (unique.length === NEWS_SOURCE_IDS.length) return [];
  return [...unique];
}

export function parseNewsSourceFilter(
  raw: string | string[] | null | undefined,
): NewsSourceId[] {
  const parts = rawNewsSourceParts(raw);
  if (parts.length === 0) return [];
  const ids = canonicalizeNewsSourceFilter(parts);
  if (parts.includes(NEWS_SOURCE_ALL) && ids.length === 0) return [];
  return ids;
}

export function newsSourceFilterIsAll(selected: readonly string[]): boolean {
  return canonicalizeNewsSourceFilter(selected).length === 0;
}

export function newsHistoryHref(selected: readonly string[] = []): string {
  const canonical = canonicalizeNewsSourceFilter(selected);
  if (canonical.length === 0) return NEWS_HREF;
  return `${NEWS_HREF}?${NEWS_SOURCE_PARAM}=${canonical.join(",")}`;
}

export function toggleNewsSourceFilter(
  selected: readonly NewsSourceId[],
  id: NewsSourceId,
): NewsSourceId[] {
  if (newsSourceFilterIsAll(selected)) return [id];
  const current = canonicalizeNewsSourceFilter(selected);
  const next = current.includes(id)
    ? current.filter((source) => source !== id)
    : [...current, id];
  return canonicalizeNewsSourceFilter(next);
}

export function filterNewsBySources<T extends Pick<NewsItem, "source">>(
  rows: readonly T[],
  selected: readonly NewsSourceId[],
): T[] {
  if (newsSourceFilterIsAll(selected)) return [...rows];
  const allowed = new Set(canonicalizeNewsSourceFilter(selected));
  return rows.filter((row) => allowed.has(row.source));
}

export function newsSourceFilterLabel(selected: readonly NewsSourceId[]): string {
  const canonical = canonicalizeNewsSourceFilter(selected);
  if (canonical.length === 0) return NEWS_PAGE.sourcesAll;
  if (canonical.length === 1) {
    const id = canonical[0];
    return id ? newsSourceLabel(id) : NEWS_PAGE.sourcesAll;
  }
  return canonical.map((id) => newsSourceLabel(id)).join(", ");
}

export function newsHistoryEmptyCopy(
  rows: readonly NewsItem[],
  visible: readonly NewsItem[],
): string {
  if (rows.length === 0) return NEWS_PAGE.empty;
  if (visible.length === 0) return NEWS_PAGE.filterEmpty;
  return NEWS_PAGE.empty;
}
