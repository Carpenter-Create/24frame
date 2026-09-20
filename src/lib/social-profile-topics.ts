import {
  SOCIAL_CATEGORY_TOPICS,
  normalizeSocialCategory,
  type SocialCategoryTopic,
} from "@/lib/social-categories";

// Profile Topics bank. Industry interests — not Professions.
// Persist ordered labels on profiles.topics. Same locked labels as
// Home Topics. Do not merge with crafts / Professions.

export const SOCIAL_PROFILE_TOPICS = SOCIAL_CATEGORY_TOPICS;
export const SOCIAL_PROFILE_TOPICS_MAX = 8;

function topicValues(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  const text = raw.trim();
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [text];
  } catch {
    return text.split(",").map((part) => part.trim());
  }
}

export function parseSocialProfileTopics(raw: unknown): SocialCategoryTopic[] {
  const seen = new Set<SocialCategoryTopic>();
  const topics: SocialCategoryTopic[] = [];
  for (const value of topicValues(raw)) {
    if (typeof value !== "string") continue;
    const topic = normalizeSocialCategory(value);
    if (!topic || seen.has(topic)) continue;
    seen.add(topic);
    topics.push(topic);
  }
  return topics;
}

export function socialProfileTopicsWrite(raw: unknown): SocialCategoryTopic[] {
  return parseSocialProfileTopics(raw);
}

export function socialProfileTopicsAtMax(selected: readonly string[]): boolean {
  return parseSocialProfileTopics(selected).length >= SOCIAL_PROFILE_TOPICS_MAX;
}

export function toggleSocialProfileTopic(
  selected: readonly string[],
  label: string,
): SocialCategoryTopic[] {
  const current = parseSocialProfileTopics(selected);
  const topic = normalizeSocialCategory(label);
  if (!topic) return current;
  if (current.includes(topic)) return current.filter((item) => item !== topic);
  if (current.length >= SOCIAL_PROFILE_TOPICS_MAX) return current;
  return [...current, topic];
}

export function filterSocialProfileTopics(query: string): SocialCategoryTopic[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...SOCIAL_PROFILE_TOPICS];
  return SOCIAL_PROFILE_TOPICS.filter((topic) => topic.toLowerCase().includes(needle));
}
