import type { createClient } from "@/lib/supabase/server";
import type { SocialProfileRow } from "@/lib/social-feed";
import {
  HANDLE_MAX,
  HANDLE_MIN,
  normalizeDisplayName,
  profileInsertRow,
  SOCIAL,
  suggestedHandleCollisionSuffix,
  suggestedHandleSeed,
} from "@/lib/social";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type SocialEnsureUser = {
  id: string;
  email: string;
  name?: string | null;
};

// Mapping C: stories.author_id → profiles.id. A signed-in account may post
// once this row exists. Only the session user is inserted — never an invitee
// or any other auth.users.id. Org invite / membership writes must not call this.

export function nextHandleCandidate(seed: string, userId: string, attempt: number): string {
  const suffix = suggestedHandleCollisionSuffix(userId, attempt);
  const room = HANDLE_MAX - suffix.length;
  const base = seed.slice(0, Math.max(HANDLE_MIN, room));
  return `${base}${suffix}`.slice(0, HANDLE_MAX);
}

function isUniqueViolation(error: { message: string; code?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || error.message.toLowerCase().includes("duplicate");
}

export async function ensureOwnSocialProfile(
  supabase: ServerClient,
  user: SocialEnsureUser,
): Promise<SocialProfileRow | null> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, handle, display_name, status, bio")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing;

  const displayName = normalizeDisplayName(user.name ?? "") ?? SOCIAL.profile.defaultDisplayName;
  const seed = suggestedHandleSeed(user.email, user.id);
  let handle = seed;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from("profiles").insert(
      profileInsertRow({
        userId: user.id,
        handle,
        displayName,
      }),
    );
    if (!error) {
      return {
        id: user.id,
        handle,
        display_name: displayName,
        status: "active",
        bio: null,
      };
    }
    if (!isUniqueViolation(error)) return null;

    const { data: raced } = await supabase
      .from("profiles")
      .select("id, handle, display_name, status, bio")
      .eq("id", user.id)
      .maybeSingle();
    if (raced) return raced;

    handle = nextHandleCandidate(seed, user.id, attempt);
  }

  return null;
}
