"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { UserMenu } from "./user-menu";
import { SideNav } from "./side-nav";
import { SettingsRail } from "./settings-rail";
import { SettingsHeaderBack } from "./settings-header-back";
import { MobileNav } from "./mobile-nav";
import { HouseLeadChrome } from "./house-lead-chrome";
import { HouseLeadSearch } from "./house-lead-search";
import { RailCollapse } from "./rail-collapse";
import { AskAssistantChromeProvider } from "@/components/messages/ask-globee-chrome";
import { AskAiOverlayProvider } from "./ask-ai-overlay";
import { cn } from "@/lib/cn";
import type { ActivityItem } from "@/lib/activity";
import type { AppShellChrome } from "@/lib/app-shell-chrome";
import type { MessagesSurface } from "@/lib/ask-globee";
import {
  RAIL_COLLAPSE_WIDTH_VAR,
  RAIL_WIDTH_CLASS,
  migrateSidebarCollapsedCookie,
  persistSidebarCollapsed,
} from "@/lib/rail-collapse";
import { HOUSE_LEAD_SCROLL_CLASS, HOUSE_LEAD_SHELL_CLASS } from "@/lib/house-lead-chrome";
import {
  HOUSE_CANVAS_X_CLASS,
  HOUSE_HOME_RAIL_COLUMN_CLASS,
  HOUSE_PAGE_CANVAS_CLASS,
  HOUSE_RAIL_FLOAT_CLASS,
  HOUSE_RAIL_PANEL_CLASS,
} from "@/lib/house-shell";
import { isSettingsPath, SETTINGS_RAIL_PAD_CLASS } from "@/lib/settings";
import {
  SOCIAL_DESKTOP_FRAME_PAD_CLASS,
  SOCIAL_RAIL_MAIN_OFFSET_CLASS,
  SOCIAL_RAIL_PANEL_CLASS,
  SOCIAL_RAIL_WIDTH_CLASS,
  SOCIAL_TAB_BAR_MAIN_PAD_CLASS,
} from "@/lib/social-chrome";
import { OVERVIEW_RAIL_OFF_WIDTH, overviewHidesRail } from "@/lib/overview";
import { resolveWorkspaceMode, type WorkspaceMode } from "@/lib/workspace";
import { SocialMobileTabBar } from "@/components/social/social-mobile-tab-bar";
import { SocialRailAccountChip } from "@/components/social/social-rail-extras";

type Org = { id: string; name: string };

