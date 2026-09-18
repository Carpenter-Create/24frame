import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/(app)/messages/ask-globee-actions", () => ({
  startAskGlobeeConversation: vi.fn(),
  appendAskGlobeeTurn: vi.fn(),
  completeAskGlobeeTurn: vi.fn(),
  setAskGlobeeThumb: vi.fn(),
  renameAskGlobeeConversation: vi.fn(),
  pinAskGlobeeConversation: vi.fn(),
  deleteAskGlobeeConversation: vi.fn(),
}));
vi.mock("./organization-switcher", () => ({
  OrganizationSwitcher: () => createElement("div", { "data-org-switcher": "" }),
}));
vi.mock("./side-nav", () => ({
  SideNav: ({
    isGcStaff,
    workspace,
    collapsed,
  }: {
    isGcStaff?: boolean;
    workspace?: string;
    collapsed?: boolean;
  }) =>
    createElement("nav", {
      "data-side-nav": "",
      "data-gc-staff": isGcStaff ? "" : undefined,
      "data-workspace": workspace ?? "aggregation",
      "data-collapsed": collapsed ? "" : undefined,
    }),
}));
vi.mock("./user-menu", () => ({
  UserMenu: ({
    email,
    name,
    photoUrl,
  }: {
    email: string;
    name?: string | null;
    photoUrl?: string | null;
  }) =>
    createElement("div", {
      "data-user-menu-host": "",
      "data-email": email,
      "data-name": name ?? "",
      "data-photo": photoUrl ?? "",
    }),
}));

import { AppShell } from "./app-shell";
import type { AppShellChrome } from "@/lib/app-shell-chrome";
import type { MessagesSurface } from "@/lib/ask-globee";
import {
  RAIL_COLLAPSE_CHEVRON,
  RAIL_COLLAPSE_CHEVRON_CLASS,
  RAIL_COLLAPSE_EXPAND_ROW_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_CLASS,
  RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT,
  SIDEBAR_COLLAPSED_COOKIE,
} from "@/lib/rail-collapse";

const shellSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "app-shell.tsx"), "utf8");
const railCollapseSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "rail-collapse.tsx"),
  "utf8",
);
const leadSrc = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "house-lead-chrome.tsx"),
  "utf8",
);

function fulfilledChrome(data: AppShellChrome): Promise<AppShellChrome> {
  const chrome = Promise.resolve(data) as Promise<AppShellChrome> & {
    status: "fulfilled";
    value: AppShellChrome;
  };
  chrome.status = "fulfilled";
  chrome.value = data;
  return chrome;
}

function renderShell(
  messagesSurface?: MessagesSurface,
  name?: string | null,
  defaultCollapsed = false,
  photoUrl?: string | null,
): string {
  return renderToStaticMarkup(
    <AppShell
      email="ada@example.com"
      name={name}
      photoUrl={photoUrl}
      orgs={[{ id: "org-1", name: "Acme" }]}
      activeOrgId="org-1"
      messagesUnread={Promise.resolve(0)}
      messagesSurface={messagesSurface}
      defaultCollapsed={defaultCollapsed}
    >
      page
    </AppShell>,
  );
}

