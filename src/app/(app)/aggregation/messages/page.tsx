import { redirect } from "next/navigation";

import { ACTIVITY_HREF } from "@/lib/activity";
import { getOrgContext } from "@/lib/supabase/context";
import { getActiveOrgTier } from "@/lib/org-tier";
import { readAskGlobeeThreadId, resolveMessagesSurface } from "@/lib/ask-globee";
import { AskAiLegacyIntercept } from "./ask-ai-legacy-intercept";

// Leftover `/messages` is not an AI workspace. Staff without a client
// org still go to /activity. Everyone else is intercepted onto the
// prior workspace path with the 24Frame AI overlay open.
export default async function MessagesPage({
  searchParams = Promise.resolve({}),
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const tier = ctx.activeOrg ? await getActiveOrgTier(ctx.activeOrg.id) : null;
  const surface = resolveMessagesSurface({
    isGcStaff: ctx.isGcStaff,
    hasActiveOrg: !!ctx.activeOrg,
    tier,
  });

  if (surface === "staff-inbox") {
    redirect(ACTIVITY_HREF);
  }

  return <AskAiLegacyIntercept threadId={readAskGlobeeThreadId(await searchParams)} />;
}
