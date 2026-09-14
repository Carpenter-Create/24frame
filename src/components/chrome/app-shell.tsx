"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";

import { UserMenu } from "./user-menu";
import { SideNav } from "./side-nav";
import { SettingsRail } from "./settings-rail";
import { SettingsHeaderBack } from "./settings-header-back";
import { MobileNav } from "./mobile-nav";
import { MessagesAppHeader } from "./messages-app-header";
import { TitlesHeaderSearch } from "@/components/titles/titles-header-search";
import { AskAssistantChromeProvider } from "@/components/messages/ask-globee-chrome";
import { cn } from "@/lib/cn";
import type { MessagesSurface } from "@/lib/ask-globee";
import { MOBILE_CHROME_LEAD_PAD_CLASS } from "@/lib/mobile-chrome";
import {
  RAIL_COLLAPSE_CHEVRON,
  RAIL_COLLAPSE_CHEVRON_CLASS,
  RAIL_COLLAPSE_EXPAND_ROW_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT,
  migrateSidebarCollapsedCookie,
  persistSidebarCollapsed,
} from "@/lib/rail-collapse";
import { PRODUCT_NAME } from "@/lib/product";
import { isSettingsPath, SETTINGS_RAIL_PAD_CLASS } from "@/lib/settings";
import { resolveWorkspaceMode, type WorkspaceMode } from "@/lib/workspace";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SocialMobileDock } from "@/components/social/social-mobile-dock";

type Org = { id: string; name: string };

