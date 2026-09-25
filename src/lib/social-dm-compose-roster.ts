import "server-only";

import { signedAvatarUrls } from "@/lib/s3-avatars";
import { dmComposePersonFromProfile, type DmComposePerson } from "@/lib/social-dm-compose";
import { loadSuggestedPeople } from "@/lib/social-feed";
import { SOCIAL_EXPLORE_PEOPLE_LIMIT } from "@/lib/social-home-bounds";

// Suggested on compose uses the people probe, not the Home For you cap of 3,
// so the list can fill the viewport. docs/design-locks/dm-compose-immersive-ia-lock-v1.md

export async function loadDmComposeRoster(
  supabase: Parameters<typeof loadSuggestedPeople>[0],
  excludeUserId: string,
): Promise<DmComposePerson[]> {
  const rows = await loadSuggestedPeople(
    supabase,
    [excludeUserId],
    [],
    SOCIAL_EXPLORE_PEOPLE_LIMIT,
  );
  const faces =
    rows.length > 0 ? await signedAvatarUrls(rows.map((row) => row.id)) : new Map<string, string | null>();
  return rows.map((row) =>
    dmComposePersonFromProfile({
      id: row.id,
      handle: row.handle,
      displayName: row.display_name,
      photoUrl: faces.get(row.id) ?? null,
    }),
  );
}