describe("AppShell header", () => {
  it("mounts the header sun/moon between workspace names and the avatar", () => {
    navigation.pathname = "/";
    const html = renderShell();
    expect(html).toContain("data-user-menu-host");
    expect(html).toContain("data-theme-toggle");
    expect(html).toContain("Switch to dark mode");
    expect(html).not.toContain("Switch to light mode");
    expect(html.indexOf("data-workspace-switcher")).toBeLessThan(html.indexOf("data-theme-toggle"));
    expect(html.indexOf("data-theme-toggle")).toBeLessThan(html.indexOf("data-user-menu-host"));
    expect(html).not.toContain("ThemeToggle");
    expect(shellSrc).not.toContain("ThemeToggle");
    expect(shellSrc).not.toContain("theme-toggle");
    expect(shellSrc).not.toContain("ThemeGlyph");
    expect(leadSrc).toContain("ThemeToggle");
    expect(leadSrc).toContain("<ThemeToggle />");
    expect(shellSrc).not.toMatch(/bell|⌘K|CommandK|command-k/i);
    expect(shellSrc).not.toContain("SearchField");
    expect(shellSrc).not.toContain("TitlesHeaderSearch");
  });

  it("keeps the account menu in the header", () => {
    navigation.pathname = "/";
    const html = renderShell();
    expect(html).toContain('data-email="ada@example.com"');
    expect(html).toContain('data-name=""');
    expect(html).toContain('data-photo=""');
    expect(renderShell(undefined, "Ada Lovelace")).toContain('data-name="Ada Lovelace"');
    expect(renderShell(undefined, "Ada Lovelace", false, "https://s3.example/signed-avatar")).toContain(
      'data-photo="https://s3.example/signed-avatar"',
    );
    expect(shellSrc).toContain("Phone avatar opens 544:561");
    expect(shellSrc).toContain("hamburger · gap 8 · one workspace");
    expect(shellSrc).toContain("HouseLeadChrome");
    expect(leadSrc).toContain("WorkspaceSwitcher");
    expect(leadSrc).toContain('<WorkspaceSwitcher current={workspace} tone="pill" />');
    expect(leadSrc).toContain('<WorkspaceSwitcher current={workspace} presentation="pills" />');
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("data-house-lead-scroll");
    expect(html).toContain("h-dvh");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("overflow-y-auto");
    expect(html).toContain("Aggregation");
    expect((html.match(/data-workspace-switcher=""/g) ?? []).length).toBe(2);
    expect(html).toContain('data-workspace-switcher-tone="pill"');
    expect(html).toContain('data-workspace-switcher-presentation="pills"');
    expect(html).toContain("data-workspace-switcher-pills");
    expect(html).toContain('data-workspace-switcher-segment="aggregation"');
    expect(html).toContain('data-workspace-switcher-segment="social"');
    expect(html).toContain('data-workspace-switcher-segment="education"');
    expect(html).toContain("data-app-header-workspace-pill");
    expect(html).not.toContain("data-workspace-switcher-rail");
    expect(html).not.toContain("data-workspace-switcher-lead");
    expect(html.indexOf("data-app-header-workspace-pill")).toBeLessThan(
      html.indexOf("data-user-menu-host"),
    );
    expect(html.indexOf("data-workspace-switcher")).toBeLessThan(html.indexOf("data-user-menu-host"));
    expect(shellSrc).toContain("<MobileNavSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />");
    expect(shellSrc).not.toContain("AccountOverlay");
    expect(shellSrc).not.toContain("AccountSheet");
  });

  it("is avatar-only on every Access route — no org switcher", () => {
    expect(shellSrc).not.toContain("OrganizationSwitcher");
    expect(leadSrc).toContain("HOUSE_LEAD_CHROME_CLASS");
    expect(leadSrc).toContain('<WorkspaceSwitcher current={workspace} tone="pill" />');
    expect(leadSrc).toContain('<WorkspaceSwitcher current={workspace} presentation="pills" />');

    for (const path of ["/", "/titles", "/deliveries", "/catalog-health", "/messages"]) {
      navigation.pathname = path;
      const html = renderShell();
      expect(html).not.toContain("data-org-switcher");
      expect(html).toContain("justify-end");
      expect(html).toContain("data-user-menu-host");
      expect(html).toContain("data-app-header");
      expect(html).toContain("px-[var(--chrome-gutter)]");
    }
  });
});

