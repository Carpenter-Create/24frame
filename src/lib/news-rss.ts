import {
  NEWS_SOURCES,
  NEWS_WINDOW_MS,
  type NewsSourceId,
  isNewsSourceId,
} from "@/lib/news";
import { classifyNewsTopic, type NewsTopic } from "@/lib/news-topic";

// RSS / Atom normalize for the News allowlist. Media/enclosure thumbs
// first. When the feed has no image, ingest OG-scrapes the article URL.
// Do not scrape RSS item description HTML. Do not rewrite titles.
// JoBlo media: persist www.joblo.com (apex 404s). Article identity still strips www.

const TRACKING_PARAM = /^(utm_|fbclid|gclid|mc_cid|mc_eid|vero_id|icid)/i;
const IMAGE_EXT = /\.(avif|gif|jpe?g|png|webp)(\?|$)/i;
const MAX_TITLE = 300;

export type NormalizedNewsItem = {
  title: string;
  url: string;
  canonical_url: string;
  source: NewsSourceId;
  published_at: string;
  image_url: string | null;
  /**
   * Ingest-only classification. Music / other is dropped by the topic
   * gate before Dynamo write. Reads never see the raw value — the
   * store persists it only when film / tv passes the gate.
   */
  topic: NewsTopic;
};

export function canonicalizeNewsUrl(raw: string, base?: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim(), base);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  parsed.hash = "";
  parsed.protocol = "https:";
  parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const drop: string[] = [];
  parsed.searchParams.forEach((_, key) => {
    if (TRACKING_PARAM.test(key)) drop.push(key);
  });
  for (const key of drop) parsed.searchParams.delete(key);
  parsed.searchParams.sort();
  const path = parsed.pathname.replace(/\/+$/, "") || "/";
  const query = parsed.searchParams.toString();
  return `https://${parsed.hostname}${path}${query ? `?${query}` : ""}`;
}

const JOBLO_APEX_HOST = "joblo.com";
const JOBLO_WWW_HOST = "www.joblo.com";

/** JoBlo apex media 404s. www serves 200 (incl. Referer app.24frame.co). Other hosts unchanged. */
export function canonicalizeNewsImageUrl(url: string | null): string | null {
  if (!url) return null;
  return preferJobloWwwHost(url);
}

/**
 * Card SoT: prefer a mirrored `news-thumbs/` URL. Rewrite JoBlo apex if a
 * legacy publisher URL still slips through. Does not invent a host.
 */
export function newsCardImageUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/news-thumbs" || parsed.pathname.startsWith("/news-thumbs/")) {
      return url;
    }
  } catch {
    return canonicalizeNewsImageUrl(url);
  }
  return canonicalizeNewsImageUrl(url);
}

/** Fetch JoBlo over www. Article identity still strips www via canonicalizeNewsUrl (stable Dynamo keys). */
export function newsOgFetchUrl(articleUrl: string): string {
  return preferJobloWwwHost(articleUrl);
}

const JOBLO_WWW_PATH_PREFIX = `/${JOBLO_WWW_HOST}`;

function preferJobloWwwHost(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return url;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return url;
  const host = parsed.hostname.toLowerCase();
  if (host !== JOBLO_APEX_HOST && host !== JOBLO_WWW_HOST) return url;
  parsed.protocol = "https:";
  parsed.hostname = JOBLO_WWW_HOST;
  parsed.pathname = stripDuplicatedJobloWwwPath(parsed.pathname);
  return parsed.href;
}

/** Feed/path sometimes embeds www.joblo.com under the host → www.joblo.com/www.joblo.com/... 404s. */
function stripDuplicatedJobloWwwPath(pathname: string): string {
  let next = pathname;
  while (true) {
    const lower = next.toLowerCase();
    if (lower === JOBLO_WWW_PATH_PREFIX) return "/";
    if (!lower.startsWith(`${JOBLO_WWW_PATH_PREFIX}/`)) return next || "/";
    next = next.slice(JOBLO_WWW_PATH_PREFIX.length) || "/";
  }
}

/** Proven OG on the www Flood article. CoS backfill only — not inventing thumbs. */
export const KNOWN_JOBLO_OG: Record<string, string> = {
  "https://joblo.com/zach-cregger-the-flood-2001-influence":
    "https://www.joblo.com/wp-content/uploads/2026/09/zach-cregger-the-flood-2001.jpg",
};

export function planJobloImageUrl(row: {
  url: string;
  image_url: string | null;
  fillKnown?: boolean;
}): { next: string | null; action: "rewrite" | "fill-known" | "unchanged" | "still-null" } {
  const rewritten = canonicalizeNewsImageUrl(row.image_url);
  if (rewritten && rewritten !== row.image_url) {
    return { next: rewritten, action: "rewrite" };
  }
  if (row.image_url) return { next: row.image_url, action: "unchanged" };
  if (row.fillKnown) {
    const known = KNOWN_JOBLO_OG[row.url];
    if (known) return { next: known, action: "fill-known" };
  }
  return { next: null, action: "still-null" };
}

export function decodeNewsText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#(?:0*39|x0*27);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => fromCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => fromCode(parseInt(code, 16)))
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function fromCode(code: number): string {
  if (!Number.isFinite(code) || code < 32 || code > 0x10ffff) return "";
  return String.fromCodePoint(code);
}

function tagText(block: string, names: readonly string[]): string | null {
  for (const name of names) {
    const match = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i"));
    if (match) {
      const text = decodeNewsText(match[1] ?? "");
      if (text) return text;
    }
  }
  return null;
}

function attr(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  const value = match?.[1] ?? match?.[2] ?? null;
  return value ? decodeNewsText(value) : null;
}

