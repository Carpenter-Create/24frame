import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HouseLeadChrome } from "@/components/chrome/house-lead-chrome";
import { AccountSheet, AccountMenuDropdown } from "@/components/chrome/account-sheet";
import { SocialTopBar } from "@/components/social/social-top-bar";
import {
  HOUSE_LEAD_CHROME_CLASS,
  HOUSE_LEAD_PHONE_PAD_CLASS,
  HOUSE_LEAD_STACK_CLASS,
} from "@/lib/house-lead-chrome";
import { HOUSE_PHONE_TRAILING_GUTTER_CLASS } from "@/lib/house-shell";
import { ASSISTANT_NAME } from "@/lib/product";
import { USER_MENU, USER_MENU_ACTIONS, USER_MENU_PHONE_ACTIONS } from "@/lib/user-menu";
import {
  APP_HEADER_DESKTOP_TRAILING_CLASS,
  APP_HEADER_LEADING_CLASS,
  APP_HEADER_TRAILING_CLUSTER_CLASS,
} from "@/lib/workspace-switcher";
import { ACCOUNT_SHEET_ITEMS, ACCOUNT_SHEET_PHONE_ITEMS } from "@/lib/account-sheet";

const leadSrc = readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8");
const leadLib = readFileSync("src/lib/house-lead-chrome.ts", "utf8");
const sheetSrc = readFileSync("src/components/chrome/account-sheet.tsx", "utf8");
const tokens = readFileSync("src/app/tokens.css", "utf8");

function htmlClass(html: string, attr: string): string {
  const start = html.indexOf(attr);
  if (start < 0) return "";
  const tag = html.slice(html.lastIndexOf("<", start), html.indexOf(">", start));
  return tag.match(/class="([^"]*)"/)?.[1] ?? "";
}