describe("AppShell Access rail and home frame", () => {
  it("uses a white 220 rail and the locked `/` page pad", () => {
    const tokens = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../app/tokens.css"),
      "utf8",
    );
    expect(tokens).toMatch(/--sidebar-width:\s*220px;/);
    expect(tokens).toMatch(/--content-inset:\s*48px;/);
    expect(tokens).toMatch(/--chrome-gutter:\s*16px;/);
    expect(tokens).toMatch(/--header-height:\s*56px;/);
    expect(tokens).not.toMatch(/--sidebar-width:\s*190px;/);

    navigation.pathname = "/";
    const html = renderShell();
    expect(html).toContain("data-app-rail");
    expect(html).toMatch(/<aside class="[^"]*\bbg-surface\b[^"]*" data-app-rail=""/);
    expect(html).not.toMatch(/<aside class="[^"]*bg-surface-muted/);
    expect(html).toContain("data-app-home-frame");
    expect(html).toContain("px-[var(--chrome-gutter)]");
    expect(html).toContain("py-[var(--space-8)]");
    expect(html).not.toContain("px-6 pb-24 pt-8");
    expect(html).not.toContain("px-6 ");
    expect(html).not.toContain("Search");
    expect(html).not.toContain("data-org-switcher");
  });

  it("does not restyle the titles bleed or other page frames", () => {
    navigation.pathname = "/titles";
    const titles = renderShell();
    expect(titles).toContain("w-full pb-24");
    expect(titles).not.toContain("data-app-home-frame");
    expect(titles).not.toContain("data-app-messages-frame");
    expect(titles).not.toContain("data-org-switcher");
    expect(titles).not.toContain("data-titles-header-search");
    expect(titles).not.toContain("Search titles...");
    expect(titles).not.toContain("⌘K");

    navigation.pathname = "/queue";
    const queue = renderShell();
    expect(queue).toContain("w-full pb-24");
    expect(queue).not.toContain("data-app-home-frame");
    expect(queue).not.toContain("data-app-messages-frame");
    expect(queue).not.toContain("pb-24 pt-8");

    navigation.pathname = "/deliveries";
    const deliveries = renderShell();
    expect(deliveries).toContain("px-[var(--chrome-gutter)]");
    expect(deliveries).toContain("pb-24 pt-8");
    expect(deliveries).not.toContain("px-6 pb-24 pt-8");
    expect(deliveries).not.toContain("data-app-home-frame");
    expect(deliveries).not.toContain("data-app-messages-frame");
    expect(deliveries).not.toContain("data-org-switcher");

    navigation.pathname = "/catalog-health";
    const health = renderShell();
    expect(health).toContain("px-[var(--chrome-gutter)]");
    expect(health).toContain("pb-24 pt-8");
    expect(health).not.toContain("px-6 pb-24 pt-8");
    expect(health).not.toContain("data-app-home-frame");
    expect(health).not.toContain("data-app-messages-frame");
    expect(health).not.toContain("data-org-switcher");
  });

  it("gives `/messages` the 48 inset and restores Search only for the Access gate", () => {
    navigation.pathname = "/messages";
    const inbox = renderShell("staff-inbox");
    expect(inbox).toContain("data-app-messages-frame");
    expect(inbox).toContain("data-app-header-leading");
    expect(inbox).toContain("p-[var(--content-inset)]");
    expect(inbox).toContain("md:px-[var(--chrome-gutter)]");
    expect(inbox).not.toContain("data-app-home-frame");
    expect(inbox).not.toContain("data-header-search");
    expect(inbox).not.toContain("⌘K");

    const gate = renderShell("access-gate");
    expect(gate).toContain("data-header-search");
    expect(gate).toContain("⌘K");
    expect(gate).not.toContain("data-header-thread");

    const landing = renderShell("ask-globee-landing");
    expect(landing).not.toContain("data-header-search");
    expect(landing).not.toContain("data-header-thread");
    expect(landing).not.toContain("⌘K");

    const thread = renderShell("ask-globee-thread");
    expect(thread).toContain("data-header-thread");
    expect(thread).not.toContain("data-header-search");
    expect(thread).not.toContain("⌘K");

    navigation.pathname = "/";
    expect(renderShell("access-gate")).not.toContain("data-header-search");
    expect(renderShell("access-gate")).not.toContain("data-titles-header-search");
    navigation.pathname = "/titles";
    expect(renderShell("access-gate")).not.toContain("data-header-search");
    expect(renderShell("access-gate")).not.toContain("data-titles-header-search");
    navigation.pathname = "/titles/title-1";
    expect(renderShell("access-gate")).not.toContain("data-titles-header-search");
    expect(shellSrc).not.toContain("SearchField");
  });
});

