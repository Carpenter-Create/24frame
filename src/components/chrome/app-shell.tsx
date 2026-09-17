"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";

import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { SideNav } from "./side-nav";
import { SettingsRail } from "./settings-rail";
import { SettingsHeaderBack } from "./settings-header-back";
import { MobileNav } from "./mobile-nav";
import { MessagesAppHeader } from "./messages-app-header";
import { BrandEmblem } from "./brand-emblem";
import { EducationHeaderSearch } from "./education-header-search";
import { AskAssistantChromeProvider } from "@/components/messages/ask-globee-chrome";
import { cn } from "@/lib/cn";
import type { AppShellChrome } from "@/lib/app-shell-chrome";
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
import {
  APP_HEADER_LEADING_CLASS,
  APP_HEADER_TRAILING_CLUSTER_CLASS,
  APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS,
  APP_HEADER_WORKSPACE_PILL_HOST_CLASS,
} from "@/lib/workspace-switcher";
import { HOUSE_PAGE_CANVAS_CLASS, HOUSE_RAIL_PANEL_CLASS } from "@/lib/house-shell";
import { PRODUCT_NAME } from "@/lib/product";
import { isSettingsPath, SETTINGS_RAIL_PAD_CLASS } from "@/lib/settings";
import {
  SOCIAL_DESKTOP_FRAME_PAD_CLASS,
  SOCIAL_RAIL_MAIN_OFFSET_CLASS,
  SOCIAL_RAIL_PANEL_CLASS,
  SOCIAL_RAIL_WIDTH_CLASS,
  SOCIAL_TAB_BAR_MAIN_PAD_CLASS,
} from "@/lib/social-chrome";
import { resolveWorkspaceMode, workspaceHome, type WorkspaceMode } from "@/lib/workspace";
import { SocialMobileTabBar } from "@/components/social/social-mobile-tab-bar";
import { SocialRailAccountChip } from "@/components/social/social-rail-extras";
import { SocialTopBar } from "@/components/social/social-top-bar";

type Org = { id: string; name: string };

