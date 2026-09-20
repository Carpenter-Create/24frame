// Two banks: Topics (industry interests) are primary serving.
// Professions (crafts / roles_*) may soft-bias only. Not ML.
// Empty Topics keep the locked Topics. order, then profession bias.

import {
  SOCIAL_CATEGORY_TOPICS,
  type SocialCategoryTopic,
} from "@/lib/social-categories";
import {
  SOCIAL_PROFILE_ROLE_GROUPS,
  parseSocialProfileRoles,
  socialProfileRoleLabel,
  type SocialProfileRoleSlug,
} from "@/lib/social-profile-roles";
import { parseSocialProfileTopics } from "@/lib/social-profile-topics";

export type SocialInterestInput = {
  topics?: unknown;
  crafts?: unknown;
};

export function socialInterestInput(raw: SocialInterestInput | unknown): SocialInterestInput {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && ("topics" in raw || "crafts" in raw)) {
    return raw as SocialInterestInput;
  }
  return { crafts: raw };
}

export type SocialRoleAffinity = {
  topics: readonly SocialCategoryTopic[];
  neighbors: readonly SocialProfileRoleSlug[];
};

const GROUP_TOPICS: Record<string, readonly SocialCategoryTopic[]> = {
  cast: ["Acting", "Casting", "Content creator"],
  writing: ["Screenwriting", "Content creator"],
  directing: ["Directors", "AI filmmaking"],
  producing: ["Producers", "Film Festivals", "Distribution"],
  camera: ["Cinematography"],
  editorial: ["Post-production"],
  design: ["Post-production", "Animation"],
  sound_music: ["Music", "Post-production"],
  vfx_animation: ["Animation", "Post-production", "AI filmmaking"],
  production_ops: ["Producers", "Film Festivals"],
  casting: ["Casting", "Acting"],
  business_capital_rep: ["Financing", "Distribution", "Film Festivals"],
  adjacent: ["Content creator", "Vertical micro dramas"],
};

const ROLE_TOPIC_OVERRIDES: Partial<Record<SocialProfileRoleSlug, readonly SocialCategoryTopic[]>> = {
  investor: ["Financing", "Distribution", "Film Festivals"],
  financier: ["Financing", "Distribution"],
  art_director: ["Animation", "Post-production"],
  production_designer: ["Post-production", "Animation"],
  creator: ["Content creator", "Vertical micro dramas"],
  journalist: ["Screenwriting", "Content creator"],
};

const ROLE_NEIGHBOR_OVERRIDES: Partial<
  Record<SocialProfileRoleSlug, readonly SocialProfileRoleSlug[]>
> = {
  art_director: ["production_designer", "set_decorator", "prop_master"],
  production_designer: ["art_director", "set_decorator", "costume_designer"],
  investor: ["financier", "studio_executive", "distributor", "producer"],
};

function uniqueTopics(topics: readonly SocialCategoryTopic[]): SocialCategoryTopic[] {
  const seen = new Set<SocialCategoryTopic>();
  const out: SocialCategoryTopic[] = [];
  for (const topic of topics) {
    if (seen.has(topic)) continue;
    seen.add(topic);
    out.push(topic);
  }
  return out;
}

export const ROLE_INTEREST_AFFINITY: Record<SocialProfileRoleSlug, SocialRoleAffinity> =
  Object.fromEntries(
    SOCIAL_PROFILE_ROLE_GROUPS.flatMap((group) => {
      const siblings = group.roles.map((role) => role.slug);
      return group.roles.map((role) => {
        const extra = ROLE_NEIGHBOR_OVERRIDES[role.slug] ?? [];
        const neighbors = [...siblings.filter((slug) => slug !== role.slug), ...extra].filter(
          (slug, index, all) => all.indexOf(slug) === index,
        );
        return [
          role.slug,
          {
            topics: uniqueTopics([
              ...(ROLE_TOPIC_OVERRIDES[role.slug] ?? GROUP_TOPICS[group.id] ?? []),
            ]),
            neighbors,
          },
        ];
      });
    }),
  ) as unknown as Record<SocialProfileRoleSlug, SocialRoleAffinity>;

export function socialRolePreferredTopics(raw: unknown): SocialCategoryTopic[] {
  const crafts = parseSocialProfileRoles(raw);
  const preferred: SocialCategoryTopic[] = [];
  const seen = new Set<SocialCategoryTopic>();
  for (const slug of crafts) {
    for (const topic of ROLE_INTEREST_AFFINITY[slug]?.topics ?? []) {
      if (seen.has(topic)) continue;
      seen.add(topic);
      preferred.push(topic);
    }
  }
  return preferred;
}

export function socialRoleAffinityTopics(raw: unknown): SocialCategoryTopic[] {
  const preferred = socialRolePreferredTopics(raw);
  if (preferred.length === 0) return [...SOCIAL_CATEGORY_TOPICS];
  const seen = new Set(preferred);
  return [...preferred, ...SOCIAL_CATEGORY_TOPICS.filter((topic) => !seen.has(topic))];
}