// Shell composition ported from watershedportal, rethemed to GC tokens. Fixed sidebar +
// sticky header + centered content frame. The sidebar collapses to an icon-only rail; the
// state persists in a cookie (read by the (app) layout → `defaultCollapsed`, so there's no
// flash) and, when collapsed, overrides `--sidebar-width` so the header + main follow.
// Phone: the rail is gone (hidden + width tokens collapse). A header hamburger opens a
// bottom sheet — client destinations, or those plus staff destinations when
// isGcStaff. Desktop 1:2 rail is unchanged.
// /settings paths: the Access destinations leave. One 220 rail (pad 16)
// occupies that slot — ← Home / Profile / Agreements / Refer a
// friend. Not a second column. Collapse stays off. Phone left slot is
// the same ← Home (623:785). Hamburger stays off. Avatar 32 stays.
export function AppShell({
  email,
  name,
  photoUrl,
  messagesUnread,
  isGcStaff = false,
  defaultCollapsed = false,
  messagesSurface = "staff-inbox",
  defaultWorkspace = "aggregation",
  children,
}: {
  email: string;
  name?: string | null;
  photoUrl?: string | null;
  orgs: Org[];
  activeOrgId: string | null;
  /** Promise, not a number — resolved inside SideNav's Suspense boundary so the
   *  shell paints without waiting on the badge query. */
  messagesUnread: Promise<number>;
  isGcStaff?: boolean;
  defaultCollapsed?: boolean;
  messagesSurface?: MessagesSurface;
  defaultWorkspace?: WorkspaceMode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const pathname = usePathname();
  const workspace = resolveWorkspaceMode(pathname, defaultWorkspace);
  // The catalog opts out of the centered width cap so its hero can bleed full-width
  // (edge of sidebar → right edge). That page then manages its own content max-width.
  // Non-bleed pages share `--content-inset`. Titles stay the bleed exception.
  const titlesBleed = pathname === "/titles";
  const homePage = pathname === "/";
  const messagesPage = pathname === "/messages";
  const settingsPage = isSettingsPath(pathname);

  useEffect(() => {
    migrateSidebarCollapsedCookie(collapsed);
  }, [collapsed]);

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      persistSidebarCollapsed(next);
      return next;
    });
  };

  return (
    <AskAssistantChromeProvider>
    <div
      className="min-h-dvh"
      style={
        collapsed && !settingsPage
          ? ({ "--sidebar-width": "var(--sidebar-width-collapsed)" } as React.CSSProperties)
          : undefined
      }
    >
      <aside
        className="fixed left-0 top-0 z-30 hidden h-dvh flex-col border-r border-hairline bg-surface md:flex"
        data-app-rail=""
        data-settings-rail={settingsPage ? "" : undefined}
        style={{ width: "var(--sidebar-width)" }}
      >
        <div
          className={cn(
            "flex items-center",
            settingsPage ? "px-[var(--space-4)]" : collapsed ? "justify-center px-2" : "gap-2 px-2",
          )}
          style={{ height: "var(--header-height)" }}
        >
          {settingsPage || !collapsed ? (
            <span className="flex-1 truncate t-body font-medium text-ink">{PRODUCT_NAME}</span>
          ) : null}
          {settingsPage || collapsed ? null : (
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              aria-pressed={false}
              data-rail-collapse={RAIL_COLLAPSE_CHEVRON}
              className={RAIL_COLLAPSE_CHEVRON_CLASS}
            >
              <CaretDoubleLeft
                className={RAIL_COLLAPSE_CHEVRON_ICON_CLASS}
                weight={RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT}
              />
            </button>
          )}
        </div>
        {settingsPage || !collapsed ? null : (
          <div className={RAIL_COLLAPSE_EXPAND_ROW_CLASS}>
            <button
              type="button"
              onClick={toggle}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              aria-pressed={true}
              data-rail-collapse={RAIL_COLLAPSE_CHEVRON}
              className={RAIL_COLLAPSE_CHEVRON_CLASS}
            >
              <CaretDoubleRight
                className={RAIL_COLLAPSE_CHEVRON_ICON_CLASS}
                weight={RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT}
              />
            </button>
          </div>
        )}
        <div
          className={cn("flex-1 overflow-y-auto", settingsPage ? SETTINGS_RAIL_PAD_CLASS : "pt-1")}
        >
          {settingsPage ? (
            <SettingsRail />
          ) : (
            <SideNav
              messagesUnread={messagesUnread}
              isGcStaff={isGcStaff}
              collapsed={collapsed}
              workspace={workspace}
            />
          )}
        </div>
      </aside>

      {/* Access header is avatar / account menu only — no org switcher on any route.
          Search mounts on the Access `/messages` gate, and on mobile `/titles`
          (528:542). Desktop 1:3, `/` 1:2, and `/titles/[id]` 1:4 stay avatar-only.
          Phone avatar opens 544:561. Hamburger stays the nav sheet. */}
      <header
        className={cn(
          "sticky top-0 z-40 flex items-center justify-end gap-4 border-b border-hairline bg-surface/85 backdrop-blur",
          MOBILE_CHROME_LEAD_PAD_CLASS,
          "md:px-[var(--content-inset)]",
        )}
        data-app-header=""
        style={{ height: "var(--header-height)", marginLeft: "var(--sidebar-width)" }}
      >
        <div data-app-header-leading="" className="mr-auto flex min-w-0 flex-1 items-center gap-2">
          {settingsPage ? <SettingsHeaderBack /> : <MobileNav isGcStaff={isGcStaff} workspace={workspace} />}
          {settingsPage ? null : <WorkspaceSwitcher defaultWorkspace={defaultWorkspace} />}
          {messagesPage ? <MessagesAppHeader surface={messagesSurface} /> : null}
          {titlesBleed ? <TitlesHeaderSearch /> : null}
        </div>
        <div className="flex items-center gap-3">
          <UserMenu email={email} name={name} photoUrl={photoUrl} />
        </div>
      </header>

      <main
        style={{
          marginLeft: "var(--sidebar-width)",
          minHeight: "calc(100dvh - var(--header-height))",
        }}
      >
        {titlesBleed ? (
          <div className="w-full pb-24">{children}</div>
        ) : homePage ? (
          <div
            className="w-full px-[var(--content-inset)] py-[var(--space-8)]"
            data-app-home-frame=""
          >
            {children}
          </div>
        ) : messagesPage ? (
          <div
            className="w-full p-[var(--content-inset)]"
            data-app-messages-frame=""
          >
            {children}
          </div>
        ) : (
          <div className="mx-auto w-full px-[var(--content-inset)] pb-24 pt-8" style={{ maxWidth: "var(--page-max-width)" }}>
            {children}
          </div>
        )}
      </main>
      {workspace === "social" && !settingsPage ? <SocialMobileDock /> : null}
    </div>
    </AskAssistantChromeProvider>
  );
}
