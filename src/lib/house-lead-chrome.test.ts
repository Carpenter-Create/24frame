import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/social/courses",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { HouseLeadChrome } from "@/components/chrome/house-lead-chrome";
import { HouseLeadSearch } from "@/components/chrome/house-lead-search";
import { SocialTopBar } from "@/components/social/social-top-bar";
import {
  HOUSE_LEAD_CHROME_CLASS,
  HOUSE_LEAD_LOGO_CLASS,
  HOUSE_LEAD_SCROLL_CLASS,
  HOUSE_LEAD_SEARCH_DESKTOP_CLASS,
  HOUSE_LEAD_SEARCH_PILL_CLASS,
  HOUSE_LEAD_SEARCH_WIDTH_PX,
  HOUSE_HEADER_CHROME_ICON_CLASS,
  HOUSE_HEADER_CHROME_ICON_WEIGHT,
  HOUSE_HEADER_ICON_GHOST_CLASS,
  HOUSE_LEAD_SHELL_CLASS,
  HOUSE_THEME_TOGGLE_CLASS,
} from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { HOUSE_HEADER_SEARCH_GAP_CLASS, HOUSE_SEARCH_PILL_CLASS } from "@/lib/house-shell";
import { EDUCATION_SEARCH } from "@/lib/course-search";
import { SOCIAL } from "@/lib/social";
import {
  APP_HEADER_TRAILING_CLUSTER_CLASS,
  APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS,
} from "@/lib/workspace-switcher";
import type { WorkspaceMode } from "@/lib/workspace";

const leadLib = readFileSync("src/lib/house-lead-chrome.ts", "utf8");
const leadSrc = readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const topBar = readFileSync("src/components/social/social-top-bar.tsx", "utf8");
const leadSearch = readFileSync("src/components/chrome/house-lead-search.tsx", "utf8");

function leadHtml(workspace: WorkspaceMode) {
  return renderToStaticMarkup(
    createElement(HouseLeadChrome, {
      workspace,
      logoVisible: workspace === "social" ? "always" : "desktop",
      search:
        workspace === "social"
          ? createElement(HouseLeadSearch, { tone: "live" })
          : workspace === "education"
            ? createElement(HouseLeadSearch, { tone: "quiet" })
            : undefined,
      accountMenu: createElement("div", { "data-user-menu-host": "" }),
    }),
  );
}

