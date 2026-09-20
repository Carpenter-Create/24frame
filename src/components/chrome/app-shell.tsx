"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { UserMenu } from "./user-menu";
import { SideNav } from "./side-nav";
import { SettingsRail } from "./settings-rail";
import { HouseLeadChrome } from "./house-lead-chrome";
import { HouseLeadSearch } from "./house-lead-search";
import { RailCollapse } from "./rail-collapse";
import { AskAssistantChromeProvider } from "@/components/messages/ask-globee-chrome";
import { AskAiOverlayProvider } from "./ask-ai-overlay";
import { cn } from "@/lib/cn";
import { isAccountChromeNoRailPath } from "@/lib/account-chrome";
import { isActivityPath, type ActivityItem } from "@/lib/activity";
import type { AppShellChrome } from "@/lib/app-shell-chrome";
import type { MessagesSurface } from "@/lib/ask-globee";
import {
  RAIL_COLLAPSE_WIDTH_VAR,
  RAIL_WIDTH_CLASS,
  migrateSidebarCollapsedCookie,
  persistSidebarCollapsed,
} from "@/lib/rail-collapse";
import { HOUSE_LEAD_SCROLL_CLASS } from "@/lib/house-lead-chrome";
import {
  HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS,
  housePhoneShowsBottomDests,
} from "@/lib/house-phone-shell";
import {
  HOUSE_CANVAS_X_CLASS,
  HOUSE_HOME_RAIL_COLUMN_CLASS,
  HOUSE_RAIL_FLOAT_CLASS,
  HOUSE_RAIL_PANEL_CLASS,
} from "@/lib/house-shell";
import { isHelpPath } from "@/lib/help";
import { isSettingsPath, SETTINGS_RAIL_PAD_CLASS } from "@/lib/settings";
import {
  SOCIAL_DESKTOP_FRAME_PAD_CLASS,
  SOCIAL_RAIL_MAIN_OFFSET_CLASS,
  SOCIAL_RAIL_PANEL_CLASS,
  SOCIAL_RAIL_WIDTH_CLASS,
} from "@/lib/social-chrome";
import { isCoProductionsPath } from "@/lib/co-productions";
import { isHomeOwnedPath, OVERVIEW_RAIL_OFF_WIDTH, overviewHidesRail } from "@/lib/overview";
import { QUEUE_HREF } from "@/lib/queue";
import { TITLES_HREF } from "@/lib/title-public-id";
import { clampWorkspaceMode, resolveWorkspaceMode, type WorkspaceMode } from "@/lib/workspace";
import { HousePhoneAppShell } from "./house-phone-app-shell";
import {
  rememberAccountChromeIdentity,
  stickyAccountChromeIdentity,
  type AccountChromeIdentity,
} from "@/lib/account-chrome-identity";

type Org = { id: string; name: string };

