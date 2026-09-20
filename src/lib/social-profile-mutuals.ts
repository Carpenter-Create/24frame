import { SOCIAL, socialPersonLabel } from "@/lib/social";

// Viewer follow overlap on a public profile. "Followed by A, B +N more"
// lists people the viewer follows who also follow the profile owner.
// Omit the row when the list is empty or the viewer is the owner.

export const SOCIAL_MUTUALS_NAME_CAP = 2;
export const SOCIAL_MUTUALS_FACE_CAP = 2;
export const SOCIAL_MUTUALS_PROBE = 8;

export type SocialProfileMutual = {
  id: string;
  handle: string;
  displayName: string;
  label: string;
  photoUrl?: string | null;
};

export type SocialProfileMutuals = {
  people: SocialProfileMutual[];
  extra: number;
};

export function emptySocialProfileMutuals(): SocialProfileMutuals {
  return { people: [], extra: 0 };
}

export function socialFollowedByLine(
  names: readonly string[],
  extra = 0,
): string | null {
  const listed = names.map((name) => name.trim()).filter(Boolean);
  if (listed.length === 0) return null;
  const who = listed.join(", ");
  if (extra > 0) {
    return `${SOCIAL.profile.followedBy} ${who} ${SOCIAL.profile.followedByMore.replace("{n}", String(extra))}`;
  }
  return `${SOCIAL.profile.followedBy} ${who}`;
}

export function socialMutualFromProfile(row: {
  id: string;
  handle: string;
  display_name?: string | null;
}): SocialProfileMutual {
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name ?? "",
    label: socialPersonLabel({ handle: row.handle, displayName: row.display_name }),
  };
}
