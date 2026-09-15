import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";

import { getOrgContext, type OrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export type SocialSession = {
  ctx: OrgContext;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

// Auth + cookie client in one hop. getOrgContext is already request-cached
// and builds its own client for memberships; this sibling createClient is
// the page query client. Serial ctx → createClient was the leftover
// Social-route waterfall after the (app) layout stopped blocking.
// React cache() is request-scoped in RSC. Vitest has no request, so the
// memo would leak across cases that remock getOrgContext.
function requestCache<T extends (...args: never[]) => unknown>(fn: T): T {
  return process.env.VITEST ? fn : cache(fn);
}

export const loadSocialSession = requestCache(async (): Promise<SocialSession | null> => {
  const [ctx, supabase] = await Promise.all([getOrgContext(), createClient()]);
  if (!ctx) return null;
  return { ctx, supabase };
});

export async function requireSocialSession(): Promise<SocialSession> {
  const session = await loadSocialSession();
  if (!session) redirect("/login");
  return session;
}