// Shell composition ported from watershedportal, rethemed to GC tokens. Fixed sidebar +
// viewport-pinned lead chrome + centered content frame. Page scroll lives
// on main — not on a wrapper that includes the header (G9). The sidebar collapses to an icon-only rail; the
// state persists in a cookie (read by the (app) layout → `defaultCollapsed`, so there's no
// flash) and, when collapsed, overrides `--sidebar-width` so the header + main follow.
// Phone: the rail is gone (hidden + width tokens collapse). Local dests
// live in HousePhoneBottomNav — client dests on Aggregation, operator
// dests on Staff. Workspace switch is the header sheet. No hamburger.
// One return tree — Social is a flag, not a second shell. Workspace
// hops keep chrome mounted so the sheet and dock do not freeze.
// Desktop 1:2 rail is unchanged.
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
  const [workspaceCookie, setWorkspaceCookie] = useState(() =>
    clampWorkspaceMode(defaultWorkspace, isGcStaff),
  );
  const [identity, setIdentity] = useState(() =>
    stickyAccountChromeIdentity({ email, name, photoUrl }),
  );
  const cookiesApplied = useRef(false);
  const collapseTouched = useRef(false);
  const pathname = usePathname();
  const workspace = resolveWorkspaceMode(
    pathname,
    clampWorkspaceMode(workspaceCookie, isGcStaff),
  );
  const applyChromeCookies = useCallback(
    (next: {
      defaultCollapsed: boolean;
      defaultWorkspace: WorkspaceMode;
      isGcStaff: boolean;
    }) => {
      if (cookiesApplied.current) return;
      cookiesApplied.current = true;
      if (!collapseTouched.current) {
        setCollapsed(next.defaultCollapsed);
      }
      setWorkspaceCookie(clampWorkspaceMode(next.defaultWorkspace, next.isGcStaff));
    },
    [],
  );
  const applyChromeIdentity = useCallback((next: AccountChromeIdentity) => {
    setIdentity(rememberAccountChromeIdentity(next));
  }, []);
  const cookieSync =
    chrome ? (
      <Suspense fallback={null}>
        <ChromeCookieSync
          chrome={chrome}
          onCookies={applyChromeCookies}
          onIdentity={applyChromeIdentity}
        />
      </Suspense>
    ) : null;
  // Catalog list pages opt out of the centered width cap so the shared
  // Titles frame can own content max-width (edge of sidebar → right edge).
  // Titles and staff Queue share that frame. Non-bleed pages share
  // `--chrome-gutter` on the canvas x so the trailing chrome and content
  // column share one right edge. Messages keeps `--content-inset` vertical.
  const titlesBleed = pathname === TITLES_HREF || pathname === QUEUE_HREF;
  const homeChrome = overviewHidesRail(pathname);
  // Home (`/` + /home chrome) stays off --page-max-width. /home uses the
  // 48/16 house inset (HOME-width-lock.md). Aggregation Dashboard uses
  // the Education house measure — Adam 2026-09-18.
  const homePage = pathname === "/" || homeChrome;
  const settingsPage = isSettingsPath(pathname);
  const helpPage = isHelpPath(pathname);
  const activityPage = isActivityPath(pathname);
  // Adam lock 2026-09-20: Get Help and Activity share one no-rail
  // account chrome — header + content column only. No Aggregation
  // rail, no Settings rail, no twin. Settings keeps its own 220
  // rail. Home / Co-Productions still hide via overviewHidesRail.
  const accountChromeNoRail = isAccountChromeNoRailPath(pathname);
  const hideProductRail = homeChrome || accountChromeNoRail;
  const socialChrome = workspace === "social" && !settingsPage && !hideProductRail;
  const homeOwned = isHomeOwnedPath(pathname);
  const coProductions = isCoProductionsPath(pathname);
  const accountChrome = settingsPage || helpPage || activityPage;
  const phoneDestDock = housePhoneShowsBottomDests({
    workspace,
    homeOwned,
    accountChrome,
    coProductions,
  });
  const phoneDestPad = phoneDestDock ? HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS : undefined;

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

  const collapseWidthStyle = hideProductRail
    ? ({
        "--sidebar-width": OVERVIEW_RAIL_OFF_WIDTH,
        "--sidebar-width-collapsed": OVERVIEW_RAIL_OFF_WIDTH,
      } as React.CSSProperties)
    : collapsed && !settingsPage
      ? ({ "--sidebar-width": RAIL_COLLAPSE_WIDTH_VAR } as React.CSSProperties)
      : undefined;

  return (
    <AskAiOverlayProvider>
    <AskAssistantChromeProvider>
    {cookieSync}
    <HousePhoneAppShell
      chrome={chrome}
      workspace={workspace}
      isGcStaff={socialChrome ? false : isGcStaff}
      homeOwned={socialChrome ? false : homeOwned}
      accountChrome={accountChrome}
      coProductions={coProductions}
      data-social-workspace={socialChrome ? "" : undefined}
      data-education-workspace={workspace === "education" && !helpPage && !activityPage ? "" : undefined}
      data-home-chrome={homeChrome ? "" : undefined}
      data-help-chrome={helpPage ? "" : undefined}
      data-activity-chrome={activityPage ? "" : undefined}
      style={collapseWidthStyle}
    >
      {hideProductRail ? null : (
        <aside
          className={cn(
            HOUSE_RAIL_FLOAT_CLASS,
            socialChrome
              ? collapsed
                ? RAIL_WIDTH_CLASS
                : SOCIAL_RAIL_WIDTH_CLASS
              : RAIL_WIDTH_CLASS,
            socialChrome ? SOCIAL_RAIL_PANEL_CLASS : HOUSE_RAIL_PANEL_CLASS,
          )}
          data-app-rail=""
          data-social-rail={socialChrome ? "" : undefined}
          data-settings-rail={settingsPage ? "" : undefined}
        >
          {settingsPage ? null : <RailCollapse collapsed={collapsed} onToggle={toggle} />}
          <div
            className={cn(
              socialChrome
                ? cn("flex min-h-0 flex-1 flex-col overflow-y-auto", collapsed ? "gap-2 px-1 pb-2" : "gap-3 p-4")
                : cn("flex-1 overflow-y-auto", settingsPage ? SETTINGS_RAIL_PAD_CLASS : "pt-1"),
            )}
          >
            {settingsPage ? (
              <SettingsRail />
            ) : (
              <SideNavSlot
                chrome={chrome}
                isGcStaff={socialChrome ? false : isGcStaff}
                collapsed={collapsed}
                workspace={socialChrome ? "social" : workspace}
              />
            )}
          </div>
        </aside>
      )}

      {/* Full-width top + dest side nav — same HouseLeadChrome as Social.
          Phone IA A: Asset 8 emblem on every workspace + workspace
          word+chevron. Tap opens the workspace sheet. No hamburger.
          Local dests live in HousePhoneBottomNav. Home dests are Home
          + Industry news. Trailing is search (if needed) · theme ·
          24Frame AI · bell · avatar. Sun/moon is shared immediately
          left of Ask on every breakpoint. One trail. No phone-only
          sun/moon twin. Ask AI is header + Home module only
          (#465). Emblem links workspace
          home; it does not open the rail. Desktop keeps switcher ·
          theme · Ask · bell · avatar. Brand sits on the full-width top, not a
          second rail chrome. Period stays on the Dashboard org row.
          No org switcher on any route. Aggregation mid-lead stays
          empty. Education mounts a quiet course/video search
          immediately right of the logo on desktop, same
          Facebook-compact slot as Social live search. Phone
          Education search sits in a full-width row under the header —
          not in the top nav. Search also mounts on the Access
          leftover `/messages` path (retired — 404), and on mobile `/titles` (528:542).
          Phone avatar opens 544:561. Do not invent Move chrome or a
          second phone switcher. Studio secondary rail stays HOLD. */}
      <HouseLeadChromeSlot
        chrome={chrome}
        isGcStaff={isGcStaff}
        workspace={workspace}
        settingsPage={settingsPage || helpPage || activityPage}
        logoVisible="always"
        search={
          socialChrome ? (
            <HouseLeadSearch tone="live" />
          ) : workspace === "education" && !settingsPage && !helpPage && !activityPage ? (
            <Suspense fallback={null}>
              <HouseLeadSearch tone="quiet" />
            </Suspense>
          ) : undefined
        }
        trailingSearch={
          socialChrome ? <HouseLeadSearch tone="live" presentation="icon" /> : undefined
        }
        underNav={
          socialChrome
            ? undefined
            : workspace === "education" && !settingsPage && !helpPage && !activityPage ? (
            <Suspense fallback={null}>
              <HouseLeadSearch tone="quiet" inputId="education-header-q-phone" />
            </Suspense>
          ) : undefined
        }
        activityUnread={messagesUnread}
        activityItems={activityItems}
        accountMenu={
          <AccountMenuSlot
            chrome={chrome}
            email={identity.email}
            name={identity.name}
            photoUrl={identity.photoUrl}
          />
        }
      />

      <main
        className={cn(
          HOUSE_LEAD_SCROLL_CLASS,
          phoneDestPad,
          socialChrome && !collapsed ? SOCIAL_RAIL_MAIN_OFFSET_CLASS : undefined,
        )}
        data-app-social-frame={socialChrome ? "" : undefined}
        data-house-lead-scroll=""
        style={
          socialChrome && !collapsed
            ? undefined
            : { marginLeft: "var(--sidebar-width)" }
        }
      >
        {socialChrome ? (
          <div className={SOCIAL_DESKTOP_FRAME_PAD_CLASS}>{children}</div>
        ) : titlesBleed ? (
          <div className="w-full pb-24 max-md:pb-0">{children}</div>
        ) : homePage ? (
          <div
            className={cn(
              "py-[var(--space-8)] max-md:px-[var(--space-6)] max-md:pb-0 max-md:pt-[var(--space-6)]",
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
            className={cn("mx-auto w-full pb-24 pt-8 max-md:pb-0", HOUSE_CANVAS_X_CLASS)}
            style={{ maxWidth: "var(--page-max-width)" }}
          >
            {children}
          </div>
        )}
      </main>
    </HousePhoneAppShell>
    </AskAssistantChromeProvider>
    </AskAiOverlayProvider>
  );
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
  const face = stickyAccountChromeIdentity({ email, name, photoUrl });
  if (!chrome) {
    return <UserMenu email={face.email} name={face.name} photoUrl={face.photoUrl} />;
  }
  return (
    <Suspense fallback={<UserMenu email={face.email} name={face.name} photoUrl={face.photoUrl} />}>
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
  rememberAccountChromeIdentity({
    email: data.email,
    name: data.name,
    photoUrl: data.photoUrl,
  });
  return <UserMenu email={data.email} name={data.name} photoUrl={data.photoUrl} />;
}

function ChromeCookieSync({
  chrome,
  onCookies,
  onIdentity,
}: {
  chrome: Promise<AppShellChrome>;
  onCookies: (next: {
    defaultCollapsed: boolean;
    defaultWorkspace: WorkspaceMode;
    isGcStaff: boolean;
  }) => void;
  onIdentity: (next: AccountChromeIdentity) => void;
}) {
  const data = use(chrome);
  useEffect(() => {
    onCookies({
      defaultCollapsed: data.defaultCollapsed,
      defaultWorkspace: data.defaultWorkspace,
      isGcStaff: data.isGcStaff,
    });
    onIdentity({
      email: data.email,
      name: data.name,
      photoUrl: data.photoUrl,
    });
  }, [
    data.defaultCollapsed,
    data.defaultWorkspace,
    data.isGcStaff,
    data.email,
    data.name,
    data.photoUrl,
    onCookies,
    onIdentity,
  ]);
  return null;
}

function HouseLeadChromeSlot({
  chrome,
  isGcStaff,
  ...props
}: {
  chrome?: Promise<AppShellChrome>;
  isGcStaff: boolean;
  workspace: WorkspaceMode;
  settingsPage?: boolean;
  logoVisible?: "always" | "desktop";
  search?: React.ReactNode;
  underNav?: React.ReactNode;
  trailingSearch?: React.ReactNode;
  activityUnread?: Promise<number> | number;
  activityItems?: Promise<ActivityItem[]> | ActivityItem[];
  accountMenu: React.ReactNode;
}) {
  if (!chrome) {
    return (
      <HouseLeadChrome
        isGcStaff={isGcStaff}
        {...props}
        workspace={clampWorkspaceMode(props.workspace, isGcStaff)}
      />
    );
  }
  return (
    <Suspense
      fallback={
        <HouseLeadChrome
          isGcStaff={isGcStaff}
          {...props}
          workspace={clampWorkspaceMode(props.workspace, isGcStaff)}
        />
      }
    >
      <HouseLeadChromeFromChrome chrome={chrome} {...props} />
    </Suspense>
  );
}

function HouseLeadChromeFromChrome({
  chrome,
  ...props
}: {
  chrome: Promise<AppShellChrome>;
  workspace: WorkspaceMode;
  settingsPage?: boolean;
  logoVisible?: "always" | "desktop";
  search?: React.ReactNode;
  underNav?: React.ReactNode;
  trailingSearch?: React.ReactNode;
  activityUnread?: Promise<number> | number;
  activityItems?: Promise<ActivityItem[]> | ActivityItem[];
  accountMenu: React.ReactNode;
}) {
  const data = use(chrome);
  return (
    <HouseLeadChrome
      isGcStaff={data.isGcStaff}
      {...props}
      workspace={clampWorkspaceMode(props.workspace, data.isGcStaff)}
    />
  );
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
        workspace={clampWorkspaceMode(workspace, isGcStaff)}
      />
    );
  }
  return (
    <Suspense
      fallback={
        <SideNav
          isGcStaff={isGcStaff}
          collapsed={collapsed}
          workspace={clampWorkspaceMode(workspace, isGcStaff)}
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
      workspace={clampWorkspaceMode(workspace, data.isGcStaff)}
    />
  );
}

