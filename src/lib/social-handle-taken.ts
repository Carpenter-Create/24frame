import type { createClient } from "@/lib/supabase/server";
import { SOCIAL } from "@/lib/social";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Case-insensitive collision (profiles.handle is citext). Own row
// is never "taken" — casing-only edits stay with the same owner.

export function handleTakenError(input: {
  ownerId: string;
  collisionId: string | null | undefined;
}): string | null {
  if (!input.collisionId || input.collisionId === input.ownerId) return null;
  return SOCIAL.profile.handleTaken;
}

export async function lookupHandleCollision(
  supabase: ServerClient,
  handle: string,
): Promise<{ id: string } | null> {
  const { data } = await supabase.from("profiles").select("id").eq("handle", handle).maybeSingle();
  return data ?? null;
}
