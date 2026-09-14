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
  SideNav: () => createElement("nav", { "data-side-nav": "" }),
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
  it("no longer mounts a standalone sun or theme toggle", () => {
    navigation.pathname = "/";
    const html = renderShell();
    expect(html).toContain("data-user-menu-host");
    expect(html).not.toContain("Switch to dark mode");
    expect(html).not.toContain("Switch to light mode");
    expect(html).not.toContain("theme-toggle");
    expect(html).not.toContain("ThemeToggle");
    expect(shellSrc).not.toContain("ThemeToggle");
    expect(shellSrc).not.toContain("theme-toggle");
    expect(shellSrc).not.toContain("ThemeGlyph");
    expect(shellSrc).not.toMatch(/bell|⌘K|CommandK|command-k/i);
    expect(shellSrc).not.toContain("SearchField");
    expect(shellSrc).toContain("TitlesHeaderSearch");
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
    expect(shellSrc).toContain("defaultWorkspace={defaultWorkspace}");
    expect(shellSrc).toContain("Phone avatar opens 544:561");
    expect(shellSrc).toContain("Workspace switcher lives in the account menu");
    expect(shellSrc).not.toContain("WorkspaceSwitcher");
    expect(shellSrc).toContain("<MobileNav isGcStaff={isGcStaff} workspace={workspace} />");
    expect(shellSrc).not.toContain("AccountOverlay");
    expect(shellSrc).not.toContain("AccountSheet");
  });

  it("is avatar-only on every Access route — no org switcher", () => {
    expect(shellSrc).not.toContain("OrganizationSwitcher");
    expect(shellSrc).toContain("justify-end");
    expect(shellSrc).toContain("defaultWorkspace={defaultWorkspace}");

    for (const path of ["/", "/titles", "/deliveries", "/catalog-health", "/messages"]) {
      navigation.pathname = path;
      const html = renderShell();
      expect(html).not.toContain("data-org-switcher");
      expect(html).toContain("justify-end");
      expect(html).toContain("data-user-menu-host");
      expect(html).toContain("data-app-header");
      expect(html).toContain("px-[var(--content-inset)]");
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
    expect(tokens).toMatch(/--header-height:\s*56px;/);
    expect(tokens).not.toMatch(/--sidebar-width:\s*190px;/);

    navigation.pathname = "/";
    const html = renderShell();
    expect(html).toContain("data-app-rail");
    expect(html).toMatch(/<aside class="[^"]*\bbg-surface\b[^"]*" data-app-rail=""/);
    expect(html).not.toMatch(/<aside class="[^"]*bg-surface-muted/);
    expect(html).toContain("data-app-home-frame");
    expect(html).toContain("px-[var(--content-inset)]");
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
    expect(titles).toContain("data-titles-header-search");
    expect(titles).toContain("md:hidden");
    expect(titles).toContain("Search titles...");
    expect(titles).not.toContain("⌘K");

    navigation.pathname = "/deliveries";
    const deliveries = renderShell();
    expect(deliveries).toContain("px-[var(--content-inset)] pb-24 pt-8");
    expect(deliveries).not.toContain("px-6 pb-24 pt-8");
    expect(deliveries).not.toContain("data-app-home-frame");
    expect(deliveries).not.toContain("data-app-messages-frame");
    expect(deliveries).not.toContain("data-org-switcher");

    navigation.pathname = "/catalog-health";
    const health = renderShell();
    expect(health).toContain("px-[var(--content-inset)] pb-24 pt-8");
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
    expect(renderShell("access-gate")).toContain("data-titles-header-search");
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
    expect(shellSrc).toContain("hidden h-dvh flex-col");
    expect(shellSrc).toContain("md:flex");
    expect(shellSrc).toContain("<MobileNav isGcStaff={isGcStaff} workspace={workspace} />");
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
    expect(html).toContain("Profile");
    expect(html).toContain("Agreements");
    expect(html).toContain("Refer a friend");
    expect(html).not.toContain("data-side-nav");
    expect(html).not.toContain("Titles");
    expect(html).not.toContain("Deliveries");
    expect(html).not.toContain("Catalog Health");
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
    for (const path of ["/settings/profile", "/settings/agreements", "/settings/refer"]) {
      navigation.pathname = path;
      const html = renderShell();
      expect(html).toContain('data-settings-rail=""');
      expect(html).toContain("data-settings-rail-nav");
      expect(html).toContain("Refer a friend");
      expect(html).not.toContain("data-side-nav");
      expect(html).not.toContain("data-mobile-nav-trigger");
      expect(html).toContain("data-settings-header-back");
      expect(html).toContain('href="/"');
      expect(html).not.toContain("Collapse sidebar");
      expect(html).not.toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
    }
  });
});