// Shell composition ported from watershedportal, rethemed to GC tokens. Fixed sidebar +
// viewport-pinned lead chrome + centered content frame. Page scroll lives
// on main — not on a wrapper that includes the header (G9). The sidebar collapses to an icon-only rail; the
// state persists in a cookie (read by the (app) layout → `defaultCollapsed`, so there's no
// flash) and, when collapsed, overrides `--sidebar-width` so the header + main follow.
// Phone: the rail is gone (hidden + width tokens collapse). A header hamburger opens a
// bottom sheet — client destinations, or those plus staff destinations when
// isGcStaff. Desktop 1:2 rail is unchanged.
// Social mounts the same RailCollapse + cookie + width-var path as
// Aggregation · Education. Do not pin Social expanded or invent a
// Social-only chevron. /settings paths: the Access destinations leave.
// One 220 rail (pad 16) occupies that slot — Settings title + You /
// Social / Education / Aggregation. Not a second column. Collapse stays
// off. Phone list is the same sections; pushed panes back to Settings.
// Hamburger stays off. Avatar 32 stays.
// /home: no dest rail (Adam 2026-09-18). Unify-lead chrome + modules
// only. Aggregation · Social · Education rails return off Home.
// Home SoT (HOME-width-lock.md): 48 left (--content-inset) + 16 right
// (--chrome-gutter) at 1440. Not the 220 Access rail. Header full-bleed.
// No --page-max-width.
export function AppShell({
  chrome,
  email = "",
  name,
  photoUrl,
  messagesUnread,
  activityItems = Promise.resolve([]),
  isGcStaff = false,
  defaultCollapsed = false,
  defaultWorkspace = "aggregation",
  children,
}: {
  /** Layout chrome. Do not use() this at the AppShell top — that re-blocks {children}. */
  chrome?: Promise<AppShellChrome>;
  email?: string;
  name?: string | null;
  photoUrl?: string | null;
  orgs?: Org[];
  activeOrgId?: string | null;
  /** Promise, not a number — resolved inside HouseLeadChrome Suspense so the
   *  shell paints without waiting on the badge query. */
  messagesUnread: Promise<number>;
  activityItems?: Promise<ActivityItem[]>;
  isGcStaff?: boolean;
  defaultCollapsed?: boolean;
  /** Kept for callers. Overlay owns AI chrome; leftover /messages intercepts. */
  messagesSurface?: MessagesSurface;
  defaultWorkspace?: WorkspaceMode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [workspaceCookie, setWorkspaceCookie] = useState(defaultWorkspace);
  const cookiesApplied = useRef(false);
  const collapseTouched = useRef(false);
  const pathname = usePathname();
  const workspace = resolveWorkspaceMode(pathname, workspaceCookie);
  const applyChromeCookies = useCallback(
    (next: { defaultCollapsed: boolean; defaultWorkspace: WorkspaceMode }) => {
      if (cookiesApplied.current) return;
      cookiesApplied.current = true;
      if (!collapseTouched.current) {
        setCollapsed(next.defaultCollapsed);
      }
      setWorkspaceCookie(next.defaultWorkspace);
    },
    [],
  );
  const cookieSync =
    chrome ? (
      <Suspense fallback={null}>
        <ChromeCookieSync chrome={chrome} onCookies={applyChromeCookies} />
      </Suspense>
    ) : null;
  // Catalog list pages opt out of the centered width cap so the shared
  // Titles frame can own content max-width (edge of sidebar → right edge).
  // /titles and staff /queue share that frame. Non-bleed pages share
  // `--chrome-gutter` on the canvas x so the trailing chrome and content
  // column share one right edge. Messages keeps `--content-inset` vertical.
  const titlesBleed = pathname === "/titles" || pathname === "/queue";
  const homeChrome = overviewHidesRail(pathname);
  // Home (`/` + /home chrome) stays off --page-max-width. /home uses the
  // 48/16 house inset (HOME-width-lock.md). Aggregation Dashboard uses
  // the Education house measure — Adam 2026-09-18.
  const homePage = pathname === "/" || homeChrome;
  const settingsPage = isSettingsPath(pathname);
  const socialChrome = workspace === "social" && !settingsPage && !homeChrome;

  useEffect(() => {
    migrateSidebarCollapsedCookie(collapsed);
  }, [collapsed]);

  const toggle = () => {
    collapseTouched.current = true;
    setCollapsed((c) => {
      const next = !c;
      persistSidebarCollapsed(next);
      return next;
    });
  };

  const collapseWidthStyle = homeChrome
    ? ({
        "--sidebar-width": OVERVIEW_RAIL_OFF_WIDTH,
        "--sidebar-width-collapsed": OVERVIEW_RAIL_OFF_WIDTH,
      } as React.CSSProperties)
    : collapsed && !settingsPage
      ? ({ "--sidebar-width": RAIL_COLLAPSE_WIDTH_VAR } as React.CSSProperties)
      : undefined;

  if (socialChrome) {
    return (
      <AskAiOverlayProvider>
      <AskAssistantChromeProvider>
        {cookieSync}
        <div
          className={cn(HOUSE_LEAD_SHELL_CLASS, HOUSE_PAGE_CANVAS_CLASS)}
          data-social-workspace=""
          style={collapseWidthStyle}
        >
          <HouseLeadChrome
            workspace="social"
            logoVisible="always"
            search={<HouseLeadSearch tone="live" />}
            trailingSearch={<HouseLeadSearch tone="live" presentation="icon" />}
            activityUnread={messagesUnread}
            activityItems={activityItems}
            accountMenu={
              <AccountMenuSlot chrome={chrome} email={email} name={name} photoUrl={photoUrl} />
            }
          />
          <aside
            className={cn(
              HOUSE_RAIL_FLOAT_CLASS,
              collapsed ? RAIL_WIDTH_CLASS : SOCIAL_RAIL_WIDTH_CLASS,
              SOCIAL_RAIL_PANEL_CLASS,
            )}
            data-app-rail=""
            data-social-rail=""
          >
            <RailCollapse collapsed={collapsed} onToggle={toggle} />
            <div className={cn("flex min-h-0 flex-1 flex-col", collapsed ? "gap-2 px-1 pb-2" : "gap-3 p-4")}>
              <div className="min-h-0 overflow-y-auto">
                <SideNav
                  isGcStaff={false}
                  collapsed={collapsed}
                  workspace="social"
                />
              </div>
              <div className="min-h-0 flex-1" />
              <SocialRailAccountChipSlot
                chrome={chrome}
                name={name}
                photoUrl={photoUrl}
                collapsed={collapsed}
              />
            </div>
          </aside>
          <main
            className={cn(HOUSE_LEAD_SCROLL_CLASS, collapsed ? undefined : SOCIAL_RAIL_MAIN_OFFSET_CLASS)}
            style={collapsed ? { marginLeft: "var(--sidebar-width)" } : undefined}
            data-app-social-frame=""
            data-house-lead-scroll=""
          >
            <div className={cn(SOCIAL_DESKTOP_FRAME_PAD_CLASS, SOCIAL_TAB_BAR_MAIN_PAD_CLASS)}>{children}</div>
          </main>
          <SocialMobileTabBar />
        </div>
      </AskAssistantChromeProvider>
      </AskAiOverlayProvider>
    );
  }

  return (
    <AskAiOverlayProvider>
    <AskAssistantChromeProvider>
    {cookieSync}
    <div
      className={cn(HOUSE_LEAD_SHELL_CLASS, HOUSE_PAGE_CANVAS_CLASS)}
      data-education-workspace={workspace === "education" ? "" : undefined}
      data-home-chrome={homeChrome ? "" : undefined}
      style={collapseWidthStyle}
    >
      {homeChrome ? null : (
        <aside
          className={cn(
            HOUSE_RAIL_FLOAT_CLASS,
            RAIL_WIDTH_CLASS,
            HOUSE_RAIL_PANEL_CLASS,
          )}
          data-app-rail=""
          data-settings-rail={settingsPage ? "" : undefined}
        >
          {settingsPage ? null : <RailCollapse collapsed={collapsed} onToggle={toggle} />}
          <div
            className={cn("flex-1 overflow-y-auto", settingsPage ? SETTINGS_RAIL_PAD_CLASS : "pt-1")}
          >
            {settingsPage ? (
              <SettingsRail />
            ) : (
              <SideNavSlot
                chrome={chrome}
                isGcStaff={isGcStaff}
                collapsed={collapsed}
                workspace={workspace}
              />
            )}
          </div>
        </aside>
      )}

      {/* Full-width top + dest side nav — same HouseLeadChrome as Social.
          Phone (Adam 2026-09-18): Asset 8 emblem on every workspace.
          Dest-rail phone (Aggregation / Education) is hamburger ·
          house gap · emblem · workspace pill. Home / Social: emblem
          only — no hamburger. Trailing is Social search (if Social)
          · bell · avatar. Ask + theme live on the avatar sheet.
          Emblem links workspace home; it does not open the rail. Do
          not center the pill. Do not cluster it with the avatar.
          Desktop keeps Ask · theme · switcher + avatar. Brand sits
          on the full-width top, not a second rail chrome. Period
          stays on the Dashboard org row.
          No org switcher on any route. Aggregation mid-lead stays
          empty. Education mounts a quiet course/video search
          immediately right of the logo on desktop, same
          Facebook-compact slot as Social live search. Phone
          Education search sits in a full-width row under the lead —
          not in the top nav. Search also mounts on the Access
          leftover `/messages` intercept, and on mobile `/titles` (528:542).
          Phone avatar opens 544:561. Hamburger stays the nav sheet.
          Do not invent Move chrome or a second phone switcher.
          Studio secondary rail stays HOLD. */}
      <HouseLeadChrome
        workspace={workspace}
        settingsPage={settingsPage}
        logoVisible="always"
        leadingNav={
          settingsPage ? (
            <SettingsHeaderBack />
          ) : homeChrome ? undefined : (
            <MobileNavSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />
          )
        }
        search={
          workspace === "education" && !settingsPage ? (
            <Suspense fallback={null}>
              <HouseLeadSearch tone="quiet" />
            </Suspense>
          ) : undefined
        }
        underNav={
          workspace === "education" && !settingsPage ? (
            <Suspense fallback={null}>
              <HouseLeadSearch tone="quiet" inputId="education-header-q-phone" />
            </Suspense>
          ) : undefined
        }
        activityUnread={messagesUnread}
        activityItems={activityItems}
        accountMenu={
          <AccountMenuSlot chrome={chrome} email={email} name={name} photoUrl={photoUrl} />
        }
      />

      <main
        className={HOUSE_LEAD_SCROLL_CLASS}
        data-house-lead-scroll=""
        style={{
          marginLeft: "var(--sidebar-width)",
        }}
      >
        {titlesBleed ? (
          <div className="w-full pb-24">{children}</div>
        ) : homePage ? (
          <div
            className={cn(
              "py-[var(--space-8)] max-md:px-[var(--space-6)] max-md:py-[var(--space-6)]",
              homeChrome
                ? HOUSE_HOME_RAIL_COLUMN_CLASS
                : cn("w-full", HOUSE_CANVAS_X_CLASS),
            )}
            data-app-home-frame=""
          >
            {children}
          </div>
        ) : (
          <div
            className={cn("mx-auto w-full pb-24 pt-8", HOUSE_CANVAS_X_CLASS)}
            style={{ maxWidth: "var(--page-max-width)" }}
          >
            {children}
          </div>
        )}
      </main>
    </div>
    </AskAssistantChromeProvider>
    </AskAiOverlayProvider>
  );
}

function SocialRailAccountChipSlot({
  chrome,
  name,
  photoUrl,
  collapsed,
}: {
  chrome?: Promise<AppShellChrome>;
  name?: string | null;
  photoUrl?: string | null;
  collapsed: boolean;
}) {
  if (!chrome) return <SocialRailAccountChip name={name} photoUrl={photoUrl} collapsed={collapsed} />;
  return (
    <Suspense fallback={<SocialRailAccountChip name={name} photoUrl={photoUrl} collapsed={collapsed} />}>
      <SocialRailAccountChipFromChrome chrome={chrome} collapsed={collapsed} />
    </Suspense>
  );
}

function SocialRailAccountChipFromChrome({
  chrome,
  collapsed,
}: {
  chrome: Promise<AppShellChrome>;
  collapsed: boolean;
}) {
  const data = use(chrome);
  return <SocialRailAccountChip name={data.name} photoUrl={data.photoUrl} collapsed={collapsed} />;
}

function AccountMenuSlot({
  chrome,
  email,
  name,
  photoUrl,
}: {
  chrome?: Promise<AppShellChrome>;
  email: string;
  name?: string | null;
  photoUrl?: string | null;
}) {
  if (!chrome) {
    return <UserMenu email={email} name={name} photoUrl={photoUrl} />;
  }
  return (
    <Suspense fallback={<UserMenu email={email} name={name} photoUrl={photoUrl} />}>
      <UserMenuFromChrome chrome={chrome} />
    </Suspense>
  );
}

function UserMenuFromChrome({
  chrome,
}: {
  chrome: Promise<AppShellChrome>;
}) {
  const data = use(chrome);
  return <UserMenu email={data.email} name={data.name} photoUrl={data.photoUrl} />;
}

function ChromeCookieSync({
  chrome,
  onCookies,
}: {
  chrome: Promise<AppShellChrome>;
  onCookies: (next: { defaultCollapsed: boolean; defaultWorkspace: WorkspaceMode }) => void;
}) {
  const data = use(chrome);
  useEffect(() => {
    onCookies({
      defaultCollapsed: data.defaultCollapsed,
      defaultWorkspace: data.defaultWorkspace,
    });
  }, [data.defaultCollapsed, data.defaultWorkspace, onCookies]);
  return null;
}

function SideNavSlot({
  chrome,
  isGcStaff,
  collapsed,
  workspace,
}: {
  chrome?: Promise<AppShellChrome>;
  isGcStaff: boolean;
  collapsed: boolean;
  workspace: WorkspaceMode;
}) {
  if (!chrome) {
    return (
      <SideNav
        isGcStaff={isGcStaff}
        collapsed={collapsed}
        workspace={workspace}
      />
    );
  }
  return (
    <Suspense
      fallback={
        <SideNav
          isGcStaff={isGcStaff}
          collapsed={collapsed}
          workspace={workspace}
        />
      }
    >
      <SideNavFromChrome
        chrome={chrome}
        collapsed={collapsed}
        workspace={workspace}
      />
    </Suspense>
  );
}

function SideNavFromChrome({
  chrome,
  collapsed,
  workspace,
}: {
  chrome: Promise<AppShellChrome>;
  collapsed: boolean;
  workspace: WorkspaceMode;
}) {
  const data = use(chrome);
  return (
    <SideNav
      isGcStaff={data.isGcStaff}
      collapsed={collapsed}
      workspace={workspace}
    />
  );
}

function MobileNavSlot({
  chrome,
  isGcStaff,
  workspace,
}: {
  chrome?: Promise<AppShellChrome>;
  isGcStaff: boolean;
  workspace: WorkspaceMode;
}) {
  if (!chrome) return <MobileNav isGcStaff={isGcStaff} workspace={workspace} />;
  return (
    <Suspense fallback={<MobileNav isGcStaff={isGcStaff} workspace={workspace} />}>
      <MobileNavFromChrome chrome={chrome} workspace={workspace} />
    </Suspense>
  );
}

function MobileNavFromChrome({
  chrome,
  workspace,
}: {
  chrome: Promise<AppShellChrome>;
  workspace: WorkspaceMode;
}) {
  const data = use(chrome);
  return <MobileNav isGcStaff={data.isGcStaff} workspace={workspace} />;
}