describe("house lead chrome — unify-lead-now G1–G9", () => {
  it("G1 ships one shared lead primitive — AppShell and SocialTopBar both mount it", () => {
    expect(existsSync("src/components/chrome/house-lead-chrome.tsx")).toBe(true);
    expect(shell).toContain("<HouseLeadChrome");
    expect(shell.match(/<HouseLeadChrome/g)?.length).toBe(2);
    expect(topBar).toContain("<HouseLeadChrome");
    expect(topBar).not.toContain("md:pl-5");
    expect(topBar).not.toContain("justify-between");
    expect(topBar).not.toContain("w-[420px]");
    expect(leadSrc).toContain("data-house-lead-chrome");
    expect(leadSrc).toContain("HOUSE_LEAD_CHROME_CLASS");
    expect(leadSrc).toContain("HOUSE_LEAD_LOGO_CLASS");
    expect(leadSrc).toContain("HOUSE_LEAD_SEARCH_DESKTOP_CLASS");
  });

  it("G2 keeps the logo in one fixed lead slot on all three workspaces", () => {
    const aggregation = leadHtml("aggregation");
    const social = leadHtml("social");
    const education = leadHtml("education");

    for (const html of [aggregation, social, education]) {
      expect(html).toContain("data-house-lead-chrome");
      expect(html).toContain(HOUSE_LEAD_CHROME_CLASS);
      expect(html).toContain("data-house-lead");
      expect(html).toContain("data-brand-emblem");
      expect(html).toContain(HOUSE_LEAD_LOGO_CLASS);
      expect(html).toContain(HOUSE_HEADER_SEARCH_GAP_CLASS);
    }

    expect(aggregation.indexOf("data-brand-emblem")).toBeLessThan(
      aggregation.indexOf("data-app-header-trailing"),
    );
    expect(social.indexOf("data-brand-emblem")).toBeLessThan(
      social.indexOf("data-house-lead-search"),
    );
    expect(education.indexOf("data-brand-emblem")).toBeLessThan(
      education.indexOf("data-house-lead-search"),
    );
  });

  it("G3 mounts Social live explore search in mid-lead at Facebook-compact width", () => {
    expect(HOUSE_LEAD_SEARCH_WIDTH_PX).toBe(240);
    expect(HOUSE_LEAD_SEARCH_DESKTOP_CLASS).toBe("hidden w-[240px] shrink-0 md:flex");
    expect(leadLib).toContain("Facebook-compact");
    expect(leadSearch).toContain("HOUSE_LEAD_SEARCH_PILL_CLASS");
    expect(leadSearch).toContain("data-social-header-search");
    expect(leadSearch).not.toContain("w-[420px]");

    const social = leadHtml("social");
    expect(social).toContain("data-house-lead-search");
    expect(social).toContain("data-social-header-search");
    expect(social).toContain(HOUSE_LEAD_SEARCH_DESKTOP_CLASS);
    expect(social).toContain(HOUSE_LEAD_SEARCH_PILL_CLASS);
    expect(social).toContain(HOUSE_SEARCH_PILL_CLASS);
    expect(social).toContain(SOCIAL.explore.searchSocial);
    expect(social).toContain('action="/social/explore"');
    expect(social).not.toContain("w-[420px]");
    expect(social.indexOf("data-house-lead-search")).toBeLessThan(
      social.indexOf("data-app-header-trailing"),
    );
  });

  it("G4 mounts Education quiet search with the same gap and width as Social", () => {
    expect(leadSearch).toContain("HOUSE_LEAD_SEARCH_PILL_CLASS");
    expect(leadSearch).not.toContain("w-[420px]");

    const social = leadHtml("social");
    const education = leadHtml("education");
    expect(education).toContain("data-house-lead-search");
    expect(education).toContain("data-education-header-search");
    expect(education).toContain(HOUSE_LEAD_SEARCH_DESKTOP_CLASS);
    expect(education).toContain(HOUSE_LEAD_SEARCH_PILL_CLASS);
    expect(education).toContain(EDUCATION_SEARCH.placeholder);
    expect(education).toContain(HOUSE_HEADER_SEARCH_GAP_CLASS);
    expect(social).toContain(HOUSE_LEAD_SEARCH_DESKTOP_CLASS);
    expect(social).toContain(HOUSE_HEADER_SEARCH_GAP_CLASS);
    expect(education).not.toContain("w-[420px]");
  });

  it("G5 leaves Aggregation mid-lead empty — no invented search", () => {
    const aggregation = leadHtml("aggregation");
    expect(aggregation).toContain("data-house-lead");
    expect(aggregation).not.toContain("data-house-lead-search");
    expect(aggregation).not.toContain("data-social-header-search");
    expect(aggregation).not.toContain("data-education-header-search");
    expect(aggregation).not.toContain("SearchField");
    expect(shell).not.toContain("SearchField");
    expect(leadLib).toContain("agg-search-no");
  });

  it("G6 keeps Aggregation logo inset identical when the search slot is empty", () => {
    const aggregation = leadHtml("aggregation");
    const social = leadHtml("social");
    expect(aggregation).toContain(HOUSE_LEAD_CHROME_CLASS);
    expect(social).toContain(HOUSE_LEAD_CHROME_CLASS);
    expect(aggregation).toContain(HOUSE_LEAD_LOGO_CLASS);
    expect(social).toContain(HOUSE_LEAD_LOGO_CLASS);
    expect(HOUSE_LEAD_CHROME_CLASS).toContain("md:px-[var(--chrome-gutter)]");
    expect(leadSrc).not.toContain("md:pl-5");
    expect(leadSrc).not.toContain("justify-between");
    expect(leadSrc).toContain("search ?");
  });

  it("G7 keeps trailing workspace switcher + 24Frame AI + sun/moon + bell + avatar on all four", () => {
    for (const workspace of ["overview", "aggregation", "social", "education"] as const) {
      const html = leadHtml(workspace);
      expect(html).toContain("data-app-header-trailing");
      expect(html).toContain(APP_HEADER_TRAILING_CLUSTER_CLASS);
      expect(html).toContain(APP_HEADER_WORKSPACE_DESKTOP_HOST_CLASS);
      expect(html).toContain('data-workspace-switcher-presentation="pills"');
      expect(html).toContain("data-ask-assistant-entry");
      expect(html).toContain("data-theme-toggle");
      expect(html).toContain("data-activity-bell");
      expect(html).toContain("data-user-menu-host");
      expect(html.indexOf('data-workspace-switcher-presentation="pills"')).toBeLessThan(
        html.indexOf("data-ask-assistant-entry"),
      );
      expect(html.indexOf("data-ask-assistant-entry")).toBeLessThan(
        html.indexOf("data-theme-toggle"),
      );
      expect(html.indexOf("data-theme-toggle")).toBeLessThan(
        html.indexOf("data-activity-bell"),
      );
      expect(html.indexOf("data-activity-bell")).toBeLessThan(
        html.indexOf("data-user-menu-host"),
      );
      expect(html).not.toContain("stroke-width");
    }
    expect(leadSrc.match(/<WorkspaceSwitcher/g)?.length).toBe(2);
    expect(leadSrc).toContain("<AskAssistantEntry />");
    expect(leadSrc).toContain("<ThemeToggle />");
    expect(leadSrc).toContain("<ActivityBell");
    expect(HOUSE_THEME_TOGGLE_CLASS).toContain("size-[44px]");
    expect(HOUSE_THEME_TOGGLE_CLASS).toContain("min-h-[44px]");
    expect(HOUSE_THEME_TOGGLE_CLASS).toContain("md:size-8");
    expect(HOUSE_THEME_TOGGLE_CLASS).toContain("rounded-full");
    expect(HOUSE_THEME_TOGGLE_CLASS).not.toContain("purple");
    expect(HOUSE_THEME_TOGGLE_CLASS).not.toContain("violet");
    expect(HOUSE_THEME_TOGGLE_CLASS).not.toContain("border-hairline");
    expect(HOUSE_THEME_TOGGLE_CLASS).not.toContain("hover:bg-surface-muted");
    expect(HOUSE_HEADER_ICON_GHOST_CLASS).toContain(HOUSE_THEME_TOGGLE_CLASS);
    expect(HOUSE_HEADER_ICON_GHOST_CLASS).toContain("hover:bg-surface-muted");
    expect(HOUSE_HEADER_ICON_GHOST_CLASS).toContain("data-[state=open]:bg-surface-muted");
    expect(HOUSE_HEADER_ICON_GHOST_CLASS).toContain("rounded-full");
    expect(leadLib).toContain("HOUSE_HEADER_ICON_GHOST_CLASS");
    expect(leadLib).toContain("soft circular ghost");
    expect(HOUSE_HEADER_CHROME_ICON_WEIGHT).toBe(PHOSPHOR_CHROME_IDLE_WEIGHT);
    expect(HOUSE_HEADER_CHROME_ICON_CLASS).toBe(PHOSPHOR_CHROME_ICON_CLASS);
    expect(HOUSE_HEADER_CHROME_ICON_WEIGHT).not.toBe("fill");
    expect(HOUSE_HEADER_CHROME_ICON_WEIGHT).not.toBe("duotone");
    expect(leadLib).toContain("HOUSE_HEADER_CHROME_ICON_WEIGHT");
  });

  it("G8 absorbs SocialTopBar — no drifted placement fork", () => {
    expect(topBar).toContain("HouseLeadChrome");
    expect(topBar).toContain('workspace="social"');
    expect(topBar).not.toContain("pl-3");
    expect(topBar).not.toContain("md:pl-5");
    expect(shell).not.toContain("SocialTopBarFromChrome");
    expect(shell).not.toContain("SocialTopBarSlot");
    expect(shell).toContain("Do not use() this at the AppShell top");

    const absorbed = renderToStaticMarkup(
      createElement(SocialTopBar, { email: "ada@example.com", name: "Ada" }),
    );
    expect(absorbed).toContain("data-house-lead-chrome");
    expect(absorbed).toContain("data-social-top-bar");
    expect(absorbed).toContain(HOUSE_LEAD_CHROME_CLASS);
    expect(absorbed).toContain(HOUSE_LEAD_SEARCH_DESKTOP_CLASS);
    expect(absorbed).not.toContain("w-[420px]");
  });

  it("G9 pins the shared lead to the viewport — page scroll lives on main", () => {
    expect(HOUSE_LEAD_CHROME_CLASS).toContain("sticky");
    expect(HOUSE_LEAD_CHROME_CLASS).toContain("top-0");
    expect(HOUSE_LEAD_CHROME_CLASS).toContain("shrink-0");
    expect(HOUSE_LEAD_SHELL_CLASS).toBe(
      "flex h-dvh flex-col overflow-hidden overscroll-none",
    );
    expect(HOUSE_LEAD_SCROLL_CLASS).toBe(
      "min-h-0 flex-1 overflow-y-auto overscroll-contain",
    );
    expect(HOUSE_LEAD_SHELL_CLASS).not.toContain("min-h-dvh");
    expect(leadLib).toContain("G9");
    expect(leadLib).toContain("not the scroll ancestor");
    expect(shell).toContain("HOUSE_LEAD_SHELL_CLASS");
    expect(shell).toContain("HOUSE_LEAD_SCROLL_CLASS");
    expect(shell.match(/HOUSE_LEAD_SHELL_CLASS/g)?.length).toBe(3);
    expect(shell.match(/HOUSE_LEAD_SCROLL_CLASS/g)?.length).toBe(3);
    expect(shell.match(/data-house-lead-scroll/g)?.length).toBe(2);
    expect(shell).not.toContain("min-h-dvh");
    expect(shell).not.toContain("min-h-[calc(100dvh-var(--header-height))]");
    expect(shell).not.toContain("minHeight: \"calc(100dvh - var(--header-height))\"");
    expect(shell).not.toContain("data-aggregation-sticky");
    expect(leadSrc).not.toContain("fixed inset-x-0");
  });
});
