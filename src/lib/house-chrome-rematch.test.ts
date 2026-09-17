import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/social/courses",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { EducationHeaderSearch } from "@/components/chrome/education-header-search";
import { SocialTopBar } from "@/components/social/social-top-bar";
import {
  HOUSE_CONTROL_PILL_CLASS,
  HOUSE_FILTER_ON_CLASS,
  HOUSE_ICON_BUTTON_CLASS,
  HOUSE_MODULE_CLASS,
  HOUSE_PAGE_CANVAS_CLASS,
  HOUSE_RAIL_ACTIVE_CLASS,
  HOUSE_RAIL_ITEM_CLASS,
  HOUSE_RAIL_PANEL_CLASS,
  HOUSE_HEADER_SEARCH_GAP_CLASS,
  HOUSE_SEARCH_PILL_CLASS,
} from "@/lib/house-shell";
import { EDUCATION_SEARCH } from "@/lib/course-search";
import { SOCIAL_DESKTOP_NAV } from "@/lib/nav";
import {
  SOCIAL_ACCOUNT_CHIP_CLASS,
  SOCIAL_FOR_YOU_CARD_CLASS,
  SOCIAL_RAIL_WIDTH_CLASS,
} from "@/lib/social-chrome";
import { SETTINGS_RAIL_ITEM_CLASS } from "@/lib/settings";