describe("AppShell rail-collapse chevron", () => {
  it("uses CaretDoubleLeft Bold in the expanded header row with house tokens", () => {
    navigation.pathname = "/";
    const html = renderShell();
    expect(html).toContain("Collapse sidebar");
    expect(html).toContain(`title="Collapse sidebar"`);
    expect(html).toContain('viewBox="0 0 256 256"');
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain("lucide-");
    expect(html).not.toContain("stroke-width");
    expect(html).toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
    expect(html).toContain(RAIL_COLLAPSE_CHEVRON_CLASS);
    expect(html).toContain(RAIL_COLLAPSE_CHEVRON_ICON_CLASS);
    expect(shellSrc).toContain("weight={RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT}");
    expect(RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT).toBe("bold");
    expect(html).not.toContain("Expand sidebar");
    expect(html).not.toContain(RAIL_COLLAPSE_EXPAND_ROW_CLASS);
    expect(html).toContain("24Frame");
    expect(shellSrc).toContain("CaretDoubleLeft");
    expect(shellSrc).toContain("CaretDoubleRight");
    expect(shellSrc).toContain("RAIL_COLLAPSE_CHEVRON");
    expect(shellSrc).not.toContain("RAIL_COLLAPSE_RL");
    expect(shellSrc).not.toMatch(/\brl-/);
    expect(shellSrc).not.toContain("AskGlobeeChromeProvider");
    expect(shellSrc).toContain("AskAssistantChromeProvider");
    expect(shellSrc).toContain("SocialMobileDock");
    expect(shellSrc).toContain('workspace === "social" && !settingsPage');
    expect(shellSrc).not.toContain("PanelLeftOpen");
    expect(shellSrc).not.toContain("PanelLeftClose");
    expect(shellSrc).not.toContain("PanelLeft");
  });

  it("puts CaretDoubleRight Bold on a separate expand row when collapsed", () => {
    navigation.pathname = "/";
    const html = renderShell(undefined, undefined, true);
    expect(html).toContain("Expand sidebar");
    expect(html).toContain(`title="Expand sidebar"`);
    expect(html).toContain('viewBox="0 0 256 256"');
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain("lucide-");
    expect(html).not.toContain("stroke-width");
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
  });

  it("keeps collapse off on settings and persistence on the house cookie", () => {
    expect(shellSrc).toContain("persistSidebarCollapsed");
    expect(shellSrc).toContain("migrateSidebarCollapsedCookie");
    expect(shellSrc).not.toContain("gc_sidebar_collapsed");
    expect(shellSrc).toContain("defaultCollapsed");
    expect(shellSrc).toContain("<MobileNav isGcStaff={isGcStaff} workspace={workspace} />");
    expect(SIDEBAR_COLLAPSED_COOKIE).toBe("24frame_sidebar_collapsed");
    navigation.pathname = "/settings";
    expect(renderShell(undefined, undefined, true)).not.toContain("Expand sidebar");
    expect(renderShell(undefined, undefined, true)).not.toContain(RAIL_COLLAPSE_EXPAND_ROW_CLASS);
  });

  it("adds the Social phone pill and Create FAB without reopening Access chrome", () => {
    navigation.pathname = "/social";
    const html = renderShell();
    expect(html).toContain("data-social-mobile-pill");
    expect(html).toContain("data-social-create-fab");
    expect(html).toContain(`data-rail-collapse="${RAIL_COLLAPSE_CHEVRON}"`);
    expect(html).toContain("data-mobile-nav-trigger");
    expect(html).toContain("24Frame");
    expect(shellSrc).toContain("AskAssistantChromeProvider");
    expect(shellSrc).toContain("RAIL_COLLAPSE_CHEVRON");
    expect(shellSrc).toContain("persistSidebarCollapsed");
    expect(shellSrc).not.toContain("AskGlobeeChromeProvider");
    expect(shellSrc).not.toContain("RAIL_COLLAPSE_RL");
  });
});