describe("AppShell client mobile chrome", () => {
  it("hides the persistent rail below the house mobile breakpoint and keeps the desktop rail", () => {
    const tokens = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../app/tokens.css"),
      "utf8",
    );
    expect(tokens).toMatch(/--sidebar-width:\s*220px;/);
    expect(tokens).toMatch(/--sidebar-width-collapsed:\s*60px;/);
    expect(tokens).toMatch(/@media \(max-width:\s*767px\)/);
    expect(tokens).toMatch(/--sidebar-width:\s*0px;/);
    expect(tokens).toMatch(/--sidebar-width-collapsed:\s*0px;/);

    navigation.pathname = "/";
    const html = renderShell();
    expect(html).toMatch(
      /<aside class="[^"]*\bhidden\b[^"]*\bmd:flex\b[^"]*" data-app-rail=""/,
    );
    expect(html).toContain("data-mobile-nav-trigger");
    expect(html).toContain("Open menu");
    expect(html).not.toContain("data-mobile-nav-sheet");
    expect(html).not.toContain("data-tab-bar");
    expect(html).not.toContain("data-social-mobile-pill");
    expect(html).not.toContain("data-social-create-fab");
    expect(shellSrc).toContain("HOUSE_RAIL_FLOAT_CLASS");
    expect(shellSrc).toContain("<MobileNavSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />");
    expect(shellSrc).not.toContain("GC_NAV");
    expect(shellSrc).not.toMatch(/key=\{pathname\}/);

    const layoutSrc = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../app/(app)/layout.tsx"),
      "utf8",
    );
    expect(layoutSrc).toContain("<AppShell");
    expect(layoutSrc).toContain("{children}");
    expect(layoutSrc).not.toMatch(/key=\{pathname\}/);
    expect(layoutSrc).not.toMatch(/key=\{ctx/);
  });

  it("keeps mobile chrome on Ask Globee without restoring Search, and keeps the Access gate", () => {
    navigation.pathname = "/messages";
    const landing = renderShell("ask-globee-landing");
    expect(landing).toContain("data-mobile-nav-trigger");
    expect(landing).toContain("data-app-header");
    expect(landing).not.toContain("data-header-search");
    expect(landing).not.toContain("⌘K");
    expect(landing).toMatch(
      /<aside class="[^"]*\bhidden\b[^"]*\bmd:flex\b[^"]*" data-app-rail=""/,
    );

    const gate = renderShell("access-gate");
    expect(gate).toContain("data-mobile-nav-trigger");
    expect(gate).toContain("data-header-search");
    expect(gate).toContain("⌘K");
  });
});

describe("AppShell /settings rail", () => {
  it("puts one 220 settings rail in the Access slot and kills the dashboard destinations", () => {
    const tokens = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../app/tokens.css"),
      "utf8",
    );
    expect(tokens).toMatch(/--sidebar-width:\s*220px;/);

    navigation.pathname = "/settings";
    const html = renderShell();
    expect(html).toContain("data-app-rail");
    expect(html).toContain('data-settings-rail=""');
    expect(html).toContain("data-settings-rail-nav");
    expect(html).toContain("data-user-menu-host");
    expect(html).toContain("Home");
    expect(html).toContain("Settings");
    expect(html).toContain("You");
    expect(html).toContain("Social");
    expect(html).toContain("Education");
    expect(html).toContain("Aggregation");
    expect(html).not.toContain("Agreements");
    expect(html).not.toContain("Refer a friend");
    expect(html).not.toContain("data-side-nav");
    expect(html).not.toContain("Titles");
    expect(html).not.toContain("Deliveries");
    expect(html).not.toContain("Catalog Health");
    expect(html).not.toContain("Attention");
    expect(html).not.toContain("Recent activity");
    expect(html).not.toContain("Ask 24Frame AI");
    expect(html).not.toContain("Queue");
    expect(html).not.toContain("Expand sidebar");
    expect(html).not.toContain("Collapse sidebar");
    expect(html).not.toContain("data-mobile-nav-trigger");
    expect(html).toContain("data-settings-header-back");
    expect(html).toContain('href="/"');
    expect(html).not.toContain("Search");
    expect(html).not.toContain("data-header-search");
    expect(html).not.toContain("data-titles-header-search");
    expect(html.match(/data-app-rail=""/g) ?? []).toHaveLength(1);
    expect(html.match(/data-settings-rail=""/g) ?? []).toHaveLength(1);
    expect(shellSrc).toContain("isSettingsPath");
    expect(shellSrc).toContain("SettingsRail");
    expect(shellSrc).toContain("SettingsHeaderBack");
    expect(shellSrc).toContain("SETTINGS_RAIL_PAD_CLASS");
    expect(shellSrc).toContain("collapsed && !settingsPage");
    expect(shellSrc).not.toContain("SettingsLocalNav");
    expect(shellSrc).not.toContain("md:w-[220px]");
    expect(html).not.toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
  });

  it("keeps the Access rail on neighboring routes", () => {
    for (const path of ["/", "/titles", "/deliveries", "/catalog-health", "/messages", "/help"]) {
      navigation.pathname = path;
      const html = renderShell();
      expect(html).toContain("data-side-nav");
      expect(html).not.toContain("data-settings-rail");
      expect(html).not.toContain("data-settings-rail-nav");
      expect(html).toContain("data-mobile-nav-trigger");
      expect(html).not.toContain("data-settings-header-back");
      expect(html).toContain("Collapse sidebar");
    }
  });

  it("keeps the focused 220 rail on every /settings path", () => {
    for (const path of [
      "/settings/you",
      "/settings/social",
      "/settings/education",
      "/settings/aggregation",
      "/settings/profile",
    ]) {
      navigation.pathname = path;
      const html = renderShell();
      expect(html).toContain('data-settings-rail=""');
      expect(html).toContain("data-settings-rail-nav");
      expect(html).toContain("You");
      expect(html).toContain("Education");
      expect(html).not.toContain("data-side-nav");
      expect(html).not.toContain("data-mobile-nav-trigger");
      expect(html).toContain("data-settings-header-back");
      expect(html).toContain('href="/settings"');
      expect(html).not.toContain("Collapse sidebar");
      expect(html).not.toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
    }
  });
});