const tokens = readFileSync("src/app/tokens.css", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const topBar = readFileSync("src/components/social/social-top-bar.tsx", "utf8");
const sideNav = readFileSync("src/components/chrome/side-nav.tsx", "utf8");
const titlesPage = readFileSync("src/app/(app)/titles/page.tsx", "utf8");
const titlesCatalog = readFileSync("src/lib/titles-catalog.ts", "utf8");
const nav = readFileSync("src/lib/nav.ts", "utf8");
const switcher = readFileSync("src/lib/workspace-switcher.ts", "utf8");
const mobileChrome = readFileSync("src/lib/mobile-chrome.ts", "utf8");
const collapse = readFileSync("src/lib/rail-collapse.ts", "utf8");
const socialChrome = readFileSync("src/lib/social-chrome.ts", "utf8");
const houseShell = readFileSync("src/lib/house-shell.ts", "utf8");
const settings = readFileSync("src/lib/settings.ts", "utf8");
const educationSearch = readFileSync("src/components/chrome/education-header-search.tsx", "utf8");

const FUN_CHROME_PATHS = [
  "src/lib/house-shell.ts",
  "src/components/chrome/app-shell.tsx",
  "src/components/chrome/side-nav.tsx",
  "src/components/social/social-top-bar.tsx",
  "src/lib/social-chrome.ts",
  "src/lib/workspace-switcher.ts",
  "src/lib/mobile-chrome.ts",
  "src/lib/rail-collapse.ts",
  "src/lib/settings.ts",
  "src/components/chrome/education-header-search.tsx",
] as const;

describe("house chrome rematch miss list v1.1", () => {
  it("uses Social side nav + full-width top on Aggregation and Education — no third chrome", () => {
    expect(shell).toContain('workspace === "social" && !settingsPage');
    expect(shell).toContain("data-house-full-width-top");
    expect(shell).toContain("HOUSE_RAIL_PANEL_CLASS");
    expect(shell).toContain("top-[calc(var(--header-height)+16px)]");
    expect(shell).toContain("h-[calc(100dvh-var(--header-height)-32px)]");
    expect(shell).not.toContain("border-r border-hairline");
    expect(shell).not.toMatch(/style=\{\{ height: "var\(--header-height\)", marginLeft: "var\(--sidebar-width\)" \}\}/);
    expect(shell).toContain("<BrandEmblem />");
    expect(shell).toContain("<SideNav");
    expect(shell).not.toContain("StudioRail");
    expect(shell).not.toContain("data-studio-rail");
    expect(existsSync("src/components/chrome/studio-rail.tsx")).toBe(false);
  });

  it("keeps a white page canvas and grey r16 modules only when needed", () => {
    expect(tokens).toMatch(/--bg:\s*#ffffff;/);
    expect(tokens).not.toMatch(/--bg:\s*#fafafb;/);
    expect(tokens).toMatch(/--surface-muted:\s*#f4f4f6;/);
    expect(tokens).toMatch(/--radius-lg:\s*16px;/);
    expect(HOUSE_PAGE_CANVAS_CLASS).toBe("bg-bg");
    expect(HOUSE_MODULE_CLASS).toContain("bg-surface-muted");
    expect(HOUSE_MODULE_CLASS).toContain("rounded-[var(--radius-lg)]");
    expect(HOUSE_MODULE_CLASS).toContain("shadow-none");
    expect(HOUSE_RAIL_PANEL_CLASS).toContain("rounded-[var(--radius-lg)]");
    expect(HOUSE_CONTROL_PILL_CLASS).toBe("rounded-full");
    expect(HOUSE_ICON_BUTTON_CLASS).toBe("rounded-full");
    expect(HOUSE_SEARCH_PILL_CLASS).toContain("rounded-full");
    expect(shell).toContain("HOUSE_PAGE_CANVAS_CLASS");
    expect(globals).toMatch(/\.card-surface\s*\{[\s\S]*?box-shadow:\s*none/);
    expect(shell).not.toMatch(/shadow-(?:sm|md|lg|xl)/);
  });

  it("keeps Aggregation without top search, Education quiet, Social live", () => {
    expect(shell).not.toContain("SearchField");
    expect(shell).toContain("EducationHeaderSearch");
    expect(shell).toContain('workspace === "education" && !settingsPage');
    expect(shell).toContain('data-education-header-search-host="phone"');
    expect(shell).toContain('data-education-header-search-host="desktop"');
    expect(topBar).toContain("data-social-header-search");
    expect(topBar).toContain("HOUSE_SEARCH_PILL_CLASS");

    const education = renderToStaticMarkup(createElement(EducationHeaderSearch));
    expect(education).toContain("data-education-header-search");
    expect(education).toContain(HOUSE_SEARCH_PILL_CLASS);
    expect(education).toContain(EDUCATION_SEARCH.placeholder);
    expect(education).toContain('action="/social/courses"');
    expect(educationSearch).not.toContain("md:w-[420px]");
    expect(educationSearch).not.toContain("md:flex-none");
  });

  it("places Social and Education search beside the logo — not center-floating", () => {
    expect(HOUSE_HEADER_SEARCH_GAP_CLASS).toBe("gap-[var(--space-4)]");
    expect(topBar).toContain("data-social-header-lead");
    expect(topBar).toContain("HOUSE_HEADER_SEARCH_GAP_CLASS");
    expect(topBar).not.toContain("left-1/2");
    expect(topBar).not.toContain("-translate-x-1/2");
    expect(topBar.indexOf("data-brand-emblem")).toBeLessThan(
      topBar.indexOf("data-social-header-search"),
    );
    expect(topBar.indexOf("data-social-header-search")).toBeLessThan(
      topBar.indexOf("data-social-header-actions"),
    );
    expect(topBar.indexOf("data-social-header-lead")).toBeLessThan(
      topBar.indexOf("data-social-header-search"),
    );
    expect(topBar.indexOf("</form>")).toBeLessThan(topBar.indexOf("data-app-header-trailing"));

    const social = renderToStaticMarkup(
      createElement(SocialTopBar, { email: "ada@example.com", name: "Ada" }),
    );
    expect(social).toContain("data-social-header-lead");
    expect(social).toContain(HOUSE_HEADER_SEARCH_GAP_CLASS);
    expect(social.indexOf("data-brand-emblem")).toBeLessThan(
      social.indexOf("data-social-header-search"),
    );
    expect(social.indexOf("data-social-header-search")).toBeLessThan(
      social.indexOf("data-app-header-trailing"),
    );
    expect(social).not.toContain("left-1/2");

    const leading = shell.slice(
      shell.indexOf("data-app-header-leading"),
      shell.indexOf("data-app-header-trailing"),
    );
    const trailing = shell.slice(
      shell.indexOf("data-app-header-trailing"),
      shell.indexOf("</header>"),
    );
    expect(leading).toContain("data-app-header-brand-search");
    expect(leading).toContain("HOUSE_HEADER_SEARCH_GAP_CLASS");
    expect(leading).toContain('data-education-header-search-host="desktop"');
    expect(leading).toContain('data-education-header-search-host="phone"');
    expect(leading.indexOf("data-brand-emblem")).toBeLessThan(
      leading.indexOf('data-education-header-search-host="desktop"'),
    );
    expect(leading.indexOf('data-education-header-search-host="desktop"')).toBeLessThan(
      leading.indexOf('data-education-header-search-host="phone"'),
    );
    expect(trailing).toContain('presentation="pills"');
    expect(trailing).toContain("AccountMenuSlot");
    expect(trailing).not.toContain("EducationHeaderSearch");
    expect(trailing).not.toContain("data-education-header-search-host");
    expect(shell).not.toContain("SearchField");
  });

  it("removes the Social Messages icon from the top bar — side nav only", () => {
    expect(topBar).not.toContain("data-social-header-tray");
    expect(topBar).not.toContain("SOCIAL_ROUTES.dms");
    const header = renderToStaticMarkup(
      createElement(SocialTopBar, { email: "ada@example.com", name: "Ada" }),
    );
    expect(header).toContain("data-social-header-search");
    expect(header).not.toContain("data-social-header-tray");
    expect(SOCIAL_DESKTOP_NAV.map((item) => item.href)).toContain("/social/dms");
  });

  it("keeps one phone workspace switcher, Staff on Aggregation, one Sporty Blue pill", () => {
    expect(shell.match(/<WorkspaceSwitcher/g)?.length).toBe(2);
    expect(topBar.match(/<WorkspaceSwitcher/g)?.length).toBe(2);
    expect(shell).toContain('presentation="pills"');
    expect(topBar).toContain('presentation="pills"');
    expect(shell).toContain('tone="pill"');
    expect(shell).toContain("APP_HEADER_WORKSPACE_PILL_HOST_CLASS");
    expect(shell).toContain("APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS");
    expect(nav).toContain('if (workspace === "social") return { items: SOCIAL_DESKTOP_NAV, staffItems: [] }');
    expect(sideNav).toContain("staffItems");
    expect(HOUSE_RAIL_ACTIVE_CLASS).toBe("bg-accent-wash font-medium text-accent");
    expect(HOUSE_FILTER_ON_CLASS).toBe("bg-ink text-surface");
    expect(switcher).toContain("HOUSE_CONTROL_PILL_CLASS");
    expect(switcher).not.toContain("rounded-[var(--radius-sm)]");
    expect(mobileChrome).toContain("HOUSE_ICON_BUTTON_CLASS");
    expect(collapse).toContain("HOUSE_ICON_BUTTON_CLASS");
    expect(socialChrome).toContain("HOUSE_RAIL_PANEL_CLASS");
    expect(topBar).toContain("HOUSE_ICON_BUTTON_CLASS");
    expect(topBar).toContain("HOUSE_SEARCH_PILL_CLASS");
  });

  it("uses one rounded register on Aggregation, Social, and Education", () => {
    expect(shell.match(/left-4 top-\[calc\(var\(--header-height\)\+16px\)\]/g)?.length).toBe(2);
    expect(shell).not.toContain("fixed left-0 top-[calc(var(--header-height)+16px)]");
    expect(SOCIAL_RAIL_WIDTH_CLASS).toBe("w-[calc(200px-16px)]");
    expect(SOCIAL_ACCOUNT_CHIP_CLASS).toContain(HOUSE_MODULE_CLASS);
    expect(SOCIAL_FOR_YOU_CARD_CLASS).toContain(HOUSE_MODULE_CLASS);
    expect(SETTINGS_RAIL_ITEM_CLASS).toContain("rounded-full");
    expect(switcher).toContain("HOUSE_CONTROL_PILL_CLASS");
    expect(mobileChrome).toContain("HOUSE_ICON_BUTTON_CLASS");
    expect(collapse).toContain("HOUSE_ICON_BUTTON_CLASS");
    expect(socialChrome).toContain("HOUSE_MODULE_CLASS");
  });

  it("stays on the 24Frame social/fun chrome lane — not a professional flatten", () => {
    expect(houseShell).toMatch(/social\/fun chrome lane/);
    expect(houseShell).toMatch(/do not flatten/);
    expect(shell).toContain("data-social-workspace");
    expect(shell).toContain("data-house-full-width-top");
    expect(HOUSE_RAIL_ITEM_CLASS).toContain("rounded-full");
    expect(HOUSE_RAIL_ACTIVE_CLASS).toBe("bg-accent-wash font-medium text-accent");
    expect(HOUSE_RAIL_ACTIVE_CLASS).not.toContain("bg-ink");
    expect(HOUSE_RAIL_ACTIVE_CLASS).not.toMatch(/(?:^|[\s"])bg-accent(?:[\s"]|$)/);
    expect(HOUSE_SEARCH_PILL_CLASS).toContain("rounded-full");
    expect(HOUSE_CONTROL_PILL_CLASS).toBe("rounded-full");
    expect(HOUSE_ICON_BUTTON_CLASS).toBe("rounded-full");
    expect(HOUSE_MODULE_CLASS).toContain("rounded-[var(--radius-lg)]");
    expect(tokens).toMatch(/--accent:\s*#1769ff;/);
    expect(tokens).not.toMatch(/#f97316|#ea580c|#ff6a00|#ff7a00/i);
    expect(settings).toContain("rounded-full");
    expect(educationSearch).toContain("HOUSE_SEARCH_PILL_CLASS");
    for (const path of FUN_CHROME_PATHS) {
      const src = readFileSync(path, "utf8");
      expect(src, path).not.toMatch(/Royalogic/i);
      expect(src, path).not.toMatch(/\brl-/);
    }
  });

  it("keeps house tokens, Titles content, and Delete/Archive unmixed", () => {
    expect(tokens).toMatch(/--accent:\s*#1769ff;/);
    expect(existsSync("src/app/tokens-social.css")).toBe(false);
    expect(titlesPage).toContain("SearchField");
    expect(titlesCatalog).not.toMatch(/\bDelete\b/);
    expect(titlesPage).not.toMatch(/\bDelete\b/);
    expect(titlesPage).not.toMatch(/\bArchive\b/);
  });
});