function firstHref(block: string): string | null {
  const links = block.match(/<link\b[^>]*>/gi) ?? [];
  let fallback: string | null = null;
  for (const tag of links) {
    const rel = (attr(tag, "rel") ?? "alternate").toLowerCase();
    const href = attr(tag, "href");
    if (!href) continue;
    if (rel === "alternate" || rel === "") return href;
    fallback ??= href;
  }
  return tagText(block, ["link"]) ?? fallback;
}

function guidLink(block: string): string | null {
  const match = block.match(/<guid\b([^>]*)>([\s\S]*?)<\/guid>/i);
  if (!match) return null;
  const permalink = /ispermalink\s*=\s*(?:"true"|'true')/i.test(match[1] ?? "");
  const text = decodeNewsText(match[2] ?? "");
  if (permalink && text) return text;
  if (/^https?:\/\//i.test(text)) return text;
  return null;
}

function looksLikeImage(url: string, type: string | null, medium: string | null): boolean {
  if ((medium ?? "").toLowerCase() === "image") return true;
  if ((type ?? "").toLowerCase().startsWith("image/")) return true;
  return IMAGE_EXT.test(url);
}

function firstImageUrl(block: string, base: string): string | null {
  const tags = block.match(
    /<(?:media:thumbnail|media:content|enclosure|itunes:image)\b[^>]*\/?>/gi,
  ) ?? [];
  for (const tag of tags) {
    const url = attr(tag, "url") ?? attr(tag, "href");
    if (!url) continue;
    if (!looksLikeImage(url, attr(tag, "type"), attr(tag, "medium"))) continue;
    const canonical = canonicalizeNewsUrl(url, base);
    if (canonical) return canonicalizeNewsImageUrl(canonical);
  }
  return null;
}

const OG_IMAGE_KEYS = [
  "og:image",
  "og:image:url",
  "og:image:secure_url",
  "twitter:image",
  "twitter:image:src",
] as const;

function isUsableOgImage(canonical: string, pageUrl?: string): boolean {
  if (!canonical.startsWith("https://")) return false;
  if (!pageUrl) return true;
  const page = canonicalizeNewsUrl(pageUrl);
  return page !== canonical;
}

/** Article HTML only — og:image, then twitter:image. Not RSS description. */
export function parseOgImageUrl(html: string, base?: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const found = new Map<string, string>();
  for (const tag of tags) {
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").trim().toLowerCase();
    const content = attr(tag, "content");
    if (!content || !OG_IMAGE_KEYS.includes(key as (typeof OG_IMAGE_KEYS)[number])) continue;
    if (!found.has(key)) found.set(key, content);
  }
  for (const key of OG_IMAGE_KEYS) {
    const raw = found.get(key);
    if (!raw) continue;
    // attr() already decodeNewsText's content; decode again so &#038; / &amp;
    // cannot survive into canonicalize (URL would treat # as a hash).
    const canonical = canonicalizeNewsUrl(decodeNewsText(raw), base);
    if (canonical && isUsableOgImage(canonical, base)) return canonicalizeNewsImageUrl(canonical);
  }
  return null;
}

export function parseNewsDate(raw: string | null): string | null {
  if (!raw) return null;
  const at = Date.parse(decodeNewsText(raw));
  if (!Number.isFinite(at)) return null;
  return new Date(at).toISOString();
}

/** Read every RSS `<category>` / Atom `<category term="..."/>` on the block. */
function itemCategories(block: string): string[] {
  const out: string[] = [];
  const tags = block.match(/<category\b[^>]*(?:\/>|>[\s\S]*?<\/category>)/gi) ?? [];
  for (const tag of tags) {
    const term = attr(tag, "term") ?? attr(tag, "label");
    if (term) {
      out.push(term);
      continue;
    }
    const body = tag.match(/>([\s\S]*?)<\/category>/i)?.[1];
    const text = body ? decodeNewsText(body) : "";
    if (text) out.push(text);
  }
  return out;
}

export function parseNewsFeed(
  xml: string,
  source: NewsSourceId,
  now = new Date(),
  baseUrl?: string,
): NormalizedNewsItem[] {
  if (!isNewsSourceId(source)) return [];
  const allow = NEWS_SOURCES.find((row) => row.id === source);
  if (!allow) return [];
  const base = baseUrl ?? allow.feedUrls[0];
  if (!base) return [];
  const cutoff = now.getTime() - NEWS_WINDOW_MS;
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)];
  const seen = new Set<string>();
  const titles = new Set<string>();
  const items: NormalizedNewsItem[] = [];

  for (const match of blocks) {
    const block = match[2] ?? "";
    const title = (tagText(block, ["title"]) ?? "").slice(0, MAX_TITLE);
    const href = firstHref(block) ?? guidLink(block);
    const published = parseNewsDate(
      tagText(block, ["pubDate", "published", "updated", "dc:date", "date"]),
    );
    if (!title || !href || !published) continue;
    const publishedMs = Date.parse(published);
    if (publishedMs < cutoff || publishedMs > now.getTime() + 60_000) continue;
    const canonical = canonicalizeNewsUrl(href, base);
    if (!canonical) continue;
    if (seen.has(canonical)) continue;
    const titleKey = `${source}:${title.toLowerCase()}`;
    if (titles.has(titleKey)) continue;
    seen.add(canonical);
    titles.add(titleKey);
    const categories = itemCategories(block);
    const topic = classifyNewsTopic({ title, url: canonical, categories, source });
    items.push({
      title,
      url: canonical,
      canonical_url: canonical,
      source,
      published_at: published,
      image_url: firstImageUrl(block, base),
      topic,
    });
  }

  return items;
}
