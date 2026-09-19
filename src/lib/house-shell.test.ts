import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { EducationCourseRail } from "@/app/(app)/(operator)/education/manage/education-course-rail";
import { SocialRailAccountChip } from "@/components/social/social-rail-extras";
import { HouseLeadChrome } from "@/components/chrome/house-lead-chrome";
import { HouseLeadSearch } from "@/components/chrome/house-lead-search";
import { UserMenu } from "@/components/chrome/user-menu";
import { PageHeader } from "@/components/ui/page-header";
import {
  DASHBOARD_CARD_PAD,
  DASHBOARD_PERIOD_OPTION_SELECTED_CLASS,
  DASHBOARD_RELATED_GAP_CLASS,
  DASHBOARD_SECTION_AIR_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS,
  DASHBOARD_TOP_PILL_BUTTON_ON_CLASS,
} from "@/lib/dashboard-craft";
import {
  HOUSE_CARD_PAD,
  HOUSE_FILTER_OFF_CLASS,
  HOUSE_FILTER_ON_CLASS,
  HOUSE_MODULE_CLASS,
  HOUSE_PAGE_CANVAS_CLASS,
  HOUSE_PERIOD_SELECTED_CLASS,
  HOUSE_RAIL_ACTIVE_CLASS,
  HOUSE_RAIL_IDLE_CLASS,
  HOUSE_RAIL_ITEM_CLASS,
  HOUSE_RAIL_PANEL_CLASS,
  HOUSE_RAIL_TITLE_CLASS,
  HOUSE_RELATED_GAP_CLASS,
  HOUSE_HEADER_SEARCH_GAP_CLASS,
  HOUSE_SEARCH_PILL_CLASS,
  HOUSE_SECTION_AIR_CLASS,
  HOUSE_CHROME_GUTTER,
  HOUSE_CHROME_GUTTER_X_CLASS,
  HOUSE_PHONE_TRAILING_GUTTER_CLASS,
  HOUSE_CANVAS_X_CLASS,
  HOUSE_ACCESS_RAIL_WIDTH,
  HOUSE_HOME_CONTENT_WIDTH,
  HOUSE_HOME_RAIL_COLUMN_CLASS,
  HOUSE_RAIL_FLOAT_CLASS,
} from "@/lib/house-shell";
import { TEXT_ACTION_CLASS } from "@/lib/house-sheet";
import { SOCIAL_PILL_ACTIVE_CLASS, SOCIAL_PILL_IDLE_CLASS } from "@/lib/social-chrome";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/education/manage/orientation",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/(app)/(operator)/education/manage/actions", () => ({
  reorderEducationCourses: vi.fn(),
  createEducationCourse: vi.fn(),
  uploadEducationCover: vi.fn(),
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
  return { __esModule: true, default: MockLink, useLinkStatus: () => ({ pending: false }) };
});

