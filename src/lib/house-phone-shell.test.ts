import { createElement } from "react";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children?: React.ReactNode;
    prefetch?: boolean;
  }) {
    return React.createElement("a", { href, ...props }, children);
  }
  return { __esModule: true, default: MockLink };
});

import { BookOpen, FilmStrip, House, SquaresFour, Users } from "@phosphor-icons/react";

import { HouseLeadChrome } from "@/components/chrome/house-lead-chrome";
import { HousePhoneAppShell } from "@/components/chrome/house-phone-app-shell";
import { HousePhoneBottomNav } from "@/components/chrome/house-phone-bottom-nav";
import { HousePhoneDestChips } from "@/components/chrome/house-phone-dest-chips";
import { HousePhoneTopChrome } from "@/components/chrome/house-phone-top-chrome";
import { SocialTopBar } from "@/components/social/social-top-bar";
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_ICON_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS,
  HOUSE_PHONE_BOTTOM_NAV,
  HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_HIDDEN_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT,
  HOUSE_PHONE_CHROME_ICON_CLASS,
  HOUSE_PHONE_CHROME_ICON_WEIGHT,
  HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_ITEM_ON_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS,
  HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS,
  HOUSE_PHONE_DEST_CHIPS,
  HOUSE_PHONE_DEST_ITEM_OFF_CLASS,
  HOUSE_PHONE_DEST_ITEM_ON_CLASS,
  HOUSE_PHONE_WORKSPACE_TABS,
  SOCIAL_PHONE_DESTS,
  housePhoneDestinations,
  housePhoneShowsDestChips,
  housePhoneWorkspaceSelected,
} from "@/lib/house-phone-shell";
import { ASK_GLOBEE } from "@/lib/ask-globee";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS } from "@/lib/phosphor-icon";
import { SOCIAL_ROUTES } from "@/lib/social";
import {
  APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS,
} from "@/lib/workspace-switcher";

const leadSrc = readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8");
const shellSrc = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const phoneShellSrc = readFileSync("src/lib/house-phone-shell.ts", "utf8");
const bottomNavSrc = readFileSync("src/components/chrome/house-phone-bottom-nav.tsx", "utf8");
const phoneAppShellSrc = readFileSync("src/components/chrome/house-phone-app-shell.tsx", "utf8");
const askHeaderSrc = readFileSync("src/components/chrome/ask-assistant-header.tsx", "utf8");
const bellSrc = readFileSync("src/components/activity/activity-bell.tsx", "utf8");
const searchSheetSrc = readFileSync("src/components/social/social-search-sheet.tsx", "utf8");
const accountSheetSrc = readFileSync("src/components/chrome/account-sheet.tsx", "utf8");
const tokensSrc = readFileSync("src/app/tokens.css", "utf8");

function renderLead(workspace: "aggregation" | "social" | "education") {
  return renderToStaticMarkup(
    createElement(HouseLeadChrome, {
      workspace,
      destChips: createElement(HousePhoneDestChips, { workspace }),
      trailingSearch:
        workspace === "social"
          ? createElement("button", { "data-social-header-search-icon": "" })
          : undefined,
      accountMenu: createElement("div", { "data-account-sheet-trigger": "" }),
    }),
  );
}

