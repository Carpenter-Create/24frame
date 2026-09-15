"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CaretDoubleLeft, CaretDoubleRight } from "@phosphor-icons/react";

import { UserMenu } from "./user-menu";
import { SideNav } from "./side-nav";
import { SettingsRail } from "./settings-rail";
import { SettingsHeaderBack } from "./settings-header-back";
import { MobileNav } from "./mobile-nav";
import { MessagesAppHeader } from "./messages-app-header";
import { BrandEmblem } from "./brand-emblem";
import { TitlesHeaderSearch } from "@/components/titles/titles-header-search";
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
// occupies that slot — ← Home / Profile / Agreements / Refer a
// friend. Not a second column. Collapse stays off. Phone left slot is
// the same ← Home (623:785). Hamburger stays off. Avatar 32 stays.
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
  const pathname = usePathname();
  const workspace = resolveWorkspaceMode(pathname, workspaceCookie);
  const applyChromeCookies = useCallback(
    (next: { defaultCollapsed: boolean; defaultWorkspace: WorkspaceMode }) => {
      setCollapsed(next.defaultCollapsed);
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
  const homePage = pathname === "/";
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
        <div className="min-h-dvh bg-bg" data-social-workspace="">
          <SocialTopBarSlot chrome={chrome} email={email} name={name} photoUrl={photoUrl} />
          <aside
            className={cn(
              "fixed left-0 top-[calc(var(--header-height)+16px)] z-30 hidden h-[calc(100dvh-var(--header-height)-32px)] flex-col md:flex",
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
          <Link
            href={workspaceHome(workspace)}
            aria-label={PRODUCT_NAME}
            data-brand-emblem=""
            className={cn(
              "inline-flex shrink-0 items-center",
              settingsPage || collapsed ? undefined : "min-w-0 flex-1",
            )}
          >
            <BrandEmblem />
          </Link>
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

      {/* Access header is avatar / account menu only — no org switcher on any route.
          Workspace switcher lives in the account menu, above Profile.
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
          {settingsPage ? (
            <SettingsHeaderBack />
          ) : (
            <MobileNavSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />
          )}
          {messagesPage ? (
            <MessagesHeaderSlot chrome={chrome} messagesSurface={messagesSurface} />
          ) : null}
          {titlesBleed ? <TitlesHeaderSearch /> : null}
        </div>
        <div className="flex items-center gap-3">
          <AccountMenuSlot
            chrome={chrome}
            email={email}
            name={name}
            photoUrl={photoUrl}
            defaultWorkspace={defaultWorkspace}
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
  defaultWorkspace,
}: {
  chrome?: Promise<AppShellChrome>;
  email: string;
  name?: string | null;
  photoUrl?: string | null;
  defaultWorkspace: WorkspaceMode;
}) {
  if (!chrome) {
    return <UserMenu email={email} name={name} photoUrl={photoUrl} defaultWorkspace={defaultWorkspace} />;
  }
  return (
    <Suspense
      fallback={<UserMenu email={email} name={name} photoUrl={photoUrl} defaultWorkspace={defaultWorkspace} />}
    >
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
  return (
    <UserMenu
      email={data.email}
      name={data.name}
      photoUrl={data.photoUrl}
      defaultWorkspace={data.defaultWorkspace}
    />
  );
}

function ChromeCookieSync({
  chrome,
  onCookies,
}: {
  chrome: Promise<AppShellChrome>;
  onCookies: (next: { defaultCollapsed: boolean; defaultWorkspace: WorkspaceMode }) => void;
}) {
  const data = use(chrome);
  const applied = useRef(false);
  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
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
