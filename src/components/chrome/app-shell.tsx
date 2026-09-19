"use client";

import { Suspense, use, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { UserMenu } from "./user-menu";
import { SideNav } from "./side-nav";
import { SettingsRail } from "./settings-rail";
import { SettingsHeaderBack } from "./settings-header-back";
import { HouseLeadChrome } from "./house-lead-chrome";
import { HouseLeadSearch } from "./house-lead-search";
import { HousePhoneDestChips } from "./house-phone-dest-chips";
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
import { HOUSE_LEAD_SCROLL_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS } from "@/lib/house-phone-shell";
import {
  HOUSE_CANVAS_X_CLASS,
  HOUSE_HOME_RAIL_COLUMN_CLASS,
  HOUSE_RAIL_FLOAT_CLASS,
  HOUSE_RAIL_PANEL_CLASS,
} from "@/lib/house-shell";
import { isSettingsPath, SETTINGS_RAIL_PAD_CLASS } from "@/lib/settings";
import {
  SOCIAL_DESKTOP_FRAME_PAD_CLASS,
  SOCIAL_RAIL_MAIN_OFFSET_CLASS,
  SOCIAL_RAIL_PANEL_CLASS,
  SOCIAL_RAIL_WIDTH_CLASS,
} from "@/lib/social-chrome";
import { OVERVIEW_RAIL_OFF_WIDTH, overviewHidesRail } from "@/lib/overview";
import { QUEUE_HREF } from "@/lib/queue";
import { TITLES_HREF } from "@/lib/title-public-id";
import { resolveWorkspaceMode, type WorkspaceMode } from "@/lib/workspace";
import { HousePhoneAppShell } from "./house-phone-app-shell";
import {
  rememberAccountChromeIdentity,
  stickyAccountChromeIdentity,
  type AccountChromeIdentity,
} from "@/lib/account-chrome-identity";
import { SocialRailAccountChip } from "@/components/social/social-rail-extras";

type Org = { id: string; name: string };

// Shell composition ported from watershedportal, rethemed to GC tokens. Fixed sidebar +
// viewport-pinned lead chrome + centered content frame. Page scroll lives
// on main — not on a wrapper that includes the header (G9). The sidebar collapses to an icon-only rail; the
// state persists in a cookie (read by the (app) layout → `defaultCollapsed`, so there's no
// flash) and, when collapsed, overrides `--sidebar-width` so the header + main follow.
// Phone: the rail is gone (hidden + width tokens collapse). Local dests
// that used to live in the hamburger live on HousePhoneDestChips under
// the top — client dests, or those plus staff dests when isGcStaff. No
// hamburger. Desktop 1:2 rail is unchanged.
// Social mounts the same RailCollapse + cookie + width-var path as
// Aggregation · Education. Do not pin Social expanded or invent a
// Social-only chevron. /settings paths: the Access destinations leave.
// One 220 rail (pad 16) occupies that slot — Settings title + Profile /
// Organization / Preferences. Not a second column. Collapse stays
// off. Phone list is the same sections. Hub Home stays in this header.
// Pushed panes inherit the blue Settings back from settings/layout.
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
  const [identity, setIdentity] = useState(() =>
    stickyAccountChromeIdentity({ email, name, photoUrl }),
  );
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
        <HousePhoneAppShell
          workspace="social"
          data-social-workspace=""
          style={collapseWidthStyle}
        >
          <HouseLeadChrome
            workspace="social"
            logoVisible="always"
            destChips={<HousePhoneDestChips workspace="social" />}
            search={<HouseLeadSearch tone="live" />}
            trailingSearch={<HouseLeadSearch tone="live" presentation="icon" />}
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
                name={identity.name}
                photoUrl={identity.photoUrl}
                collapsed={collapsed}
              />
            </div>
          </aside>
          <main
            className={cn(
              HOUSE_LEAD_SCROLL_CLASS,
              HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS,
              collapsed ? undefined : SOCIAL_RAIL_MAIN_OFFSET_CLASS,
            )}
            style={collapsed ? { marginLeft: "var(--sidebar-width)" } : undefined}
            data-app-social-frame=""
            data-house-lead-scroll=""
          >
            <div className={SOCIAL_DESKTOP_FRAME_PAD_CLASS}>
              {children}
            </div>
          </main>
        </HousePhoneAppShell>
      </AskAssistantChromeProvider>
      </AskAiOverlayProvider>
    );
  }

  return (
    <AskAiOverlayProvider>
    <AskAssistantChromeProvider>
    {cookieSync}
    <HousePhoneAppShell
      workspace={workspace}
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
          Phone (Adam 2026-09-18 dest-chip amend): Asset 8 emblem on every workspace.
          Emblem owns the left alone. No hamburger.
          Local dests that used to live in the Agg/Edu hamburger live
          on HousePhoneDestChips under the top. Home has no dest chip
          row. Phone top has no workspace pill.
          HousePhoneBottomNav switches Home · Social · Aggregation ·
          Education. Trailing is search (if needed) · 24Frame AI ·
          bell · avatar. Theme stays desktop-only. Ask AI is header
          + Home module only (#465). Emblem links workspace
          home; it does not open the rail. Desktop keeps Ask · theme ·
          switcher + avatar. Brand sits on the full-width top, not a
          second rail chrome. Period stays on the Dashboard org row.
          No org switcher on any route. Aggregation mid-lead stays
          empty. Education mounts a quiet course/video search
          immediately right of the logo on desktop, same
          Facebook-compact slot as Social live search. Phone
          Education search sits in a full-width row under the dest
          chips — not in the top nav. Search also mounts on the Access
          leftover `/messages` path (retired — 404), and on mobile `/titles` (528:542).
          Phone avatar opens 544:561. Do not invent Move chrome or a
          second phone switcher. Studio secondary rail stays HOLD. */}
      <HouseLeadChrome
        workspace={workspace}
        settingsPage={settingsPage}
        logoVisible="always"
        leadingNav={settingsPage ? <SettingsHeaderBack when="hub" /> : undefined}
        destChips={
          settingsPage || homeChrome ? undefined : (
            <DestChipsSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />
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
          <AccountMenuSlot
            chrome={chrome}
            email={identity.email}
            name={identity.name}
            photoUrl={identity.photoUrl}
          />
        }
      />

      <main
        className={cn(HOUSE_LEAD_SCROLL_CLASS, HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS)}
        data-house-lead-scroll=""
        style={{
          marginLeft: "var(--sidebar-width)",
        }}
      >
        {titlesBleed ? (
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
  const face = stickyAccountChromeIdentity({ name, photoUrl });
  if (!chrome) {
    return <SocialRailAccountChip name={face.name} photoUrl={face.photoUrl} collapsed={collapsed} />;
  }
  return (
    <Suspense
      fallback={<SocialRailAccountChip name={face.name} photoUrl={face.photoUrl} collapsed={collapsed} />}
    >
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
  rememberAccountChromeIdentity({
    email: data.email,
    name: data.name,
    photoUrl: data.photoUrl,
  });
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
  onCookies: (next: { defaultCollapsed: boolean; defaultWorkspace: WorkspaceMode }) => void;
  onIdentity: (next: AccountChromeIdentity) => void;
}) {
  const data = use(chrome);
  useEffect(() => {
    onCookies({
      defaultCollapsed: data.defaultCollapsed,
      defaultWorkspace: data.defaultWorkspace,
    });
    onIdentity({
      email: data.email,
      name: data.name,
      photoUrl: data.photoUrl,
    });
  }, [
    data.defaultCollapsed,
    data.defaultWorkspace,
    data.email,
    data.name,
    data.photoUrl,
    onCookies,
    onIdentity,
  ]);
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

function DestChipsSlot({
  chrome,
  isGcStaff,
  workspace,
}: {
  chrome?: Promise<AppShellChrome>;
  isGcStaff: boolean;
  workspace: WorkspaceMode;
}) {
  if (!chrome) return <HousePhoneDestChips isGcStaff={isGcStaff} workspace={workspace} />;
  return (
    <Suspense fallback={<HousePhoneDestChips isGcStaff={isGcStaff} workspace={workspace} />}>
      <DestChipsFromChrome chrome={chrome} workspace={workspace} />
    </Suspense>
  );
}

function DestChipsFromChrome({
  chrome,
  workspace,
}: {
  chrome: Promise<AppShellChrome>;
  workspace: WorkspaceMode;
}) {
  const data = use(chrome);
  return <HousePhoneDestChips isGcStaff={data.isGcStaff} workspace={workspace} />;
}