// Shell composition ported from watershedportal, rethemed to GC tokens. Fixed sidebar +
// sticky header + centered content frame. The sidebar collapses to an icon-only rail; the
// state persists in a cookie (read by the (app) layout → `defaultCollapsed`, so there's no
// flash) and, when collapsed, overrides `--sidebar-width` so the header + main follow.
// Phone: the rail is gone (hidden + width tokens collapse). A header hamburger opens a
// bottom sheet — client destinations, or those plus staff destinations when
// isGcStaff. Desktop 1:2 rail is unchanged.
// /settings paths: the Access destinations leave. One 220 rail (pad 16)
// occupies that slot — Settings title + You / Social / Education /
// Aggregation. Not a second column. Collapse stays off. Phone list is
// the same sections; pushed panes back to Settings. Hamburger stays
// off. Avatar 32 stays.
export function AppShell({
  chrome,
  email = "",
  name,
  photoUrl,
  messagesUnread,
  isGcStaff = false,
  defaultCollapsed = false,
  messagesSurface = "staff-inbox",
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
  // The catalog opts out of the centered width cap so its hero can bleed full-width
  // (edge of sidebar → right edge). That page then manages its own content max-width.
  // Non-bleed pages share `--content-inset`. Titles stay the bleed exception.
  const titlesBleed = pathname === "/titles";
  const homePage = pathname === "/" || pathname === "/dashboard";
  const messagesPage = pathname === "/messages";
  const settingsPage = isSettingsPath(pathname);
  const socialChrome = workspace === "social" && !settingsPage;

  useEffect(() => {
    migrateSidebarCollapsedCookie(collapsed);
  }, [collapsed]);

  if (socialChrome) {
    return (
      <AskAssistantChromeProvider>
        {cookieSync}
        <div className={cn("min-h-dvh", HOUSE_PAGE_CANVAS_CLASS)} data-social-workspace="">
          <SocialTopBarSlot chrome={chrome} email={email} name={name} photoUrl={photoUrl} />
          <aside
            className={cn(
              "fixed left-4 top-[calc(var(--header-height)+16px)] z-30 hidden h-[calc(100dvh-var(--header-height)-32px)] flex-col md:flex",
              SOCIAL_RAIL_WIDTH_CLASS,
              SOCIAL_RAIL_PANEL_CLASS,
            )}
            data-app-rail=""
            data-social-rail=""
          >
            <div className="flex h-full flex-col gap-3 p-4">
              <div className="min-h-0 overflow-y-auto">
                <SideNav
                  messagesUnread={messagesUnread}
                  isGcStaff={false}
                  collapsed={false}
                  workspace="social"
                />
              </div>
              <div className="min-h-0 flex-1" />
              <SocialRailAccountChipSlot chrome={chrome} name={name} photoUrl={photoUrl} />
            </div>
          </aside>
          <main
            className={cn("min-h-[calc(100dvh-var(--header-height))]", SOCIAL_RAIL_MAIN_OFFSET_CLASS)}
            data-app-social-frame=""
          >
            <div className={cn(SOCIAL_DESKTOP_FRAME_PAD_CLASS, SOCIAL_TAB_BAR_MAIN_PAD_CLASS)}>{children}</div>
          </main>
          <SocialMobileTabBar />
        </div>
      </AskAssistantChromeProvider>
    );
  }

  const toggle = () => {
    collapseTouched.current = true;
    setCollapsed((c) => {
      const next = !c;
      persistSidebarCollapsed(next);
      return next;
    });
  };

  return (
    <AskAssistantChromeProvider>
    {cookieSync}
    <div
      className={cn("min-h-dvh", HOUSE_PAGE_CANVAS_CLASS)}
      data-education-workspace={workspace === "education" ? "" : undefined}
      style={
        collapsed && !settingsPage
          ? ({ "--sidebar-width": "var(--sidebar-width-collapsed)" } as React.CSSProperties)
          : undefined
      }
    >
      <aside
        className={cn(
          "fixed left-4 top-[calc(var(--header-height)+16px)] z-30 hidden h-[calc(100dvh-var(--header-height)-32px)] w-[calc(var(--sidebar-width)-16px)] flex-col md:flex",
          HOUSE_RAIL_PANEL_CLASS,
        )}
        data-app-rail=""
        data-settings-rail={settingsPage ? "" : undefined}
      >
        {settingsPage || collapsed ? null : (
          <div className="flex justify-end px-2 pt-1">
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
          </div>
        )}
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
            <SideNavSlot
              chrome={chrome}
              messagesUnread={messagesUnread}
              isGcStaff={isGcStaff}
              collapsed={collapsed}
              workspace={workspace}
            />
          )}
        </div>
      </aside>

      {/* Full-width top + dest side nav — same chrome as Social.
          Access phone header is hamburger · gap 8 · one workspace
          pill left, avatar alone right. Do not center the pill. Do
          not cluster it with the avatar. Desktop keeps the trailing
          switcher + avatar cluster. Brand sits on the full-width
          top, not a second rail chrome. Period stays on the
          Dashboard org row. No org switcher on any route.
          Aggregation has no top search. Education mounts a quiet
          course/video search. Social keeps its live search. Search
          also mounts on the Access `/messages` gate, and on mobile
          `/titles` (528:542). Phone avatar opens 544:561. Hamburger
          stays the nav sheet. Do not invent Move chrome or a
          second phone switcher. Studio secondary rail stays HOLD. */}
      <header
        className={cn(
          "sticky top-0 z-40 flex items-center justify-end gap-4 border-b border-hairline bg-surface/85 backdrop-blur",
          MOBILE_CHROME_LEAD_PAD_CLASS,
          "md:px-[var(--content-inset)]",
        )}
        data-app-header=""
        data-house-full-width-top=""
        style={{ height: "var(--header-height)" }}
      >
        <div data-app-header-leading="" className={APP_HEADER_LEADING_CLASS}>
          {settingsPage ? (
            <SettingsHeaderBack />
          ) : (
            <MobileNavSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />
          )}
          <Link
            href={workspaceHome(workspace)}
            aria-label={PRODUCT_NAME}
            data-brand-emblem=""
            className="hidden shrink-0 items-center md:inline-flex"
          >
            <BrandEmblem />
          </Link>
          <div
            data-app-header-workspace-pill=""
            className={APP_HEADER_WORKSPACE_PILL_HOST_CLASS}
          >
            <WorkspaceSwitcher current={workspace} tone="pill" />
          </div>
          {workspace === "education" && !settingsPage ? (
            <Suspense fallback={null}>
              <EducationHeaderSearch />
            </Suspense>
          ) : null}
          {messagesPage ? (
            <MessagesHeaderSlot chrome={chrome} messagesSurface={messagesSurface} />
          ) : null}
        </div>
        <div data-app-header-trailing="" className={APP_HEADER_TRAILING_CLUSTER_CLASS}>
          <div
            data-app-header-workspace-desktop=""
            className={APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS}
          >
            <WorkspaceSwitcher current={workspace} />
          </div>
          <AccountMenuSlot
            chrome={chrome}
            email={email}
            name={name}
            photoUrl={photoUrl}
          />
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
            className="w-full px-[var(--content-inset)] py-[var(--space-8)] max-md:px-[var(--space-6)] max-md:py-[var(--space-6)]"
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
    </div>
    </AskAssistantChromeProvider>
  );
}