export function socialInterestTopics(raw: SocialInterestInput | unknown = {}): SocialCategoryTopic[] {
  const viewer = socialInterestInput(raw);
  const selected = parseSocialProfileTopics(viewer.topics);
  const bias = socialRolePreferredTopics(viewer.crafts);
  if (selected.length === 0 && bias.length === 0) return [...SOCIAL_CATEGORY_TOPICS];
  const seen = new Set<SocialCategoryTopic>();
  const out: SocialCategoryTopic[] = [];
  for (const topic of [...selected, ...bias, ...SOCIAL_CATEGORY_TOPICS]) {
    if (seen.has(topic)) continue;
    seen.add(topic);
    out.push(topic);
  }
  return out;
}

export function socialTopicPersonScore(viewerTopics: unknown, otherTopics: unknown): number {
  const viewer = parseSocialProfileTopics(viewerTopics);
  if (viewer.length === 0) return 0;
  const other = new Set(parseSocialProfileTopics(otherTopics));
  if (other.size === 0) return 0;
  let score = 0;
  for (const topic of viewer) {
    if (other.has(topic)) score += 1;
  }
  return score;
}

export function socialRoleNeighborSet(raw: unknown): Set<SocialProfileRoleSlug> {
  const crafts = parseSocialProfileRoles(raw);
  const neighbors = new Set<SocialProfileRoleSlug>();
  for (const slug of crafts) {
    neighbors.add(slug);
    for (const next of ROLE_INTEREST_AFFINITY[slug]?.neighbors ?? []) neighbors.add(next);
  }
  return neighbors;
}

export function socialRolePersonScore(viewerCrafts: unknown, otherCrafts: unknown): number {
  const viewer = parseSocialProfileRoles(viewerCrafts);
  if (viewer.length === 0) return 0;
  const other = new Set(parseSocialProfileRoles(otherCrafts));
  if (other.size === 0) return 0;
  const neighbors = socialRoleNeighborSet(viewer);
  let score = 0;
  for (const slug of viewer) {
    if (other.has(slug)) score += 2;
  }
  for (const slug of other) {
    if (!viewer.includes(slug) && neighbors.has(slug)) score += 1;
  }
  return score;
}

export function rankSocialSuggestedPeople<
  T extends { handle: string; crafts?: readonly string[] | null; topics?: readonly string[] | null },
>(people: readonly T[], viewer: SocialInterestInput | unknown): T[] {
  const interest = socialInterestInput(viewer);
  const hasTopics = parseSocialProfileTopics(interest.topics).length > 0;
  const hasCrafts = parseSocialProfileRoles(interest.crafts).length > 0;
  if (!hasTopics && !hasCrafts) return [...people];
  return [...people].sort((a, b) => {
    const topicDelta =
      socialTopicPersonScore(interest.topics, b.topics) - socialTopicPersonScore(interest.topics, a.topics);
    if (topicDelta !== 0) return topicDelta;
    const roleDelta = socialRolePersonScore(interest.crafts, b.crafts) - socialRolePersonScore(interest.crafts, a.crafts);
    if (roleDelta !== 0) return roleDelta;
    return a.handle.localeCompare(b.handle);
  });
}

function courseHaystack(course: {
  title: string;
  description: string | null;
  catalog_code: string;
}): string {
  return [course.title, course.description ?? "", course.catalog_code].join(" ").toLowerCase();
}

export function socialCourseAffinityScore(
  course: { title: string; description: string | null; catalog_code: string },
  viewer: SocialInterestInput | unknown,
): number {
  const interest = socialInterestInput(viewer);
  const selected = parseSocialProfileTopics(interest.topics);
  const crafts = parseSocialProfileRoles(interest.crafts);
  if (selected.length === 0 && crafts.length === 0) return 0;
  const haystack = courseHaystack(course);
  let score = 0;
  for (const [index, topic] of selected.entries()) {
    if (haystack.includes(topic.toLowerCase())) score += 8 - Math.min(index, 3);
  }
  const bias = socialRolePreferredTopics(crafts);
  for (const [index, topic] of bias.entries()) {
    if (index >= 4) break;
    if (haystack.includes(topic.toLowerCase())) score += 3;
  }
  for (const slug of crafts) {
    const label = socialProfileRoleLabel(slug)?.toLowerCase();
    if (label && haystack.includes(label)) score += 2;
    if (haystack.includes(slug.replaceAll("_", " "))) score += 1;
  }
  return score;
}

export function socialPostAffinityScore(
  category: string | null | undefined,
  viewer: SocialInterestInput | unknown,
): number {
  if (!category) return 0;
  const interest = socialInterestInput(viewer);
  const selected = parseSocialProfileTopics(interest.topics);
  if (selected.includes(category as SocialCategoryTopic)) return 2;
  if (socialRolePreferredTopics(interest.crafts).includes(category as SocialCategoryTopic)) return 1;
  return 0;
}
