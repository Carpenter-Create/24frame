import { socialImdbNameId } from "@/lib/social-imdb";
import { SOCIAL } from "@/lib/social";

// External profile links. Persist the ordered list on profiles.website_url
// (identity-spine text): one URL stays a URL; two or more is a JSON array.
// Public chrome is muted host-derived text (Adam lock A 2026-09-20):
// `website`, `instagram.com/handle`, or a clean host. Max 2 on the face;
// overflow is a quiet +N that opens a Links sheet. Omit when empty.
// IMDb Phase 1 claim merges into this list so the name page is not shown twice.

export const SOCIAL_PROFILE_LINKS_MAX = 8;
export const SOCIAL_PROFILE_LINKS_FACE_MAX = 2;

export const SOCIAL_LINK_PLATFORMS = [
  "instagram",
  "youtube",
  "facebook",
  "x",
  "linkedin",
  "tiktok",
  "vimeo",
  "imdb",
  "threads",
  "website",
] as const;

export type SocialLinkPlatform = (typeof SOCIAL_LINK_PLATFORMS)[number];

export type SocialProfileLink = {
  url: string;
  platform: SocialLinkPlatform;
  label: string;
};

const PLATFORM_HOSTS: Record<Exclude<SocialLinkPlatform, "website">, readonly string[]> = {
  instagram: ["instagram.com", "instagr.am"],
  youtube: ["youtube.com", "youtu.be", "m.youtube.com"],
  facebook: ["facebook.com", "fb.com", "fb.me", "m.facebook.com"],
  x: ["x.com", "twitter.com"],
  linkedin: ["linkedin.com"],
  tiktok: ["tiktok.com"],
  vimeo: ["vimeo.com"],
  imdb: ["imdb.com"],
  threads: ["threads.net", "threads.com"],
};

export const SOCIAL_LINK_PLATFORM_LABEL: Record<SocialLinkPlatform, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  vimeo: "Vimeo",
  imdb: SOCIAL.profile.imdb,
  threads: "Threads",
  website: "Website",
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function parseSocialExternalUrl(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!parsed.hostname.includes(".")) return null;
  return parsed.href;
}

export function socialLinkPlatform(url: string): SocialLinkPlatform {
  const host = hostnameOf(url);
  for (const platform of SOCIAL_LINK_PLATFORMS) {
    if (platform === "website") continue;
    if (PLATFORM_HOSTS[platform].some((known) => host === known || host.endsWith(`.${known}`))) {
      return platform;
    }
  }
  return "website";
}

export function parseSocialWebsiteUrlField(raw: string | null | undefined): string[] {
  const text = (raw ?? "").trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (!Array.isArray(parsed)) return [];
      return uniqueUrls(parsed.map((item) => parseSocialExternalUrl(String(item ?? ""))));
    } catch {
      return [];
    }
  }
  const single = parseSocialExternalUrl(text);
  return single ? [single] : [];
}

export function composeSocialWebsiteUrlField(urls: readonly string[]): string | null {
  const unique = uniqueUrls(urls.map((url) => parseSocialExternalUrl(url)));
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0] ?? null;
  return JSON.stringify(unique);
}

export function parseSocialProfileLinksWrite(raw: unknown): {
  urls: string[];
  error: string | null;
} {
  const values = linkWriteValues(raw);
  if (values === null) return { urls: [], error: "invalid" };
  const urls: string[] = [];
  for (const item of values) {
    const text = String(item ?? "").trim();
    if (!text) continue;
    const url = parseSocialExternalUrl(text);
    if (!url) return { urls: [], error: "invalid" };
    if (!urls.includes(url)) urls.push(url);
    if (urls.length > SOCIAL_PROFILE_LINKS_MAX) return { urls: [], error: "limit" };
  }
  return { urls, error: null };
}

export function socialProfilePublicLinks(input: {
  urls?: readonly string[] | null;
  websiteUrl?: string | null;
  imdbUrl?: string | null;
}): SocialProfileLink[] {
  const urls = [
    ...(input.urls ?? parseSocialWebsiteUrlField(input.websiteUrl)),
  ];
  const out: SocialProfileLink[] = [];
  const seen = new Set<string>();
  for (const raw of [...urls, input.imdbUrl ?? ""]) {
    const url = parseSocialExternalUrl(raw ?? "");
    if (!url) continue;
    const platform = socialLinkPlatform(url);
    const key = linkDedupeKey(url, platform);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url, platform, label: socialProfileLinkFaceLabel(url, platform) });
  }
  return out;
}

export function socialProfileLinkFaceLabel(
  url: string,
  platform: SocialLinkPlatform = socialLinkPlatform(url),
): string {
  if (platform === "website") return "website";
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/+$/, "").replace(/^\//, "");
    return path ? `${host}/${path}` : host;
  } catch {
    return "website";
  }
}

export function socialProfileLinksFace(links: readonly SocialProfileLink[]): {
  face: SocialProfileLink[];
  overflow: number;
} {
  if (links.length <= SOCIAL_PROFILE_LINKS_FACE_MAX) {
    return { face: [...links], overflow: 0 };
  }
  return {
    face: links.slice(0, SOCIAL_PROFILE_LINKS_FACE_MAX),
    overflow: links.length - SOCIAL_PROFILE_LINKS_FACE_MAX,
  };
}

export function socialProfileLinksMoreLabel(overflow: number): string {
  return `+${overflow}`;
}

function uniqueUrls(urls: readonly (string | null)[]): string[] {
  const out: string[] = [];
  for (const url of urls) {
    if (!url || out.includes(url)) continue;
    out.push(url);
  }
  return out;
}

function linkWriteValues(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return text.split(/\n+/);
}

function linkDedupeKey(url: string, platform: SocialLinkPlatform): string {
  if (platform === "imdb") {
    return `imdb:${socialImdbNameId(url) ?? url}`;
  }
  return `${platform}:${url}`;
}

export function socialProfileLinkError(code: string | null): string | null {
  if (code === "invalid") return SOCIAL.profile.linkInvalid;
  if (code === "limit") return SOCIAL.profile.linkLimit;
  return null;
}

export function socialProfileLinksRowSummary(raw: readonly string[]): string {
  const urls = uniqueUrls(raw.map((url) => parseSocialExternalUrl(url)));
  if (urls.length === 0) {
    const draft = raw.map((item) => item.trim()).find(Boolean);
    return draft || SOCIAL.profile.linksAdd;
  }
  const first = socialProfileLinkFaceLabel(urls[0] ?? "");
  if (urls.length === 1) return first;
  return SOCIAL.profile.linksMore
    .replace("{first}", first)
    .replace("{n}", String(urls.length - 1));
}