describe("AppShell rail-collapse chevron", () => {
  it("uses CaretDoubleLeft Bold in the expanded header row with house tokens", () => {
    for (const path of ["/", "/social", "/social/courses"]) {
      navigation.pathname = path;
      const html = renderShell();
      expect(html).toContain("Collapse sidebar");
      expect(html).toContain(`title="Collapse sidebar"`);
      expect(html).toContain('viewBox="0 0 256 256"');
      expect(html).toContain('fill="currentColor"');
      expect(html).not.toContain("lucide-");
      expect(html).not.toContain("stroke-width");
      expect(html).toContain("data-theme-toggle");
      expect(html).toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
      expect(html).toContain(RAIL_COLLAPSE_CHEVRON_CLASS);
      expect(html).toContain(RAIL_COLLAPSE_CHEVRON_ICON_CLASS);
      expect(html).not.toContain("Expand sidebar");
      expect(html).not.toContain(RAIL_COLLAPSE_EXPAND_ROW_CLASS);
      expect(html).toContain("24Frame");
    }
    expect(railCollapseSrc).toContain("weight={RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT}");
    expect(RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT).toBe("bold");
    expect(railCollapseSrc).toContain("CaretDoubleLeft");
    expect(railCollapseSrc).toContain("CaretDoubleRight");
    expect(railCollapseSrc).toContain("RAIL_COLLAPSE_CHEVRON");
    expect(shellSrc).toContain("<RailCollapse collapsed={collapsed} onToggle={toggle} />");
    expect(shellSrc).not.toContain("RAIL_COLLAPSE_RL");
    expect(shellSrc).not.toMatch(/\brl-/);
    expect(shellSrc).not.toContain("AskGlobeeChromeProvider");
    expect(shellSrc).toContain("AskAssistantChromeProvider");
    expect(shellSrc).not.toContain("SocialMobileDock");
    expect(shellSrc).toContain('workspace === "social" && !settingsPage');
    expect(shellSrc).toContain("data-education-workspace");
    expect(shellSrc).toContain('workspace === "education"');
    expect(shellSrc).not.toContain("PanelLeftOpen");
    expect(shellSrc).not.toContain("PanelLeftClose");
    expect(shellSrc).not.toContain("PanelLeft");
    expect(shellSrc).not.toContain("collapsed={false}");
  });

  it("shows the shared full wordmark in expanded, collapsed, settings, and Social rails", () => {
    navigation.pathname = "/";
    const expanded = renderShell();
    expect(expanded).toContain("data-brand-emblem");
    expect(expanded).toContain("data-brand-logo");
    expect(expanded).toContain("/brand/24frame-logo-light.svg");
    expect(expanded).toContain("/brand/24frame-logo-dark.svg");
    expect(expanded).toContain('aria-label="24Frame"');
    expect(expanded).toContain('href="/dashboard"');
    expect(expanded).not.toContain("data-brand-emblem-mark");
    expect(expanded).not.toContain("t-body font-medium text-ink");
    expect(shellSrc).not.toContain("24frame-wordmark");
    expect(shellSrc).not.toContain("BrandWordmark");

    const collapsed = renderShell(undefined, undefined, true);
    expect(collapsed).toContain("data-brand-emblem");
    expect(collapsed).toContain('aria-label="24Frame"');
    expect(collapsed).toContain('href="/dashboard"');

    navigation.pathname = "/social";
    const social = renderShell();
    expect(social).toContain("data-brand-emblem");
    expect(social).toContain('href="/social"');

    navigation.pathname = "/settings";
    const settings = renderShell();
    expect(settings).toContain("data-brand-emblem");
    expect(settings).toContain('href="/dashboard"');
  });

  it("puts CaretDoubleRight Bold on a separate expand row when collapsed", () => {
    for (const path of ["/", "/social", "/social/courses"]) {
      navigation.pathname = path;
      const html = renderShell(undefined, undefined, true);
      expect(html).toContain("Expand sidebar");
      expect(html).toContain(`title="Expand sidebar"`);
      expect(html).toContain('viewBox="0 0 256 256"');
      expect(html).toContain('fill="currentColor"');
      expect(html).not.toContain("lucide-");
      expect(html).not.toContain("stroke-width");
      expect(html).toContain("data-theme-toggle");
      expect(html).toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
      expect(html).toContain(RAIL_COLLAPSE_EXPAND_ROW_CLASS);
      expect(html).toContain(RAIL_COLLAPSE_CHEVRON_CLASS);
      expect(html).toContain(RAIL_COLLAPSE_CHEVRON_ICON_CLASS);
      expect(html).not.toContain("Collapse sidebar");
      const expandIdx = html.indexOf(RAIL_COLLAPSE_EXPAND_ROW_CLASS);
      const navIdx = html.indexOf("data-side-nav");
      expect(expandIdx).toBeGreaterThan(-1);
      expect(navIdx).toBeGreaterThan(expandIdx);
      const expandSlice = html.slice(expandIdx, navIdx);
      expect(expandSlice).not.toContain("bg-hairline");
      expect(expandSlice).not.toContain("border-hairline");
    }
  });

  it("keeps collapse off on settings and persistence on the house cookie", () => {
    expect(shellSrc).toContain("persistSidebarCollapsed");
    expect(shellSrc).toContain("migrateSidebarCollapsedCookie");
    expect(shellSrc).not.toContain("gc_sidebar_collapsed");
    expect(shellSrc).toContain("defaultCollapsed");
    expect(shellSrc).toContain("<MobileNavSlot chrome={chrome} isGcStaff={isGcStaff} workspace={workspace} />");
    expect(SIDEBAR_COLLAPSED_COOKIE).toBe("24frame_sidebar_collapsed");
    navigation.pathname = "/settings";
    expect(renderShell(undefined, undefined, true)).not.toContain("Expand sidebar");
    expect(renderShell(undefined, undefined, true)).not.toContain(RAIL_COLLAPSE_EXPAND_ROW_CLASS);
  });

  it("restores staff destinations from chrome without blocking children", () => {
    navigation.pathname = "/";
    const pending = renderToStaticMarkup(
      <AppShell chrome={new Promise(() => {})} messagesUnread={new Promise(() => {})}>
        page
      </AppShell>,
    );
    expect(pending).toContain("page");
    expect(pending).toContain("data-side-nav");
    expect(pending).not.toContain("data-gc-staff");
    expect(pending).toContain("data-mobile-nav-trigger");

    const staff = renderToStaticMarkup(
      <AppShell
        chrome={fulfilledChrome({
          email: "ada@example.com",
          name: "Ada",
          photoUrl: null,
          orgs: [],
          activeOrgId: null,
          unread: Promise.resolve(0),
          isGcStaff: true,
          defaultCollapsed: false,
          messagesSurface: "staff-inbox",
          defaultWorkspace: "aggregation",
        })}
        messagesUnread={Promise.resolve(0)}
      >
        page
      </AppShell>,
    );
    expect(staff).toContain("data-gc-staff");
    expect(staff).toContain('data-email="ada@example.com"');
    expect(staff).toContain("page");
    expect(shellSrc).toContain("SideNavFromChrome");
    expect(shellSrc).toContain("MobileNavFromChrome");
    expect(shellSrc).toContain("ChromeCookieSync");
    expect(shellSrc).toContain("data.isGcStaff");
    expect(shellSrc).toContain("isGcStaff={data.isGcStaff}");
    expect(shellSrc).toContain("data.defaultCollapsed");
    expect(shellSrc).toContain("data.defaultWorkspace");
    const appShellFn = shellSrc.slice(shellSrc.indexOf("export function AppShell"));
    const beforeSocial = appShellFn.slice(0, appShellFn.indexOf("if (socialChrome)"));
    expect(beforeSocial).not.toMatch(/\buse\(chrome\)/);
  });

  it("applies resolved chrome cookies from a Suspense slot without persisting defaults", () => {
    navigation.pathname = "/";
    const pending = renderToStaticMarkup(
      <AppShell chrome={new Promise(() => {})} messagesUnread={new Promise(() => {})}>
        page
      </AppShell>,
    );
    expect(pending).toContain("Collapse sidebar");
    expect(pending).not.toContain("Expand sidebar");
    expect(pending).toContain("data-side-nav");
    expect(pending).not.toContain("data-social-rail");

    expect(shellSrc).toContain("<ChromeCookieSync chrome={chrome} onCookies={applyChromeCookies} />");
    expect(shellSrc).toContain("if (cookiesApplied.current) return");
    expect(shellSrc).toContain("if (!collapseTouched.current)");
    expect(shellSrc).toContain("setCollapsed(next.defaultCollapsed)");
    expect(shellSrc).toContain("setWorkspaceCookie(next.defaultWorkspace)");
    expect(shellSrc).toContain("collapseTouched.current = true");
    const applyFn = shellSrc.slice(
      shellSrc.indexOf("const applyChromeCookies"),
      shellSrc.indexOf("const cookieSync"),
    );
    expect(applyFn).toContain("if (cookiesApplied.current) return");
    expect(applyFn).toContain("if (!collapseTouched.current)");
    const syncFn = shellSrc.slice(shellSrc.indexOf("function ChromeCookieSync"));
    const syncBody = syncFn.slice(0, syncFn.indexOf("\nfunction SideNavSlot"));
    expect(syncBody).toContain("use(chrome)");
    expect(syncBody).toContain("data.defaultCollapsed");
    expect(syncBody).toContain("data.defaultWorkspace");
    expect(syncBody).not.toContain("persistSidebarCollapsed");
    expect(syncBody).not.toContain("persistWorkspaceCookie");
    const appShellFn = shellSrc.slice(shellSrc.indexOf("export function AppShell"));
    const beforeSocial = appShellFn.slice(0, appShellFn.indexOf("if (socialChrome)"));
    expect(beforeSocial).not.toMatch(/\buse\(chrome\)/);
    expect(beforeSocial).toContain("cookieSync");
  });

  it("paints Social chrome and children before layout chrome resolves", () => {
    navigation.pathname = "/social";
    const chrome = new Promise<AppShellChrome>(() => {});
    const html = renderToStaticMarkup(
      <AppShell chrome={chrome} messagesUnread={new Promise(() => {})}>
        destination-page
      </AppShell>,
    );
    expect(html).toContain("data-social-workspace");
    expect(html).toContain("data-social-top-bar");
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("Social");
    expect(html).toContain("data-social-tab-bar");
    expect(html).toContain('data-social-tab-item="Create"');
    expect(html).toContain("destination-page");
    expect(html).toContain("data-app-social-frame");
    expect(html).toContain("data-house-lead-scroll");
    expect(html).toContain("h-dvh");
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("overflow-y-auto");
  });

  it("adds Social X-lane chrome on the shared house rail collapse", () => {
    navigation.pathname = "/social";
    const html = renderShell(undefined, "Ada Lovelace");
    expect(html).toContain("data-social-workspace");
    expect(html).toContain("data-social-top-bar");
    expect(html).toContain("data-social-header-search");
    expect(html).not.toContain("data-social-rail-create");
    expect(html).not.toContain("Destinations");
    expect(html).toContain("data-social-rail-account");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain('data-social-tab-item="Create"');
    expect(html).not.toContain("data-social-mobile-pill");
    expect(html).not.toContain("data-social-create-fab");
    expect(html).not.toContain("data-social-mobile-dock");
    expect(html).toContain("data-social-tab-bar");
    expect(html).toContain("data-social-tab-item");
    expect(html).not.toContain("data-social-header-tray");
    expect(html).toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
    expect(html).toContain("Collapse sidebar");
    expect(html).not.toContain("data-mobile-nav-trigger");
    expect(html).toContain("24Frame");
    expect(shellSrc).toContain("AskAssistantChromeProvider");
    expect(shellSrc).toContain("<RailCollapse collapsed={collapsed} onToggle={toggle} />");
    expect(shellSrc).toContain("persistSidebarCollapsed");
    expect(shellSrc).toContain("RAIL_COLLAPSE_WIDTH_VAR");
    expect(shellSrc).not.toContain("AskGlobeeChromeProvider");
    expect(shellSrc).not.toContain("RAIL_COLLAPSE_RL");
  });

  it("collapses the Social rail to icon-only nav and follows collapsed width vars", () => {
    navigation.pathname = "/social";
    const html = renderShell(undefined, "Ada Lovelace", true);
    expect(html).toContain("data-social-workspace");
    expect(html).toContain("data-social-rail");
    expect(html).toContain("data-social-rail-account");
    expect(html).toContain("data-collapsed");
    expect(html).toContain("Expand sidebar");
    expect(html).toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
    expect(html).toContain(RAIL_COLLAPSE_EXPAND_ROW_CLASS);
    expect(html).toContain("--sidebar-width:var(--sidebar-width-collapsed)");
    expect(html).toContain("margin-left:var(--sidebar-width)");
    expect(html).not.toContain("md:ml-[200px]");
    expect(html).toContain('aria-label="Ada Lovelace"');
    expect(html).toContain("data-app-social-frame");
    expect(html).toContain("data-social-tab-bar");
    expect(html).not.toContain("data-mobile-nav-trigger");
  });

  it("uses house chrome on Education courses routes — no Social feed chrome", () => {
    navigation.pathname = "/social/courses";
    const html = renderShell();
    expect(html).toContain("data-education-workspace");
    expect(html).toContain('data-workspace="education"');
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("Aggregation");
    expect(html).toContain("Social");
    expect(html).toContain("Education");
    expect(html).toContain('data-education-header-search-host="phone"');
    expect(html).toContain('data-education-header-search-host="desktop"');
    expect(html).toContain("data-education-header-search");
    expect(html).toContain("data-app-header-brand-search");
    expect(html.indexOf("data-brand-emblem")).toBeLessThan(
      html.indexOf('data-education-header-search-host="desktop"'),
    );
    expect(html.indexOf('data-education-header-search-host="desktop"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-presentation="pills"'),
    );
    expect(html.indexOf('data-workspace-switcher-presentation="pills"')).toBeLessThan(
      html.indexOf("data-user-menu-host"),
    );
    expect(html).toContain("data-app-header");
    expect(html).toContain('href="/social/courses"');
    expect(html).not.toContain("data-social-workspace");
    expect(html).not.toContain("data-social-top-bar");
    expect(html).not.toContain("data-social-tab-bar");
    expect(html).not.toContain("data-social-rail");
    expect(html).not.toContain('data-social-tab-item="Create"');

    navigation.pathname = "/social/courses/welcome-to-24frame";
    const detail = renderShell();
    expect(detail).toContain("data-education-workspace");
    expect(detail).toContain('data-workspace="education"');
    expect(detail).toContain("data-app-header");
    expect(detail).not.toContain("data-social-workspace");
  });
});
