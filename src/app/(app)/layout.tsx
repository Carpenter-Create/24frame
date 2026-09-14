import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getOrgContext } from "@/lib/supabase/context";
import { AppShell } from "@/components/chrome/app-shell";
import { resolveMessagesSurface } from "@/lib/ask-globee";
import { getActiveOrgTier } from "@/lib/org-tier";
import { readSidebarCollapsed } from "@/lib/rail-collapse";
import { parseWorkspaceCookie, WORKSPACE_COOKIE } from "@/lib/workspace";

// Server layout for all authenticated routes: resolves the session + the user's orgs
// (RLS-scoped) and the active org, then renders the client shell around the page.
//
// Identity, memberships, GC-staff and the unread count all come from getOrgContext(),
// which is request-cached and fires its independent queries together. The page beneath
// this layout reads the same context for free.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  // NOTE: the "GC accounts are GC-only" enforcement is deferred until view-as-client
  // impersonation exists (#64) — until then a dual-role account keeps client-shell access
  // (with a link to the GC Queue) so the home dashboard stays reachable.

  // Mapping C: a signed-in account with zero orgs may still use this shell and Social.
  // Do not force a creator-only account through company onboarding. Aggregation pages
  // render an empty company-workspace state (or keep a path into /onboarding).
  // Mid-onboarding (an org exists but is not active) still belongs to Aggregation.
  if (ctx.activeOrg && ctx.activeOrg.status !== "active" && !ctx.isGcStaff) {
    redirect("/onboarding");
  }

  // Sidebar collapse + workspace mode persist in cookies; read here so there's no flash.
  const jar = await cookies();
  const sidebarCollapsed = readSidebarCollapsed((name) => jar.get(name)?.value);
  const defaultWorkspace = parseWorkspaceCookie(jar.get(WORKSPACE_COOKIE)?.value);
  const messagesSurface = resolveMessagesSurface({
    isGcStaff: ctx.isGcStaff,
    hasActiveOrg: !!ctx.activeOrg,
    tier: ctx.activeOrg ? await getActiveOrgTier(ctx.activeOrg.id) : null,
  });

  return (
    <AppShell
      email={ctx.user.email}
      name={ctx.user.name}
      orgs={ctx.orgs}
      activeOrgId={ctx.activeOrg?.id ?? null}
      messagesUnread={ctx.unread}
      isGcStaff={ctx.isGcStaff}
      defaultCollapsed={sidebarCollapsed}
      messagesSurface={messagesSurface}
      defaultWorkspace={defaultWorkspace}
    >
      {children}
    </AppShell>
  );
}
