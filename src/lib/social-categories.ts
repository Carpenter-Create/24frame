// Locked Social Home category lenses. Labels and order are founder-locked.
// Home only. Do not persist onto Explore or any other job.
// All resets. Re-tap of the active topic returns All.
// Do not consolidate, rename, or invent cousins.

export const SOCIAL_CATEGORY_ALL = "All" as const;

export const SOCIAL_CATEGORY_TOPICS = [
  "Acting",
  "AI filmmaking",
  "Animation",
  "Casting",
  "Cinematography",
  "Music",
  "Content creator",
  "Directors",
  "Distribution",
  "Film Festivals",
  "Financing",
  "Post-production",
  "Producers",
  "Screenwriting",
  "Vertical micro dramas",
] as const;

export const SOCIAL_CATEGORY_LABELS = [SOCIAL_CATEGORY_ALL, ...SOCIAL_CATEGORY_TOPICS] as const;

export type SocialCategoryTopic = (typeof SOCIAL_CATEGORY_TOPICS)[number];
export type SocialCategoryLabel = (typeof SOCIAL_CATEGORY_LABELS)[number];

export const SOCIAL_CATEGORY_PARAM = "topic";

export function socialCategorySlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const LABEL_BY_SLUG = new Map<string, SocialCategoryLabel>(
  SOCIAL_CATEGORY_LABELS.map((label) => [socialCategorySlug(label), label]),
);

export function parseSocialCategoryParam(raw: string | string[] | undefined | null): SocialCategoryLabel {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return SOCIAL_CATEGORY_ALL;
  const trimmed = value.trim();
  if (!trimmed) return SOCIAL_CATEGORY_ALL;
  const fromSlug = LABEL_BY_SLUG.get(socialCategorySlug(trimmed));
  if (fromSlug) return fromSlug;
  const exact = SOCIAL_CATEGORY_LABELS.find((label) => label === trimmed);
  return exact ?? SOCIAL_CATEGORY_ALL;
}

export function normalizeSocialCategory(raw: string | null | undefined): SocialCategoryTopic | null {
  if (raw == null) return null;
  const parsed = parseSocialCategoryParam(raw);
  if (parsed === SOCIAL_CATEGORY_ALL) return null;
  return parsed;
}

export function socialHomeLensHref(label: SocialCategoryLabel, active: SocialCategoryLabel): string {
  if (label === SOCIAL_CATEGORY_ALL || label === active) return "/social";
  return `/social?${SOCIAL_CATEGORY_PARAM}=${socialCategorySlug(label)}`;
}

export function isSocialHomeLensPath(pathname: string): boolean {
  return pathname === "/social";
}