const tokens = readFileSync("src/app/tokens.css", "utf8");
const globals = readFileSync("src/app/globals.css", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const sideNav = readFileSync("src/components/chrome/side-nav.tsx", "utf8");
const socialChrome = readFileSync("src/lib/social-chrome.ts", "utf8");
const destChips = readFileSync("src/lib/house-phone-shell.ts", "utf8");
const educationRail = readFileSync(
  "src/app/(app)/(operator)/education/manage/education-course-rail.tsx",
  "utf8",
);
const educationShell = readFileSync(
  "src/app/(app)/(operator)/education/manage/education-shell.tsx",
  "utf8",
);
const card = readFileSync("src/components/ui/card.tsx", "utf8");
const pageHeader = readFileSync("src/components/ui/page-header.tsx", "utf8");

const HOUSE_SHELL_COMMENT_PATHS = [
  "src/lib/house-shell.ts",
  "src/lib/dashboard-craft.ts",
  "src/app/tokens.css",
  "src/app/globals.css",
  "src/components/chrome/app-shell.tsx",
  "src/components/chrome/side-nav.tsx",
  "src/components/chrome/house-lead-search.tsx",
  "src/lib/house-lead-chrome.ts",
  "src/components/chrome/house-lead-chrome.tsx",
  "src/lib/social-chrome.ts",
  "src/app/(app)/(operator)/education/manage/education-shell.tsx",
  "src/app/(app)/(operator)/education/manage/education-course-rail.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/page-header.tsx",
  "src/components/chrome/house-page-search.tsx",
  "src/components/chrome/house-page-select.tsx",
  "src/lib/house-page-select.ts",
] as const;

describe("house shell rematch — Aggregation · Social · Education", () => {
  it("keeps one canvas, card, and accent wash for every workspace", () => {
    expect(tokens).toMatch(/--bg:\s*#ffffff;/);
    expect(tokens).toMatch(/--surface:\s*#ffffff;/);
    expect(tokens).toMatch(/--surface-muted:\s*#f4f4f6;/);
    expect(tokens).toMatch(/--text:\s*#14171a;/);
    expect(tokens).toMatch(/--accent:\s*#1769ff;/);
    expect(tokens).toMatch(/--radius-lg:\s*16px;/);
    expect(tokens).toMatch(/--content-inset:\s*48px;/);
    expect(tokens).toMatch(/--chrome-gutter:\s*16px;/);
    expect(tokens).toMatch(/--access-rail-width:\s*220px;/);
    expect(tokens).toMatch(/--home-content-width:\s*1376px;/);
    expect(tokens).toContain("--accent-wash:");
    expect(tokens).toMatch(/Aggregation · Social · Education/);
    expect(tokens).not.toMatch(/--radius-lg:\s*14px;/);
    expect(tokens).not.toMatch(/\[data-(?:dashboard|social|education)[^\]]*\]/);
    expect(globals).toMatch(/\.card-surface\s*\{[\s\S]*?border-radius:\s*var\(--radius-lg\)/);
    expect(globals).toMatch(/\.card-surface\s*\{[\s\S]*?box-shadow:\s*none/);
    expect(existsSync("src/app/tokens-social.css")).toBe(false);
    expect(existsSync("src/app/tokens-education.css")).toBe(false);
    expect(existsSync("src/app/tokens-aggregation.css")).toBe(false);
    expect(HOUSE_PAGE_CANVAS_CLASS).toBe("bg-bg");
    expect(HOUSE_MODULE_CLASS).toBe(
      "rounded-[var(--radius-lg)] bg-surface-muted shadow-none",
    );
    expect(HOUSE_RAIL_PANEL_CLASS).toBe(
      "rounded-[var(--radius-lg)] border border-hairline bg-surface shadow-none",
    );
    expect(HOUSE_CARD_PAD).toBe("px-[var(--space-4)] py-[var(--space-4)]");
    expect(HOUSE_RELATED_GAP_CLASS).toBe("gap-[var(--space-2)]");
    expect(HOUSE_SECTION_AIR_CLASS).toBe("gap-[var(--space-6)]");
    expect(HOUSE_HEADER_SEARCH_GAP_CLASS).toBe("gap-[var(--space-4)]");
    expect(HOUSE_CHROME_GUTTER).toBe("var(--chrome-gutter)");
    expect(HOUSE_CHROME_GUTTER_X_CLASS).toBe("md:px-[var(--chrome-gutter)]");
    expect(HOUSE_PHONE_TRAILING_GUTTER_CLASS).toBe("max-md:pr-[var(--chrome-gutter)]");
    expect(HOUSE_CANVAS_X_CLASS).toBe("px-[var(--chrome-gutter)]");
    expect(HOUSE_ACCESS_RAIL_WIDTH).toBe("var(--access-rail-width)");
    expect(HOUSE_HOME_CONTENT_WIDTH).toBe("var(--home-content-width)");
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).toBe(
      "w-full md:ml-[var(--content-inset)] md:mr-[var(--chrome-gutter)] md:w-[calc(100%-var(--content-inset)-var(--chrome-gutter))]",
    );
    expect(HOUSE_RAIL_FLOAT_CLASS).toContain("left-[var(--chrome-gutter)]");
    expect(HOUSE_SEARCH_PILL_CLASS).toBe("rounded-full border-0 bg-surface-muted");
    expect(HOUSE_RAIL_ITEM_CLASS).toContain("rounded-full");
    expect(HOUSE_RAIL_ACTIVE_CLASS).toBe("bg-accent-wash font-medium text-accent");
    expect(HOUSE_RAIL_IDLE_CLASS).toBe("font-normal text-ink hover:bg-surface-muted");
    expect(HOUSE_FILTER_ON_CLASS).toBe("bg-ink text-surface");
    expect(HOUSE_FILTER_OFF_CLASS).toBe("bg-surface-muted text-ink");
    expect(HOUSE_PERIOD_SELECTED_CLASS).toBe("bg-surface-muted");
  });

  it("aliases Dashboard craft onto the same house classes — no workspace fork", () => {
    expect(DASHBOARD_CARD_PAD).toBe(HOUSE_CARD_PAD);
    expect(DASHBOARD_RELATED_GAP_CLASS).toBe(HOUSE_RELATED_GAP_CLASS);
    expect(DASHBOARD_SECTION_AIR_CLASS).toBe(HOUSE_SECTION_AIR_CLASS);
    expect(DASHBOARD_TOP_PILL_BUTTON_ON_CLASS).toBe(HOUSE_FILTER_ON_CLASS);
    expect(DASHBOARD_TOP_PILL_BUTTON_OFF_CLASS).toBe(HOUSE_FILTER_OFF_CLASS);
    expect(DASHBOARD_PERIOD_OPTION_SELECTED_CLASS).toBe(HOUSE_PERIOD_SELECTED_CLASS);
    expect(sideNav).toContain("HOUSE_RAIL_ACTIVE_CLASS");
    expect(sideNav).toContain("HOUSE_RAIL_IDLE_CLASS");
    expect(shell).toContain("HousePhoneAppShell");
    expect(readFileSync("src/components/chrome/house-phone-app-shell.tsx", "utf8")).toContain(
      "HOUSE_PAGE_CANVAS_CLASS",
    );
    expect(readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8")).toContain(
      "<BrandLogo />",
    );
    expect(shell).not.toContain("BrandWordmark");
    expect(card).toContain("card-surface");
    expect(card).toContain("HOUSE_CARD_PAD");
    expect(pageHeader).toContain("t-title text-ink");
    expect(pageHeader).not.toContain("t-subhead text-ink");
    expect(pageHeader).toContain("TEXT_ACTION_CLASS");
    expect(pageHeader).not.toContain("text-ink-3 transition-colors hover:text-ink-2");
    const back = renderToStaticMarkup(
      createElement(PageHeader, { title: "Industry news", backLink: { href: "/home", label: "Home" } }),
    );
    expect(back).toContain(TEXT_ACTION_CLASS);
    expect(back).toContain('href="/home"');
    expect(back).toContain("Home");
  });

  it("rematches Social header Search, rail type, filters, and tab accent", () => {
    const leadSearch = readFileSync("src/components/chrome/house-lead-search.tsx", "utf8");
    const searchSheet = readFileSync("src/components/social/social-search-sheet.tsx", "utf8");
    expect(leadSearch).toContain("HOUSE_SEARCH_PILL_CLASS");
    expect(leadSearch).toContain("placeholder:text-ink-3");
    expect(leadSearch).toContain("text-ink-3");
    // Phone search glyph rides the shared HOUSE_PHONE_CHROME_IDLE_INK_CLASS
    // ("text-ink-2") so it matches the bottom-bar off state — no ink drift
    // across search / AI / bell in the phone top trailing cluster.
    expect(searchSheet).toContain("HOUSE_PHONE_CHROME_IDLE_INK_CLASS");
    expect(leadSearch).not.toContain("rounded-[10px]");
    expect(existsSync("src/components/social/social-top-bar.tsx")).toBe(false);
    expect(socialChrome).toContain("HOUSE_FILTER_ON_CLASS");
    expect(SOCIAL_PILL_ACTIVE_CLASS).toBe(HOUSE_FILTER_ON_CLASS);
    expect(SOCIAL_PILL_IDLE_CLASS).toBe(HOUSE_FILTER_OFF_CLASS);
    expect(SOCIAL_PILL_ACTIVE_CLASS).not.toContain("bg-accent");

    const header = renderToStaticMarkup(
      createElement(HouseLeadChrome, {
        workspace: "social",
        logoVisible: "always",
        search: createElement(HouseLeadSearch, { tone: "live" }),
        trailingSearch: createElement(HouseLeadSearch, { tone: "live", presentation: "icon" }),
        accountMenu: createElement(UserMenu, { email: "ada@example.com", name: "Ada" }),
      }),
    );
    expect(header).toContain("data-social-header-search");
    expect(header).toContain(HOUSE_SEARCH_PILL_CLASS);
    expect(header).toContain("data-brand-emblem");

    const chip = renderToStaticMarkup(createElement(SocialRailAccountChip, { name: "Ada Lovelace" }));
    expect(chip).toContain("t-body-sm");
    expect(chip).toContain("Ada Lovelace");
    expect(chip).not.toContain("text-[12px]");

    const collapsedChip = renderToStaticMarkup(
      createElement(SocialRailAccountChip, { name: "Ada Lovelace", collapsed: true }),
    );
    expect(collapsedChip).toContain("data-social-rail-account");
    expect(collapsedChip).toContain('aria-label="Ada Lovelace"');
    expect(collapsedChip).toContain("justify-center");
    expect(collapsedChip).not.toContain("truncate t-body-sm");

    expect(destChips).toContain("HOUSE_FILTER_ON_CLASS");
    expect(destChips).toContain("HOUSE_FILTER_OFF_CLASS");
  });

  it("rematches the Education course rail to the house active pill", () => {
    expect(educationRail).toContain("HOUSE_RAIL_ACTIVE_CLASS");
    expect(educationRail).toContain("HOUSE_RAIL_IDLE_CLASS");
    expect(educationRail).toContain("HOUSE_CARD_PAD");
    expect(educationRail).toContain("HOUSE_MODULE_CLASS");

    expect(educationShell).toContain("HOUSE_SECTION_AIR_CLASS");
    expect(educationShell).toContain("data-gc-education");

    const html = renderToStaticMarkup(
      createElement(EducationCourseRail, {
        courses: [
          {
            id: "c1",
            slug: "orientation",
            title: "Orientation",
            description: null,
            cover_key: null,
            is_flagship_free: true,
            price_cents: null,
            catalog_code: "EDU-0001",
            status: "published",
            position: 1,
            instructor_id: null,
            created_at: "2026-09-12T14:00:00.000Z",
            instructor_name: null,
          },
        ],
        instructors: [],
      }),
    );
    const title = renderToStaticMarkup(createElement(PageHeader, { title: "Manage courses" }));
    expect(html).toContain("data-education-course-rail");
    expect(html).toContain(HOUSE_RAIL_ACTIVE_CLASS);
    expect(title).toContain("t-title text-ink");
    expect(title).toContain("Manage courses");
    expect(title).not.toContain("t-subhead");
  });

  it("keeps BrandLogo language and bans the reference-brand word from shell comments", () => {
    expect(readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8")).toContain(
      "<BrandLogo />",
    );
    expect(sideNav).toContain("BrandLogo");
    for (const path of HOUSE_SHELL_COMMENT_PATHS) {
      const src = readFileSync(path, "utf8");
      expect(src, path).not.toMatch(/Coinbase/i);
    }
  });

  it("unifies the Settings rail onto the house workspace-rail SoT — no fork", () => {
    const settingsRail = readFileSync("src/components/chrome/settings-rail.tsx", "utf8");
    const settingsLib = readFileSync("src/lib/settings.ts", "utf8");

    expect(settingsRail).toContain("HOUSE_RAIL_ITEM_CLASS");
    expect(settingsRail).toContain("HOUSE_RAIL_ACTIVE_CLASS");
    expect(settingsRail).toContain("HOUSE_RAIL_IDLE_CLASS");
    expect(settingsRail).toContain("HOUSE_RAIL_TITLE_CLASS");

    expect(settingsRail).not.toContain("SETTINGS_RAIL_ITEM_CLASS");
    expect(settingsRail).not.toContain("SETTINGS_RAIL_ACTIVE_CLASS");
    expect(settingsRail).not.toContain("SETTINGS_RAIL_IDLE_CLASS");
    expect(settingsRail).not.toContain("SETTINGS_RAIL_TITLE_CLASS");

    expect(settingsLib).not.toContain("SETTINGS_RAIL_ITEM_CLASS");
    expect(settingsLib).not.toContain("SETTINGS_RAIL_ACTIVE_CLASS");
    expect(settingsLib).not.toContain("SETTINGS_RAIL_IDLE_CLASS");
    expect(settingsLib).not.toContain("SETTINGS_RAIL_TITLE_CLASS");

    expect(HOUSE_RAIL_ACTIVE_CLASS).toBe("bg-accent-wash font-medium text-accent");
    expect(HOUSE_RAIL_IDLE_CLASS).toBe("font-normal text-ink hover:bg-surface-muted");
    expect(HOUSE_RAIL_TITLE_CLASS).toBe("px-2 pb-1 t-label text-ink-3");
    expect(HOUSE_RAIL_ITEM_CLASS).toContain("t-body-sm");
    expect(HOUSE_RAIL_ITEM_CLASS).toContain("rounded-full");

    expect(sideNav).toContain("HOUSE_RAIL_TITLE_CLASS");
    expect(sideNav).toContain("className={HOUSE_RAIL_TITLE_CLASS}");
    expect(sideNav).not.toContain('"px-2 pb-1 t-label text-ink-3"');
  });
});