function SocialTopBarSlot({
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
  if (!chrome) return <SocialTopBar email={email} name={name} photoUrl={photoUrl} />;
  return (
    <Suspense fallback={<SocialTopBar email={email} name={name} photoUrl={photoUrl} />}>
      <SocialTopBarFromChrome chrome={chrome} />
    </Suspense>
  );
}

function SocialTopBarFromChrome({ chrome }: { chrome: Promise<AppShellChrome> }) {
  const data = use(chrome);
  return <SocialTopBar email={data.email} name={data.name} photoUrl={data.photoUrl} />;
}

function SocialRailAccountChipSlot({
  chrome,
  name,
  photoUrl,
}: {
  chrome?: Promise<AppShellChrome>;
  name?: string | null;
  photoUrl?: string | null;
}) {
  if (!chrome) return <SocialRailAccountChip name={name} photoUrl={photoUrl} />;
  return (
    <Suspense fallback={<SocialRailAccountChip name={name} photoUrl={photoUrl} />}>
      <SocialRailAccountChipFromChrome chrome={chrome} />
    </Suspense>
  );
}

function SocialRailAccountChipFromChrome({ chrome }: { chrome: Promise<AppShellChrome> }) {
  const data = use(chrome);
  return <SocialRailAccountChip name={data.name} photoUrl={data.photoUrl} />;
}

function MessagesHeaderSlot({
  chrome,
  messagesSurface,
}: {
  chrome?: Promise<AppShellChrome>;
  messagesSurface: MessagesSurface;
}) {
  if (!chrome) return <MessagesAppHeader surface={messagesSurface} />;
  return (
    <Suspense fallback={<MessagesAppHeader surface={messagesSurface} />}>
      <MessagesHeaderFromChrome chrome={chrome} />
    </Suspense>
  );
}

function MessagesHeaderFromChrome({ chrome }: { chrome: Promise<AppShellChrome> }) {
  const data = use(chrome);
  return <MessagesAppHeader surface={data.messagesSurface} />;
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
  messagesUnread,
  isGcStaff,
  collapsed,
  workspace,
}: {
  chrome?: Promise<AppShellChrome>;
  messagesUnread: Promise<number>;
  isGcStaff: boolean;
  collapsed: boolean;
  workspace: WorkspaceMode;
}) {
  if (!chrome) {
    return (
      <SideNav
        messagesUnread={messagesUnread}
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
          messagesUnread={messagesUnread}
          isGcStaff={isGcStaff}
          collapsed={collapsed}
          workspace={workspace}
        />
      }
    >
      <SideNavFromChrome
        chrome={chrome}
        messagesUnread={messagesUnread}
        collapsed={collapsed}
        workspace={workspace}
      />
    </Suspense>
  );
}

function SideNavFromChrome({
  chrome,
  messagesUnread,
  collapsed,
  workspace,
}: {
  chrome: Promise<AppShellChrome>;
  messagesUnread: Promise<number>;
  collapsed: boolean;
  workspace: WorkspaceMode;
}) {
  const data = use(chrome);
  return (
    <SideNav
      messagesUnread={messagesUnread}
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