describe("phone header grammar A — trim trailing", () => {
  it("keeps phone trailing as Social search · bell · avatar", () => {
    expect(APP_HEADER_DESKTOP_TRAILING_CLASS).toBe("hidden md:contents");
    expect(leadSrc).toContain("data-app-header-desktop-trailing");
    expect(leadSrc).toContain("APP_HEADER_DESKTOP_TRAILING_CLASS");
    expect(leadSrc.indexOf("data-app-header-desktop-trailing")).toBeLessThan(
      leadSrc.indexOf("<AskAssistantHeaderLink"),
    );
    expect(leadSrc.indexOf("<AskAssistantHeaderLink")).toBeLessThan(leadSrc.indexOf("<ThemeToggle"));
    expect(leadSrc.indexOf("<ThemeToggle")).toBeLessThan(leadSrc.indexOf("<ActivityBell"));
    expect(leadSrc.indexOf("<ActivityBell")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));

    const aggregation = renderToStaticMarkup(
      createElement(HouseLeadChrome, {
        workspace: "aggregation",
        accountMenu: createElement("div", { "data-user-menu-host": "" }),
      }),
    );
    const trailing = aggregation.slice(
      aggregation.indexOf("data-app-header-trailing"),
      aggregation.indexOf("</header>"),
    );
    expect(trailing).toContain("data-app-header-desktop-trailing");
    expect(trailing).toContain(APP_HEADER_DESKTOP_TRAILING_CLASS);
    expect(trailing).toContain("data-ask-assistant-header");
    expect(trailing).toContain("data-theme-toggle");
    expect(trailing).toContain("data-activity-bell");
    expect(trailing).toContain("data-user-menu-host");
    expect(trailing.indexOf("data-activity-bell")).toBeLessThan(
      trailing.indexOf("data-user-menu-host"),
    );
    expect(trailing).not.toContain("data-social-header-actions");

    const social = renderToStaticMarkup(
      createElement(SocialTopBar, { email: "ada@example.com", name: "Ada" }),
    );
    expect(social.indexOf("data-social-header-search-icon")).toBeGreaterThan(
      social.indexOf("data-app-header-trailing"),
    );
    expect(social.indexOf("data-social-header-search-icon")).toBeLessThan(
      social.indexOf("data-activity-bell"),
    );
    expect(social.indexOf("data-activity-bell")).toBeLessThan(
      social.indexOf("data-account-sheet-trigger"),
    );
  });

  it("houses phone right air on --chrome-gutter so the avatar is not flush", () => {
    expect(tokens).toMatch(/--chrome-gutter:\s*16px;/);
    expect(HOUSE_PHONE_TRAILING_GUTTER_CLASS).toBe("max-md:pr-[var(--chrome-gutter)]");
    expect(HOUSE_LEAD_PHONE_PAD_CLASS).toBe(
      "max-md:pl-[var(--space-6)] max-md:pr-[var(--chrome-gutter)]",
    );
    expect(HOUSE_LEAD_CHROME_CLASS).toContain(HOUSE_PHONE_TRAILING_GUTTER_CLASS);
    expect(HOUSE_LEAD_CHROME_CLASS).toContain("max-md:pl-[var(--space-6)]");
    expect(HOUSE_LEAD_CHROME_CLASS).toContain("md:px-[var(--chrome-gutter)]");
    expect(HOUSE_LEAD_CHROME_CLASS).not.toContain("px-[var(--space-6)]");
    expect(leadLib).toContain("HOUSE_PHONE_TRAILING_GUTTER_CLASS");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("max-md:shrink-0");
  });

  it("does not reintroduce lead-row overflow-hidden from #412", () => {
    expect(APP_HEADER_LEADING_CLASS).not.toMatch(/(?:^|\s)(?:max-md:)?overflow-hidden(?:\s|$)/);
    expect(APP_HEADER_LEADING_CLASS).toContain("overflow-visible");
    expect(HOUSE_LEAD_STACK_CLASS).not.toMatch(/overflow-hidden/);
    expect(HOUSE_LEAD_CHROME_CLASS).not.toMatch(/(?:^|\s)(?:max-md:)?overflow-hidden(?:\s|$)/);

    const html = renderToStaticMarkup(
      createElement(HouseLeadChrome, {
        workspace: "aggregation",
        leadingNav: createElement("button", { "data-mobile-nav-trigger": "" }),
        accountMenu: createElement("div", { "data-user-menu-host": "" }),
      }),
    );
    for (const attr of [
      'data-app-header=""',
      'data-app-header-leading=""',
      'data-app-header-workspace-pill=""',
    ]) {
      expect(htmlClass(html, attr)).not.toMatch(/(?:^|\s)(?:max-md:)?overflow-hidden(?:\s|$)/);
    }
  });

  it("moves phone Ask + Appearance onto the avatar sheet, not the desktop panel", () => {
    expect(USER_MENU_PHONE_ACTIONS.map((item) => item.kind)).toEqual([
      "profile",
      "settings",
      "askAssistant",
      "appearance",
    ]);
    expect(USER_MENU.askAssistant).toBe(ASSISTANT_NAME);
    expect(USER_MENU.askAssistantHref).toBe("/messages");
    expect(ACCOUNT_SHEET_PHONE_ITEMS).toBe(USER_MENU_PHONE_ACTIONS);
    expect(ACCOUNT_SHEET_ITEMS).toBe(USER_MENU_ACTIONS);
    expect(ACCOUNT_SHEET_ITEMS.map((item) => item.kind)).toEqual(["profile", "settings"]);

    const sheet = renderToStaticMarkup(
      createElement(AccountSheet, {
        email: "ada@example.com",
        pathname: "/",
        onClose: () => undefined,
      }),
    );
    expect(sheet).toContain('data-sheet-group-item="profile"');
    expect(sheet).toContain('data-sheet-group-item="settings"');
    expect(sheet).toContain('data-sheet-group-item="askAssistant"');
    expect(sheet).toContain('data-sheet-group-item="appearance"');
    expect(sheet).toContain(ASSISTANT_NAME);
    expect(sheet).toContain('href="/messages"');
    expect(sheet).toContain(USER_MENU.appearance);
    expect(sheet).toContain("data-account-menu-appearance-mode");
    expect(sheetSrc).toContain("AccountSheetAppearance");
    expect(sheetSrc).toContain("applyDocumentThemePreference");
    expect(sheetSrc).not.toContain("/account/appearance");

    const dropdown = renderToStaticMarkup(
      createElement(AccountMenuDropdown, {
        email: "ada@example.com",
        pathname: "/",
        onClose: () => undefined,
      }),
    );
    expect(dropdown).toContain('data-sheet-group-item="profile"');
    expect(dropdown).toContain('data-sheet-group-item="settings"');
    expect(dropdown).not.toContain('data-sheet-group-item="askAssistant"');
    expect(dropdown).not.toContain('data-sheet-group-item="appearance"');
    expect(dropdown).not.toContain(ASSISTANT_NAME);
    expect(dropdown).not.toContain(USER_MENU.appearance);
  });
});