describe("phone app-shell Option 2 — workspace bottom bar", () => {
  it("keeps phone top free of a workspace pill and desktop switcher in the header", () => {
    expect(leadSrc).not.toContain("data-app-header-workspace-pill");
    expect(leadSrc).not.toContain('tone="pill"');
    expect(leadSrc).toContain('presentation="pills"');
    expect(leadSrc).toContain("APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS");
    expect(leadSrc.match(/<WorkspaceSwitcher/g)?.length).toBe(1);
    expect(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS).toContain("hidden");
    expect(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS).toContain("md:contents");

    const aggregation = renderToStaticMarkup(
      createElement(HouseLeadChrome, {
        workspace: "aggregation",
        accountMenu: createElement("div", { "data-user-menu-host": "" }),
      }),
    );
    expect(aggregation).not.toContain("data-app-header-workspace-pill");
    expect(aggregation).not.toContain('data-workspace-switcher-tone="pill"');
    expect(aggregation).toContain('data-workspace-switcher-presentation="pills"');
    expect(aggregation).toContain("data-app-header-workspace-desktop");

    const top = renderToStaticMarkup(
      createElement(HousePhoneTopChrome, {
        workspace: "social",
        accountMenu: createElement("div", { "data-user-menu-host": "" }),
      }),
    );
    expect(top).toContain("data-house-lead-chrome");
    expect(top).not.toContain("data-app-header-workspace-pill");
  });

  it("keeps the emblem alone on the left and kills the hamburger on every workspace", () => {
    expect(shellSrc).not.toContain("trailingNav=");
    expect(shellSrc).not.toContain("MobileNav");
    expect(shellSrc).toContain("destChips=");
    expect(shellSrc).toContain("Emblem owns the left alone");
    expect(existsSync("src/components/chrome/mobile-nav.tsx")).toBe(false);
    expect(existsSync("src/components/social/social-phone-dests.tsx")).toBe(false);

    for (const workspace of ["aggregation", "education", "social"] as const) {
      const html = renderLead(workspace);
      const lead = html.slice(
        html.indexOf("data-app-header-leading"),
        html.indexOf("data-app-header-trailing"),
      );
      expect(lead).toContain("data-brand-emblem");
      expect(lead).not.toContain("data-mobile-nav-trigger");
      expect(lead).not.toContain("data-house-phone-dest-chips");
      expect(html).not.toContain("data-mobile-nav-trigger");
      expect(html).not.toContain("Open menu");
      expect(html).toContain("data-house-phone-dest-chips");
      expect(html).toContain("data-ask-assistant-header");
      expect(html).toContain("data-ask-ai-open");
      expect(html).not.toContain('href="/messages"');
      expect(html).not.toContain('href="/ai"');
      expect(html).toContain("data-activity-bell");
      expect(html).toContain("data-account-sheet-trigger");
      expect(html.indexOf("data-brand-emblem")).toBeLessThan(
        html.indexOf("data-ask-assistant-header"),
      );
      expect(html.indexOf("data-ask-assistant-header")).toBeLessThan(
        html.indexOf("data-activity-bell"),
      );
      expect(html.indexOf("data-activity-bell")).toBeLessThan(
        html.indexOf("data-account-sheet-trigger"),
      );
      const askToBell = html.slice(
        html.indexOf("data-ask-assistant-header"),
        html.indexOf("data-activity-bell"),
      );
      expect(askToBell).not.toContain("data-account-sheet-trigger");
      expect(askToBell).not.toContain("data-social-header-search-icon");
    }

    const home = renderToStaticMarkup(
      createElement(HouseLeadChrome, {
        workspace: "aggregation",
        accountMenu: createElement("div", { "data-account-sheet-trigger": "" }),
      }),
    );
    expect(home).toContain("data-brand-emblem");
    expect(home).not.toContain("data-mobile-nav-trigger");
    expect(home).not.toContain("data-house-phone-dest-chips");

    const social = renderLead("social");
    expect(social.indexOf("data-social-header-search-icon")).toBeGreaterThan(
      social.indexOf("data-app-header-trailing"),
    );
    expect(social.indexOf("data-social-header-search-icon")).toBeLessThan(
      social.indexOf("data-ask-assistant-header"),
    );
    expect(social.indexOf("data-ask-assistant-header")).toBeLessThan(
      social.indexOf("data-activity-bell"),
    );
  });

  it("ships exactly four phone workspace tabs in one shared bottom bar", () => {
    expect(HOUSE_PHONE_WORKSPACE_TABS.map((tab) => tab.id)).toEqual([
      "home",
      "social",
      "aggregation",
      "education",
    ]);
    expect(HOUSE_PHONE_WORKSPACE_TABS.map((tab) => tab.label)).toEqual([
      "Home",
      "Social",
      "Aggregation",
      "Education",
    ]);
    expect(HOUSE_PHONE_WORKSPACE_TABS.map((tab) => tab.href)).toEqual([
      "/home",
      "/social",
      "/dashboard",
      "/social/courses",
    ]);
    expect(HOUSE_PHONE_WORKSPACE_TABS.map((tab) => tab.icon)).toEqual([
      House,
      Users,
      FilmStrip,
      BookOpen,
    ]);
    expect(HOUSE_PHONE_WORKSPACE_TABS.find((tab) => tab.id === "aggregation")?.icon).toBe(
      FilmStrip,
    );
    expect(HOUSE_PHONE_WORKSPACE_TABS.find((tab) => tab.id === "aggregation")?.icon).not.toBe(
      SquaresFour,
    );
    expect(HOUSE_PHONE_BOTTOM_NAV.label).toBe("Workspaces");
    expect(HOUSE_PHONE_BOTTOM_NAV_CLASS).toContain("md:hidden");
    expect(HOUSE_PHONE_BOTTOM_NAV_CLASS).toContain("env(safe-area-inset-bottom)");
    expect(HOUSE_PHONE_BOTTOM_NAV_CLASS).toContain("transition-transform");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("rounded-[28px]");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("border-hairline");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("bg-surface");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("shadow-[var(--elevation-float)]");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).not.toContain("backdrop-blur");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).not.toContain("bg-surface/");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).not.toMatch(/shadow-\[var\(--elevation\)\]/);
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).toContain("h-14");
    expect(tokensSrc).toContain("--elevation-float:");
    expect(bottomNavSrc).not.toContain("backdrop-blur");
    expect(bottomNavSrc).not.toContain("fixed right-");
    expect(HOUSE_PHONE_BOTTOM_NAV_PILL_CLASS).not.toContain("blur");
    expect(phoneShellSrc).toContain("not Nextdoor frost");
    expect(HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS).toContain("max-md:pb-");
    expect(phoneShellSrc).toContain("Option 2");
    expect(phoneShellSrc).toContain("FilmStrip");
    expect(phoneShellSrc).not.toContain("SquaresFour");
    expect(existsSync("src/components/social/social-mobile-tab-bar.tsx")).toBe(false);

    navigation.pathname = "/dashboard";
    const html = renderToStaticMarkup(
      createElement(HousePhoneBottomNav, { workspace: "aggregation" }),
    );
    expect(html).toContain("data-house-phone-bottom-nav");
    expect(html).toContain("data-house-phone-bottom-nav-pill");
    expect(html.match(/data-house-phone-bottom-nav-item=/g)?.length).toBe(4);
    expect(html).toContain('data-house-phone-bottom-nav-item="home"');
    expect(html).toContain('data-house-phone-bottom-nav-item="social"');
    expect(html).toContain('data-house-phone-bottom-nav-item="aggregation"');
    expect(html).toContain('data-house-phone-bottom-nav-item="education"');
    expect(html).not.toContain("data-social-tab-bar");
    expect(html.indexOf('data-house-phone-bottom-nav-item="home"')).toBeLessThan(
      html.indexOf('data-house-phone-bottom-nav-item="social"'),
    );
    expect(html.indexOf('data-house-phone-bottom-nav-item="social"')).toBeLessThan(
      html.indexOf('data-house-phone-bottom-nav-item="aggregation"'),
    );
    expect(housePhoneWorkspaceSelected("aggregation", "/dashboard", "aggregation")).toBe(true);
    expect(housePhoneWorkspaceSelected("home", "/home", "aggregation")).toBe(true);
    expect(housePhoneWorkspaceSelected("social", "/social/explore", "social")).toBe(true);
    expect(housePhoneWorkspaceSelected("education", "/social/courses", "education")).toBe(true);
    expect(housePhoneWorkspaceSelected("aggregation", "/home", "aggregation")).toBe(false);
  });

  it("splits phone chrome size SoT — bottom nav size-6, header trailing size-4", () => {
    // Adam #449 (live-glance authoritative lock): bottom Mercury bar
    // keeps the 24px thumb-weight glyph, phone header trailing drops
    // to the 16px desktop-chrome optical. Two size SoT tokens, one
    // weight register, one idle ink. Mutating either constant to the
    // other's value fails this suite on both surfaces below.
    expect(HOUSE_PHONE_CHROME_ICON_CLASS).toBe("size-6 shrink-0");
    expect(HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS).toBe(HOUSE_PHONE_CHROME_ICON_CLASS);
    expect(HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS).not.toBe(PHOSPHOR_CHROME_ICON_CLASS);
    expect(PHOSPHOR_CHROME_ICON_CLASS).toBe("size-4 shrink-0");
    expect(HOUSE_PHONE_CHROME_ICON_WEIGHT).toBe("regular");
    expect(HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT).toBe(HOUSE_PHONE_CHROME_ICON_WEIGHT);

    // Header trailing rides its own 16px SoT. Value happens to match
    // PHOSPHOR_CHROME_ICON_CLASS today (phone optical = desktop
    // optical) but the constants stay distinct so future phone shifts
    // touch only the phone token.
    expect(HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS).toBe("size-4 shrink-0");
    expect(HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS).not.toBe(HOUSE_PHONE_CHROME_ICON_CLASS);
    expect(HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS).toBe(PHOSPHOR_CHROME_ICON_CLASS);
    expect(HOUSE_HEADER_TRAILING_ICON_CLASS).toBe(
      `${HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS} md:size-4`,
    );
    expect(HOUSE_HEADER_TRAILING_ICON_CLASS).toBe("size-4 shrink-0 md:size-4");
    expect(HOUSE_HEADER_TRAILING_ICON_CLASS).not.toContain("size-6");
    expect(HOUSE_HEADER_TRAILING_ICON_CLASS).not.toContain("size-5");
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toBe(
      "size-4 shrink-0 md:size-4 md:hidden text-ink-2",
    );
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).not.toContain("size-6");
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).not.toContain("size-5");
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toContain(HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS);
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(HOUSE_HEADER_TRAILING_DESKTOP_CLASS).toBe("size-4 shrink-0 hidden md:block");
    expect(HOUSE_HEADER_TRAILING_DESKTOP_CLASS).not.toContain(
      HOUSE_PHONE_CHROME_IDLE_INK_CLASS,
    );

    expect(bottomNavSrc).toContain("HOUSE_PHONE_BOTTOM_NAV_ICON_CLASS");
    expect(bottomNavSrc).toContain("HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT");
    expect(bottomNavSrc).not.toContain("PhosphorChromeIcon");
    // Bottom nav must never adopt the header 16px token — enforce by
    // name so a future refactor can't quietly collapse them.
    expect(bottomNavSrc).not.toContain("HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS");
    expect(bottomNavSrc).not.toContain("size-5");
    expect(bottomNavSrc).not.toContain("size-4");
    // Shell exports both size tokens as distinct literals; the size-5
    // middle ground from #448 must not reappear.
    expect(phoneShellSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS");
    expect(phoneShellSrc).toContain('"size-6 shrink-0"');
    expect(phoneShellSrc).toContain('"size-4 shrink-0"');
    expect(phoneShellSrc).not.toContain('"size-5 shrink-0"');
    expect(phoneShellSrc.match(/"size-\d shrink-0"/g) ?? []).toEqual([
      '"size-6 shrink-0"',
      '"size-4 shrink-0"',
    ]);
    expect(phoneShellSrc).not.toContain("bold");
    expect(phoneShellSrc).not.toContain('"fill"');
    expect(bottomNavSrc).toContain("aria-label={tab.label}");
    expect(bottomNavSrc).not.toContain("{tab.label}</span>");

    navigation.pathname = "/dashboard";
    const html = renderToStaticMarkup(
      createElement(HousePhoneBottomNav, { workspace: "aggregation" }),
    );
    expect(html).toContain(HOUSE_PHONE_CHROME_ICON_CLASS);
    expect(html).toContain("size-6");
    // Bottom bar must not shrink to header sizes — mutation of
    // HOUSE_PHONE_CHROME_ICON_CLASS to size-4 or size-5 fails here.
    expect(html).not.toContain("size-4");
    expect(html).not.toContain("size-5");
    expect(html).not.toContain('weight="bold"');
    expect(html).not.toContain('weight="fill"');
    expect(bottomNavSrc).toContain("weight={HOUSE_PHONE_BOTTOM_NAV_ICON_WEIGHT}");
    for (const label of ["Home", "Social", "Aggregation", "Education"]) {
      expect(html).toContain(`aria-label="${label}"`);
      expect(html).not.toContain(`>${label}<`);
    }
    expect(html).toContain('aria-label="Workspaces"');
  });

  it("uses the 16px header-trailing SoT for phone AI + bell + search without ballooning the avatar", () => {
    expect(askHeaderSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_CLASS");
    expect(askHeaderSrc).toContain("HOUSE_HEADER_TRAILING_DESKTOP_CLASS");
    expect(askHeaderSrc).toContain('register="stroke"');
    expect(askHeaderSrc).toContain('register="fill"');
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_CLASS");
    expect(bellSrc).toContain("HOUSE_HEADER_TRAILING_DESKTOP_CLASS");
    expect(bellSrc).toContain("HOUSE_PHONE_CHROME_ICON_WEIGHT");
    expect(bellSrc).toContain(
      "weight={phone ? HOUSE_PHONE_CHROME_ICON_WEIGHT : PHOSPHOR_CHROME_IDLE_WEIGHT}",
    );
    // Social header search rides the header trailing 16px SoT — same
    // cluster as AI + bell — not the Mercury bar 24px SoT (Adam #449).
    expect(searchSheetSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS");
    expect(searchSheetSrc).not.toContain("HOUSE_PHONE_CHROME_ICON_CLASS");
    expect(searchSheetSrc).toContain("HOUSE_PHONE_CHROME_ICON_WEIGHT");
    // Phone search glyph rides the same idle-ink SoT — no ink drift
    // across AI / bell / search in the phone top trailing cluster.
    expect(searchSheetSrc).toContain("HOUSE_PHONE_CHROME_IDLE_INK_CLASS");
    expect(searchSheetSrc).not.toMatch(/\btext-ink-2\b/);
    expect(accountSheetSrc).not.toContain("HOUSE_PHONE_CHROME_ICON_CLASS");
    expect(accountSheetSrc).not.toContain("HOUSE_HEADER_TRAILING_PHONE_ICON_CLASS");
    expect(accountSheetSrc).not.toContain("HOUSE_HEADER_TRAILING_ICON_CLASS");
    expect(accountSheetSrc).not.toContain("HOUSE_HEADER_TRAILING_PHONE_CLASS");
    expect(HOUSE_THEME_TOGGLE_CLASS).toContain("size-8");
    expect(HOUSE_THEME_TOGGLE_CLASS).not.toContain("size-6");
    expect(HOUSE_THEME_TOGGLE_CLASS).not.toContain("size-5");

    const lead = renderLead("social");
    const trailing = lead.slice(
      lead.indexOf("data-app-header-trailing"),
      lead.indexOf("</header>"),
    );
    expect(trailing).toContain("data-ask-assistant-header");
    expect(trailing).toContain("data-activity-bell");
    expect(trailing).toContain(HOUSE_HEADER_TRAILING_PHONE_CLASS);
    expect(trailing).toContain(HOUSE_HEADER_TRAILING_DESKTOP_CLASS);
    // Header trailing must render at 16px (size-4) — mutation to
    // size-6 (the Mercury bar box) OR size-5 (the retired #448 middle
    // ground) fails these lines. Desktop stays on md:size-4.
    expect(trailing).toContain("size-4");
    expect(trailing).not.toContain("size-6");
    expect(trailing).not.toContain("size-5");
    expect(trailing).toContain("md:size-4");
    expect(trailing).toContain('data-house-ai-mark-register="stroke"');
    expect(trailing).toContain('data-house-ai-mark-register="fill"');
    // Ink parity — the phone AI mark + bell must render on the same idle
    // ink as the bottom bar off state. Regular weight on ink-3 reads
    // visibly lighter than the same glyph on ink-2. #442 shipped weight
    // + stroke register, this line locks the ink so the two Regular
    // clusters actually match optically on Production.
    expect(HOUSE_HEADER_TRAILING_PHONE_CLASS).toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS).toBe(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(HOUSE_HEADER_TRAILING_DESKTOP_CLASS).not.toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(trailing).toContain(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    // Ink override lives on the phone-only class (md:hidden), so desktop
    // stays on HOUSE_THEME_TOGGLE_CLASS text-ink-3 / hover:text-ink.
    expect(HOUSE_THEME_TOGGLE_CLASS).toContain("text-ink-3");
    expect(HOUSE_THEME_TOGGLE_CLASS).not.toContain("text-ink-2");
    expect(phoneShellSrc).toContain("HOUSE_PHONE_CHROME_IDLE_INK_CLASS");
  });

  it("puts a light house chip behind the active glyph only", () => {
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).toContain("bg-surface-muted");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).toContain("rounded-full");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).toContain("h-12");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).toContain("min-w-14");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).not.toContain("h-10");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).not.toContain("min-w-12");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).not.toContain("rounded-[var(--radius)]");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).not.toContain("#");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).not.toContain("bg-accent");
    expect(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS).not.toContain("bg-ink");
    expect(HOUSE_PHONE_BOTTOM_NAV_ITEM_ON_CLASS).toBe("text-accent");
    expect(HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS).toBe("text-ink-2");
    expect(HOUSE_PHONE_CHROME_IDLE_INK_CLASS).toBe("text-ink-2");
    expect(HOUSE_PHONE_BOTTOM_NAV_ITEM_OFF_CLASS).toBe(HOUSE_PHONE_CHROME_IDLE_INK_CLASS);
    expect(bottomNavSrc).toContain("data-house-phone-bottom-nav-chip");
    expect(bottomNavSrc).toContain("HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS");

    navigation.pathname = "/dashboard";
    const aggregation = renderToStaticMarkup(
      createElement(HousePhoneBottomNav, { workspace: "aggregation" }),
    );
    expect(aggregation.match(/data-house-phone-bottom-nav-chip=/g)?.length).toBe(1);
    const aggItem = aggregation.slice(
      aggregation.indexOf('data-house-phone-bottom-nav-item="aggregation"'),
      aggregation.indexOf('data-house-phone-bottom-nav-item="education"'),
    );
    expect(aggItem).toContain("data-house-phone-bottom-nav-chip");
    expect(aggItem).toContain(HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS);
    expect(aggItem).toContain("h-12");
    expect(aggItem).toContain("min-w-14");
    // Bottom Mercury bar glyph stays on the 24px SoT (Adam #449) —
    // mutation of HOUSE_PHONE_CHROME_ICON_CLASS to size-4 or size-5
    // fails here.
    expect(aggItem).toContain("size-6");
    expect(aggItem).not.toContain("size-5");
    expect(aggItem).not.toContain("size-4");
    expect(aggItem).toContain("data-house-phone-bottom-nav-item-active");
    expect(aggregation).toContain('data-house-phone-bottom-nav-item-active=""');
    const homeItem = aggregation.slice(
      aggregation.indexOf('data-house-phone-bottom-nav-item="home"'),
      aggregation.indexOf('data-house-phone-bottom-nav-item="social"'),
    );
    expect(homeItem).not.toContain("data-house-phone-bottom-nav-chip");
    expect(homeItem).not.toContain("data-house-phone-bottom-nav-item-active");

    navigation.pathname = "/home";
    const home = renderToStaticMarkup(
      createElement(HousePhoneBottomNav, { workspace: "aggregation" }),
    );
    expect(home.match(/data-house-phone-bottom-nav-chip=/g)?.length).toBe(1);
    expect(home).toContain('data-house-phone-bottom-nav-item-active=""');
    const homeActive = home.slice(
      home.indexOf('data-house-phone-bottom-nav-item="home"'),
      home.indexOf('data-house-phone-bottom-nav-item="social"'),
    );
    expect(homeActive).toContain("data-house-phone-bottom-nav-chip");
  });

  it("hides the shared phone bottom bar with social-tab-bar-scroll", () => {
    expect(bottomNavSrc).toContain('from "@/lib/social-tab-bar-scroll"');
    expect(bottomNavSrc).toContain("createSocialTabBarScrollTracker");
    expect(bottomNavSrc).toContain("stepSocialTabBarScroll");
    expect(bottomNavSrc).toContain("[data-house-lead-scroll]");
    expect(bottomNavSrc).toContain("useHousePhoneBottomNavHidden(pathname)");
    expect(bottomNavSrc).toContain("nav.path !== pathname");
    expect(bottomNavSrc).toContain("}, [pathname]);");
    expect(bottomNavSrc).toContain("data-house-phone-bottom-nav-hidden");
    expect(phoneAppShellSrc).toContain("HousePhoneBottomNav");
    expect(phoneAppShellSrc).toContain("social-tab-bar-scroll");
    expect(HOUSE_PHONE_BOTTOM_NAV_HIDDEN_CLASS).toBe("pointer-events-none translate-y-full");
    expect(HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS).toContain("env(safe-area-inset-bottom)");

    const html = renderToStaticMarkup(
      createElement(HousePhoneBottomNav, { workspace: "social" }),
    );
    expect(html).toContain("data-house-phone-bottom-nav");
    expect(html).not.toContain("data-house-phone-bottom-nav-hidden");
  });

  it("wires real dest lists into one under-top chip row and keeps Ask off the chips", () => {
    expect(housePhoneShowsDestChips({ workspace: "aggregation" })).toBe(true);
    expect(housePhoneShowsDestChips({ workspace: "education" })).toBe(true);
    expect(housePhoneShowsDestChips({ workspace: "social" })).toBe(true);
    expect(housePhoneShowsDestChips({ workspace: "aggregation", homeChrome: true })).toBe(false);
    expect(housePhoneShowsDestChips({ workspace: "aggregation", settingsPage: true })).toBe(false);

    expect(housePhoneDestinations(false, "aggregation").map((item) => item.label)).toEqual([
      "Dashboard",
      "Titles",
      "Recent activity",
      "Activity",
      "Reports",
    ]);
    expect(housePhoneDestinations(true, "aggregation").map((item) => item.label)).toEqual([
      "Dashboard",
      "Titles",
      "Recent activity",
      "Activity",
      "Reports",
      "Queue",
      "Avails",
      "Licensing Status",
      "Channels",
      "Finance",
      "Clients",
    ]);
    expect(housePhoneDestinations(false, "aggregation").map((item) => item.label)).not.toContain(
      ASK_GLOBEE.headline,
    );
    expect(housePhoneDestinations(true, "aggregation").map((item) => item.href)).not.toContain(
      "/messages",
    );

    expect(housePhoneDestinations(false, "education").map((item) => item.label)).toEqual([
      "Education",
    ]);
    expect(housePhoneDestinations(true, "education").map((item) => item.label)).toEqual([
      "Education",
      "Manage courses",
    ]);

    expect(SOCIAL_PHONE_DESTS.map((item) => item.label)).toEqual([
      "Feed",
      "Explore",
      "Create",
      "Messages",
      "Profile",
    ]);
    expect(SOCIAL_PHONE_DESTS.map((item) => item.href)).toEqual([
      SOCIAL_ROUTES.home,
      SOCIAL_ROUTES.explore,
      SOCIAL_ROUTES.create,
      SOCIAL_ROUTES.dms,
      SOCIAL_ROUTES.profile,
    ]);
    expect(housePhoneDestinations(false, "social").map((item) => item.label)).toEqual([
      "Feed",
      "Explore",
      "Create",
      "Messages",
      "Profile",
    ]);
    expect(housePhoneDestinations(false, "social").map((item) => item.href)).toEqual([
      SOCIAL_ROUTES.home,
      SOCIAL_ROUTES.explore,
      SOCIAL_ROUTES.create,
      SOCIAL_ROUTES.dms,
      SOCIAL_ROUTES.profile,
    ]);
    expect(HOUSE_PHONE_DEST_CHIPS.label).toBe("Destinations");
    expect(HOUSE_PHONE_DEST_ITEM_ON_CLASS).toContain("bg-ink");
    expect(HOUSE_PHONE_DEST_ITEM_OFF_CLASS).toContain("bg-surface-muted");

    navigation.pathname = "/titles";
    const aggregation = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "aggregation" }),
    );
    expect(aggregation).toContain("data-house-phone-dest-chips");
    expect(aggregation).toContain('data-house-phone-dest-workspace="aggregation"');
    expect(aggregation).toContain('data-house-phone-dest="Dashboard"');
    expect(aggregation).toContain('data-house-phone-dest="Titles"');
    expect(aggregation).not.toContain('data-house-phone-dest="Queue"');
    expect(aggregation).not.toContain(ASK_GLOBEE.headline);
    expect(aggregation).not.toContain("data-mobile-nav-trigger");

    navigation.pathname = "/queue";
    const staff = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "aggregation", isGcStaff: true }),
    );
    expect(staff).toContain('data-house-phone-dest="Queue"');
    expect(staff).toContain('data-house-phone-dest="Channels"');
    expect(staff).not.toContain(ASK_GLOBEE.headline);

    navigation.pathname = "/social/courses";
    const education = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "education" }),
    );
    expect(education).toContain('data-house-phone-dest-workspace="education"');
    expect(education).toContain('data-house-phone-dest="Education"');
    expect(education).not.toContain('data-house-phone-dest="Dashboard"');

    navigation.pathname = "/social/explore";
    const social = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "social" }),
    );
    expect(social).toContain('data-house-phone-dest="Feed"');
    expect(social).toContain('data-house-phone-dest="Explore"');
    expect(social).toContain('data-house-phone-dest="Create"');
    expect(social).toContain('data-house-phone-dest="Messages"');
    expect(social).toContain('data-house-phone-dest="Profile"');
    expect(social).not.toContain('data-house-phone-dest="Home"');
    expect(social.indexOf('data-house-phone-dest="Feed"')).toBeLessThan(
      social.indexOf('data-house-phone-dest="Explore"'),
    );
    expect(social).toContain(`href="${SOCIAL_ROUTES.home}"`);
    expect(social).not.toContain("data-social-tab-bar");

    navigation.pathname = SOCIAL_ROUTES.home;
    const socialFeed = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "social" }),
    );
    expect(socialFeed).toMatch(
      /<a[^>]+href="\/social"[^>]*aria-current="page"[^>]*data-house-phone-dest="Feed"/,
    );
    expect(socialFeed).not.toMatch(
      /<a[^>]+href="\/social\/explore"[^>]*aria-current="page"/,
    );

    navigation.pathname = "/social/create";
    const socialCreate = renderToStaticMarkup(
      createElement(HousePhoneDestChips, { workspace: "social" }),
    );
    expect(socialCreate).not.toMatch(
      /<a[^>]+href="\/social"[^>]*aria-current="page"/,
    );
  });

  it("mounts one HousePhoneAppShell on every workspace and keeps Social off a second float", () => {
    expect(shellSrc).toContain("<HousePhoneAppShell");
    expect(shellSrc.match(/<HousePhoneAppShell/g)?.length).toBe(2);
    expect(shellSrc).not.toContain("SocialMobileTabBar");
    expect(shellSrc).not.toContain("data-social-tab-bar");
    expect(shellSrc).not.toContain("SocialPhoneDests");
    expect(shellSrc).toContain("HousePhoneDestChips");
    expect(shellSrc).toContain("HOUSE_PHONE_BOTTOM_NAV_PAD_CLASS");

    navigation.pathname = "/home";
    const home = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "aggregation" },
        createElement(HouseLeadChrome, {
          workspace: "aggregation",
          accountMenu: createElement("div", { "data-user-menu-host": "" }),
        }),
      ),
    );
    expect(home).toContain("data-house-phone-app-shell");
    expect(home).toContain("data-house-phone-bottom-nav");
    expect(home).not.toContain("data-app-header-workspace-pill");
    expect(home).not.toContain("data-social-tab-bar");
    expect(home).not.toContain("data-house-phone-dest-chips");
    expect(home).not.toContain("data-mobile-nav-trigger");
    expect(home).toContain('data-workspace-switcher-presentation="pills"');

    navigation.pathname = "/social";
    const social = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "social" },
        createElement(HouseLeadChrome, {
          workspace: "social",
          destChips: createElement(HousePhoneDestChips, { workspace: "social" }),
          accountMenu: createElement("div", { "data-user-menu-host": "" }),
        }),
      ),
    );
    expect(social).toContain("data-house-phone-bottom-nav");
    expect(social).toContain("data-house-phone-dest-chips");
    expect(social).toContain('data-house-phone-dest="Feed"');
    expect(social).toContain('data-house-phone-dest="Explore"');
    expect(social).toContain('data-house-phone-dest="Create"');
    expect(social).toContain('data-house-phone-dest="Messages"');
    expect(social).toContain('data-house-phone-dest="Profile"');
    expect(social.indexOf('data-house-phone-dest="Feed"')).toBeLessThan(
      social.indexOf('data-house-phone-dest="Explore"'),
    );
    expect(social).not.toContain('data-house-phone-dest="Home"');
    expect(social).not.toContain("data-social-tab-bar");
    expect(social).not.toContain('data-social-tab-item="Create"');
    expect(social).not.toContain("data-app-header-workspace-pill");
    expect((social.match(/data-house-phone-bottom-nav=""/g) ?? []).length).toBe(1);
    expect((social.match(/data-house-phone-dest-chips=""/g) ?? []).length).toBe(1);

    navigation.pathname = "/social/courses";
    const education = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "education" },
        createElement(HouseLeadChrome, {
          workspace: "education",
          destChips: createElement(HousePhoneDestChips, { workspace: "education" }),
          accountMenu: createElement("div", { "data-user-menu-host": "" }),
        }),
      ),
    );
    expect(education).toContain("data-house-phone-bottom-nav");
    expect(education).toContain("data-house-phone-dest-chips");
    expect(education).toContain('data-house-phone-dest="Education"');
    expect(education).not.toContain("data-social-tab-bar");
    expect(education).toContain('data-workspace-switcher-presentation="pills"');

    const wrapped = renderToStaticMarkup(
      createElement(
        HousePhoneAppShell,
        { workspace: "aggregation" },
        createElement(SocialTopBar, { email: "ada@example.com" }),
      ),
    );
    expect(wrapped).toContain("data-house-phone-app-shell");
    expect(wrapped).toContain("data-house-phone-bottom-nav");
    expect(wrapped).toContain("data-house-lead-chrome");
  });
});
