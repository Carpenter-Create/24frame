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
  HOUSE_RAIL_PANEL_CLASS,
  HOUSE_SEARCH_PILL_CLASS,
} from "@/lib/house-shell";
import { EDUCATION_SEARCH } from "@/lib/education-search";
import { SOCIAL_DESKTOP_NAV } from "@/lib/nav";

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
    expect(topBar).toContain("data-social-header-search");
    expect(topBar).toContain("HOUSE_SEARCH_PILL_CLASS");

    const education = renderToStaticMarkup(createElement(EducationHeaderSearch));
    expect(education).toContain("data-education-header-search");
    expect(education).toContain(HOUSE_SEARCH_PILL_CLASS);
    expect(education).toContain(EDUCATION_SEARCH.placeholder);
    expect(education).toContain('action="/social/courses"');
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
    expect(topBar.match(/<WorkspaceSwitcher/g)?.length).toBe(1);
    expect(shell).toContain('tone="pill"');
    expect(shell).toContain("APP_HEADER_WORKSPACE_PILL_HOST_CLASS");
    expect(shell).toContain("APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS");
    expect(nav).toContain('if (workspace === "social") return { items: SOCIAL_DESKTOP_NAV, staffItems: [] }');
    expect(sideNav).toContain("staffItems");
    expect(HOUSE_RAIL_ACTIVE_CLASS).toBe("bg-accent-wash font-medium text-accent");
    expect(HOUSE_FILTER_ON_CLASS).toBe("bg-ink text-surface");
    expect(switcher).toContain("rounded-full");
    expect(switcher).not.toContain("rounded-[var(--radius-sm)]");
    expect(mobileChrome).toContain("rounded-full");
    expect(collapse).toContain("rounded-full");
    expect(socialChrome).toContain("HOUSE_RAIL_PANEL_CLASS");
    expect(topBar).toContain("rounded-full");
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
