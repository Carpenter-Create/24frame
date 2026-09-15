import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCOUNT_PHOTO_HREF } from "@/lib/account-avatar";
import { resolveMessagesSurface, type MessagesSurface } from "@/lib/ask-globee";
import { getActiveOrgTier } from "@/lib/org-tier";
import { readSidebarCollapsed } from "@/lib/rail-collapse";
import { hasAvatarObject } from "@/lib/s3-avatars";
import { getOrgContext, type OrgContext } from "@/lib/supabase/context";
import { parseWorkspaceCookie, WORKSPACE_COOKIE, type WorkspaceMode } from "@/lib/workspace";

export type AppShellChrome = {
  email: string;
  name?: string | null;
  photoUrl: string | null;
  orgs: { id: string; name: string }[];
  activeOrgId: string | null;
  unread: Promise<number>;
  isGcStaff: boolean;
  defaultCollapsed: boolean;
  messagesSurface: MessagesSurface;
  defaultWorkspace: WorkspaceMode;
};

// Same gates the (app) layout used to await before {children}. Middleware
// already bounces an empty session. This still enforces mid-onboarding.
// Call from a Suspense sibling so Social loading.tsx can paint first.
export async function enforceAppAccess(): Promise<OrgContext> {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  if (ctx.activeOrg && ctx.activeOrg.status !== "active" && !ctx.isGcStaff) {
    redirect("/onboarding");
  }
  return ctx;
}

// Identity + Aggregation-only chrome. Not awaited in the layout body.
// Photo HEAD and org-tier ran serially after getOrgContext and blocked
// every Social tab click; they stay here, off the page slot.
export const loadAppShellChrome = cache(async (): Promise<AppShellChrome> => {
  const ctx = await enforceAppAccess();
  const jar = await cookies();
  const [hasPhoto, tier] = await Promise.all([
    hasAvatarObject(ctx.user.id),
    ctx.activeOrg ? getActiveOrgTier(ctx.activeOrg.id) : Promise.resolve(null),
  ]);
  return {
    email: ctx.user.email,
    name: ctx.user.name,
    photoUrl: hasPhoto ? ACCOUNT_PHOTO_HREF : null,
    orgs: ctx.orgs,
    activeOrgId: ctx.activeOrg?.id ?? null,
    unread: ctx.unread,
    isGcStaff: ctx.isGcStaff,
    defaultCollapsed: readSidebarCollapsed((name) => jar.get(name)?.value),
    messagesSurface: resolveMessagesSurface({
      isGcStaff: ctx.isGcStaff,
      hasActiveOrg: !!ctx.activeOrg,
      tier,
    }),
    defaultWorkspace: parseWorkspaceCookie(jar.get(WORKSPACE_COOKIE)?.value),
  };
});

export function appShellUnread(chrome: Promise<AppShellChrome>): Promise<number> {
  return chrome.then((data) => data.unread);
}
