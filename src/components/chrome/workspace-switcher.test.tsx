import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
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

import { availableWorkspaceOptions } from "@/lib/workspace-menu";
import {
  APP_HEADER_LEADING_CLASS,
  APP_HEADER_TRAILING_CLUSTER_CLASS,
  WORKSPACE_SWITCHER,
  WORKSPACE_SWITCHER_ABSENT,
  WORKSPACE_SWITCHER_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_HEADER_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS,
  WORKSPACE_SWITCHER_OPTION_CLASS,
  WORKSPACE_SWITCHER_OPTION_LABEL_CLASS,
  WORKSPACE_SWITCHER_SEGMENTS_CLASS,
  WORKSPACE_SWITCHER_SEGMENT_OFF_CLASS,
  WORKSPACE_SWITCHER_SEGMENT_ON_CLASS,
  workspaceSwitcherChevronClass,
} from "@/lib/workspace-switcher";
import { WorkspaceSwitcher } from "./workspace-switcher";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "workspace-switcher.tsx"), "utf8");
const shellSrc = readFileSync(join(here, "app-shell.tsx"), "utf8");
const leadSrc = readFileSync(join(here, "house-lead-chrome.tsx"), "utf8");
const sheetSrc = readFileSync(join(here, "account-sheet.tsx"), "utf8");
const userMenuSrc = readFileSync(join(here, "../../lib/user-menu.ts"), "utf8");

describe("workspace switcher header control", () => {
  it("shows the workspace name only on the trigger — no leading mark", () => {
    const html = renderToStaticMarkup(<WorkspaceSwitcher current="aggregation" />);
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("data-workspace-switcher-current");
    expect(html).toContain("Aggregation");
    expect(html).not.toContain("data-workspace-switcher-mark");
    expect(html).toContain("data-workspace-switcher-chevron");
    expect(html).toContain(WORKSPACE_SWITCHER_CHEVRON_CLASS);
    expect(html).not.toContain('data-workspace-switcher-chevron-open');
    expect(html).not.toContain("/education");
    expect(leadSrc).toContain('tone="pill"');
    expect(leadSrc).toContain('<WorkspaceSwitcher current={workspace} options={workspaceOptions} presentation="pills" />');
    expect(leadSrc).toContain('presentation="sheet"');
    expect(leadSrc.match(/<WorkspaceSwitcher/g)?.length).toBe(2);
    expect(shellSrc).not.toContain("data-workspace-switcher-rail");
    expect(shellSrc).not.toContain("data-workspace-switcher-lead");
    expect(leadSrc.indexOf("<WorkspaceSwitcher")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));
    expect(existsSync("src/components/social/social-top-bar.tsx")).toBe(false);
    expect(leadSrc).toContain("HouseLeadChrome");
    const triggerAt = src.lastIndexOf("data-workspace-switcher-trigger");
    const triggerSrc = src.slice(triggerAt, src.indexOf("</button>", triggerAt));
    expect(triggerSrc).toContain("data-workspace-switcher-current");
    expect(triggerSrc).not.toContain("WorkspaceMark");
    expect(triggerSrc).not.toContain("WorkspaceLeadMark");
    expect(triggerSrc).not.toContain("data-workspace-switcher-mark");
    expect(src).toContain("createPortal");
    expect(src).toContain("workspaceSwitcherMenuStyle");
    expect(src).toContain("workspaceSwitcherChromeClearanceBottoms");
  });

  it("keeps the phone sheet trigger as word + chevron — no letter mark", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="social" presentation="sheet" tone="pill" />,
    );
    expect(html).toContain('data-workspace-switcher-tone="pill"');
    expect(html).toContain('data-workspace-switcher-presentation="sheet"');
    expect(html).toContain("Social");
    expect(html).toContain("data-workspace-switcher-chevron");
    expect(html).not.toContain("data-workspace-switcher-mark");
    const triggerAt = html.indexOf("data-workspace-switcher-trigger");
    const trigger = html.slice(triggerAt, html.indexOf("</button>", triggerAt));
    expect(trigger).toContain("Social");
    expect(trigger).toContain("data-workspace-switcher-current");
    expect(trigger).toContain("data-workspace-switcher-chevron");
    expect(trigger).not.toContain("data-workspace-switcher-mark");
    expect(src).not.toContain("triggerMarkId");
  });

  it("opens a phone sheet with Home · Aggregation · Social · Education only", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="social" presentation="sheet" tone="pill" defaultOpen />,
    );
    expect(html).toContain("data-workspace-switcher-sheet");
    expect(html).toContain('data-workspace-switcher-presentation="sheet"');
    expect(html).toContain("data-workspace-switcher-sheet-scrim");
    expect(html).toContain(`aria-label="${WORKSPACE_SWITCHER.close}"`);
    expect(src).toContain("WORKSPACE_SWITCHER.close");
    expect(src).not.toContain('aria-label="Close workspaces"');
    expect(html).toContain('data-workspace-switcher-option="home"');
    expect(html).toContain('data-workspace-switcher-option="aggregation"');
    expect(html).toContain('data-workspace-switcher-option="social"');
    expect(html).toContain('data-workspace-switcher-option="education"');
    expect(html).not.toContain('data-workspace-switcher-option="co-productions"');
    expect(html.indexOf('data-workspace-switcher-option="home"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-option="aggregation"'),
    );
    expect(html.indexOf('data-workspace-switcher-option="aggregation"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-option="social"'),
    );
    expect(html).toContain('data-workspace-switcher-mark="social"');
    const triggerAt = html.indexOf("data-workspace-switcher-trigger");
    const trigger = html.slice(triggerAt, html.indexOf("</button>", triggerAt));
    expect(trigger).toContain("Social");
    expect(trigger).toContain("data-workspace-switcher-current");
    expect(trigger).toContain("data-workspace-switcher-chevron");
    expect(trigger).not.toContain("data-workspace-switcher-mark");
    expect(src).not.toContain("triggerMarkId");
    expect(src).not.toContain("WorkspaceLeadMark id={triggerMarkId}");
    expect(html).not.toContain("Settings");
    expect(html).toContain('href="/home"');
    expect(html).toContain('href="/aggregation/dashboard"');
    expect(html).toContain('href="/education"');
    expect(src).toContain("prefetchHrefList");
    expect(src).toContain("phoneWorkspaceSwitcherPrefetchHrefs");
    expect(src).toContain("useHouseNavPending");
    expect(src).toContain("<Link");
    expect(src).not.toContain("persistWorkspaceCookie");
    expect(src).toContain("workspaceSwitcherPersistLane");
  });

  it("opens a quiet Workspaces heading, then Aggregation / Social / Education", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="social" defaultOpen />,
    );
    expect(html).toContain("data-workspace-switcher-popover");
    expect(html).toContain("data-workspace-switcher-header");
    expect(html).toContain(WORKSPACE_SWITCHER.heading);
    expect(html).toContain(WORKSPACE_SWITCHER_HEADER_CLASS);
    expect(html).not.toContain("data-workspace-switcher-header-name");
    expect(html).not.toContain("data-workspace-switcher-header-role");
    expect(html).not.toContain("data-workspace-switcher-settings");
    expect(html).not.toContain('href="/settings/aggregation"');
    expect(html).not.toContain('href="/settings/social"');
    expect(html).not.toContain('href="/settings/education"');
    expect(html).toContain('data-workspace-switcher-option="home"');
    expect(html).toContain('data-workspace-switcher-option="aggregation"');
    expect(html).toContain('data-workspace-switcher-option="social"');
    expect(html).toContain('data-workspace-switcher-option="education"');
    expect(html).toContain('data-workspace-switcher-option="co-productions"');
    expect(html.indexOf('data-workspace-switcher-option="home"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-option="aggregation"'),
    );
    expect(html.indexOf('data-workspace-switcher-option="education"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-option="co-productions"'),
    );
    expect(html).toContain("Home");
    expect(html).not.toContain("Overview");
    expect(html).toContain("Aggregation");
    expect(html).toContain("Social");
    expect(html).toContain("Education");
    expect(html).toContain("Co-Productions");
    expect(html).not.toContain("/education");
    expect(html).not.toContain("/account/workspace");
    for (const absent of WORKSPACE_SWITCHER_ABSENT) {
      expect(html).not.toContain(absent);
    }
    expect(src.indexOf("data-workspace-switcher-header")).toBeLessThan(
      src.indexOf("data-workspace-switcher-option"),
    );
    expect(src).not.toContain("data-workspace-switcher-header-name");
    expect(src).not.toContain("data-workspace-switcher-header-role");
    expect(src).not.toContain("data-workspace-switcher-settings");
    expect(src).not.toContain("workspaceSwitcherRole");
    expect(src).not.toContain("workspaceSwitcherShowsSettings");
    expect(src).not.toContain("workspaceSwitcherSettingsHref");
    expect(src).toContain("workspaceSwitcherPersistLane");
    expect(src).toContain("workspaceHome(option.mode)");
    expect(src).toContain("availableWorkspaceOptions");
    expect(src).toContain("mousedown");
    expect(src).toContain("Escape");
  });

  it("renders desktop sliding pills in a single track with a sliding thumb", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="social" presentation="pills" />,
    );
    expect(html).toContain('data-workspace-switcher-presentation="pills"');
    expect(html).toContain("data-workspace-switcher-pills");
    expect(html).toContain(WORKSPACE_SWITCHER_SEGMENTS_CLASS);
    expect(html).toContain("data-segmented-thumb");
    expect(html).toContain("data-segmented-item");
    expect(html).toContain('data-segmented-persist="workspace-pills"');
    expect(WORKSPACE_SWITCHER_SEGMENTS_CLASS).toContain("bg-surface-muted");
    expect(WORKSPACE_SWITCHER_SEGMENTS_CLASS).toContain("rounded-full");
    expect(WORKSPACE_SWITCHER_SEGMENTS_CLASS).not.toContain("gap-[var(--space-2)]");
    const thumbAt = html.indexOf("data-segmented-thumb");
    const firstItemAt = html.indexOf("data-segmented-item");
    expect(thumbAt).toBeGreaterThan(-1);
    expect(firstItemAt).toBeGreaterThan(thumbAt);
    expect(html).toContain('data-workspace-switcher-segment="home"');
    expect(html).toContain('data-workspace-switcher-segment="aggregation"');
    expect(html).toContain('data-workspace-switcher-segment="social"');
    expect(html).toContain('data-workspace-switcher-segment="education"');
    expect(html).toContain('data-workspace-switcher-segment="co-productions"');
    expect(html.indexOf('data-workspace-switcher-segment="home"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-segment="aggregation"'),
    );
    expect(html.indexOf('data-workspace-switcher-segment="education"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-segment="co-productions"'),
    );
    expect(html).toContain("Home");
    expect(html).not.toContain("Overview");
    expect(html).toContain("Aggregation");
    expect(html).toContain("Social");
    expect(html).toContain("Education");
    expect(html).toContain("Co-Productions");
    expect(html).not.toContain('data-workspace-switcher-segment="staff"');
    expect(html).not.toMatch(/>\s*Agg\s*</);
    expect(html).not.toMatch(/>\s*Edu\s*</);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain("aria-selected");
    expect(html).toContain(WORKSPACE_SWITCHER_SEGMENT_ON_CLASS);
    expect(html).toContain(WORKSPACE_SWITCHER_SEGMENT_OFF_CLASS);
    expect(html).not.toContain("data-workspace-switcher-trigger");
    expect(html).not.toContain("data-workspace-switcher-chevron");
    expect(html).not.toContain("data-workspace-switcher-popover");
    expect(html).not.toContain("data-workspace-switcher-mark");
    expect(html).not.toContain("/education");
    expect(html).not.toContain("/account/workspace");
    expect(src).toContain("workspaceSwitcherPersistLane");
    expect(src).toContain("workspaceHome(option.mode)");
    expect(src).toContain("availableWorkspaceOptions");
    expect(src).toContain("workspaceSwitcherSegmentLabel");
    expect(src).toContain("ArrowRight");
    expect(src).toContain("ArrowLeft");
    expect(src).toContain("workspaceSwitcherNextSegmentIndex");
    expect(src).toContain("SegmentedTrack");
    expect(src).toContain("SEGMENTED_TRACK_PERSIST.workspace");
    expect(src).toContain("segmentedItemOn");
    expect(src).toContain("({ selectedIndex })");
    expect(src).not.toContain("setPending");
    expect(src).not.toContain("pendingIndex");
    expect(src).toContain("overviewLeadActiveIndex");
    expect(src).toContain("activeIndex={routeIndex}");
    expect(src).not.toContain("activeIndex >= 0 ? activeIndex : 0");
    expect(src).not.toContain("routeIndex >= 0 ? routeIndex : 0");
    expect(src).not.toContain('"Agg"');
    expect(src).not.toContain('"Edu"');
    expect(src).not.toContain("ellipsis");
    for (const absent of WORKSPACE_SWITCHER_ABSENT) {
      expect(html).not.toContain(absent);
    }
  });

  it("shows Staff in the switcher only when the GC-staff options are passed", () => {
    const staffOptions = availableWorkspaceOptions({ isGcStaff: true });
    const memberHtml = renderToStaticMarkup(
      <WorkspaceSwitcher current="aggregation" presentation="pills" />,
    );
    const staffHtml = renderToStaticMarkup(
      <WorkspaceSwitcher current="staff" options={staffOptions} presentation="pills" />,
    );
    expect(memberHtml).not.toContain('data-workspace-switcher-segment="staff"');
    expect(staffHtml).toContain('data-workspace-switcher-segment="staff"');
    expect(staffHtml).toContain("Staff");
    expect(staffHtml).not.toContain("Team");
    expect(staffHtml).not.toContain("Ops");
    expect(staffOptions.map((option) => option.mode)).toContain("staff");
    expect(leadSrc).toContain("availableWorkspaceOptions({ isGcStaff })");
    expect(leadSrc).toContain("isGcStaff = false");
  });

  it("keeps Home leftmost when only one workspace lane is reachable", () => {
    const [only] = availableWorkspaceOptions();
    expect(only).toBeDefined();
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current={only!.mode} options={[only!]} presentation="pills" />,
    );
    expect(html).toContain('data-workspace-switcher-presentation="pills"');
    expect(html).toContain("data-workspace-switcher-pills");
    expect(html).toContain('data-workspace-switcher-segment="home"');
    expect(html).toContain(`data-workspace-switcher-segment="${only!.mode}"`);
    expect(html.indexOf('data-workspace-switcher-segment="home"')).toBeLessThan(
      html.indexOf(`data-workspace-switcher-segment="${only!.mode}"`),
    );
    expect(html).not.toContain("data-workspace-switcher-trigger");
    expect(html).not.toContain("data-workspace-switcher-chevron");
  });

  it("hides a missing lane instead of rendering a dead pill", () => {
    const reachable = availableWorkspaceOptions().filter((option) => option.mode !== "education");
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="aggregation" options={reachable} presentation="pills" />,
    );
    expect(html).toContain('data-workspace-switcher-segment="home"');
    expect(html).toContain('data-workspace-switcher-segment="aggregation"');
    expect(html).toContain('data-workspace-switcher-segment="social"');
    expect(html).not.toContain('data-workspace-switcher-segment="education"');
    expect(html).not.toContain("Education");
    expect(html).toContain('data-workspace-switcher-segment="co-productions"');
    expect(html).toContain("Co-Productions");
  });

  it("keeps the chevron so Home stays reachable when only one workspace is listed", () => {
    const [only] = availableWorkspaceOptions();
    expect(only).toBeDefined();
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current={only!.mode} options={[only!]} />,
    );
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("data-workspace-switcher-current");
    expect(html).toContain(only!.label);
    expect(html).toContain("data-workspace-switcher-chevron");
    expect(html).toContain("data-workspace-switcher-trigger");
    expect(html).not.toContain("data-workspace-switcher-popover");
  });

  it("reveals the chevron only while the menu is open", () => {
    const closed = renderToStaticMarkup(<WorkspaceSwitcher current="aggregation" />);
    const opened = renderToStaticMarkup(
      <WorkspaceSwitcher current="aggregation" defaultOpen />,
    );
    expect(closed).toContain(workspaceSwitcherChevronClass(false));
    expect(closed).not.toContain('data-workspace-switcher-chevron-open');
    expect(opened).toContain(workspaceSwitcherChevronClass(true));
    expect(opened).toContain('data-workspace-switcher-chevron-open');
  });

  it("keeps selected and unselected labels on one left edge with a trailing check", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="education" defaultOpen />,
    );
    const options = [
      ...html.matchAll(/data-workspace-switcher-option="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g),
    ];
    expect(options).toHaveLength(5);
    expect(options.map((row) => row[1])).toEqual([
      "home",
      "aggregation",
      "social",
      "education",
      "co-productions",
    ]);

    for (const [, mode, body] of options) {
      const markAt = body.indexOf("data-workspace-switcher-mark");
      const labelAt = body.indexOf("data-workspace-switcher-option-label");
      const checkAt = body.indexOf("data-workspace-switcher-option-check");
      expect(markAt).toBeGreaterThan(-1);
      expect(labelAt).toBeGreaterThan(markAt);
      expect(checkAt).toBeGreaterThan(labelAt);
      expect(body).toContain(WORKSPACE_SWITCHER_OPTION_LABEL_CLASS);
      expect(body).toContain(WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS);
      if (mode === "education") {
        const tickAt = body.indexOf("data-appearance-check");
        expect(tickAt).toBeGreaterThan(checkAt);
        expect(body).toContain(WORKSPACE_SWITCHER_OPTION_CHECK_CLASS);
      } else {
        expect(body).not.toContain("data-appearance-check");
      }
    }

    expect(src.indexOf("data-workspace-switcher-option-label")).toBeLessThan(
      src.indexOf("data-workspace-switcher-option-check"),
    );
    expect(src.indexOf("<AppearanceCheck")).toBeGreaterThan(
      src.indexOf("data-workspace-switcher-option-check"),
    );
    expect(src).not.toMatch(/<AppearanceCheck[\s\S]*data-workspace-switcher-option-label/);
    expect(WORKSPACE_SWITCHER_OPTION_CLASS).toContain("justify-between");
    expect(WORKSPACE_SWITCHER_OPTION_CLASS).toContain("px-[var(--space-4)]");
    expect(WORKSPACE_SWITCHER_OPTION_CLASS).not.toMatch(/\b(?:md|max-md):/);
  });
});

describe("workspace switcher placement", () => {
  it("keeps desktop trailing pills and the phone workspace sheet trigger", () => {
    expect(shellSrc).not.toContain("data-workspace-switcher-rail");
    expect(shellSrc).not.toContain("data-workspace-switcher-lead");
    expect(leadSrc).toContain("data-brand-emblem");
    expect(leadSrc).toContain("data-app-header-trailing");
    expect(leadSrc).toContain("data-app-header-workspace-pill");
    expect(leadSrc).toContain("APP_HEADER_LEADING_CLASS");
    expect(leadSrc).toContain("APP_HEADER_TRAILING_CLUSTER_CLASS");
    expect(leadSrc.match(/<WorkspaceSwitcher/g)?.length).toBe(2);
    expect(shellSrc).toContain("<HouseLeadChrome");
    expect(shellSrc).not.toContain("DestChipsSlot");
    const leading = leadSrc.slice(
      leadSrc.indexOf("data-app-header-leading"),
      leadSrc.indexOf("data-app-header-trailing"),
    );
    expect(leading).toContain('tone="pill"');
    expect(leading).toContain("WorkspaceSwitcher");
    const trailing = leadSrc.slice(
      leadSrc.indexOf("data-app-header-trailing"),
      leadSrc.indexOf("</header>"),
    );
    expect(trailing).toContain("data-app-header-workspace-desktop");
    expect(trailing).toContain('presentation="pills"');
    expect(trailing).not.toContain('tone="pill"');
    expect(trailing).toContain("WorkspaceSwitcher");
    expect(trailing).toContain("{trailingNav}");
    expect(trailing).toContain('data-app-header-trailing-nav="" className="md:hidden"');
    expect(trailing).toContain("<AskAssistantHeaderLink />");
    expect(trailing).toContain("<ThemeToggle />");
    expect(trailing).toContain("<ActivityBell");
    expect(trailing).toContain("{accountMenu}");
    expect(trailing.indexOf("{trailingNav}")).toBeLessThan(
      trailing.indexOf("WorkspaceSwitcher"),
    );
    expect(trailing.indexOf("WorkspaceSwitcher")).toBeLessThan(
      trailing.indexOf("<ThemeToggle />"),
    );
    expect(trailing.indexOf("<ThemeToggle />")).toBeLessThan(
      trailing.indexOf("<AskAssistantHeaderLink />"),
    );
    expect(trailing.indexOf("<AskAssistantHeaderLink />")).toBeLessThan(
      trailing.indexOf("<ActivityBell"),
    );
    expect(trailing.indexOf("<ActivityBell")).toBeLessThan(
      trailing.indexOf("{accountMenu}"),
    );
    expect(leadSrc.indexOf("data-brand-emblem")).toBeLessThan(
      leadSrc.indexOf("data-app-header-trailing"),
    );
    expect(leadSrc.indexOf("data-app-header-trailing")).toBeLessThan(
      leadSrc.indexOf("data-social-header-actions"),
    );
    expect(leadSrc.indexOf("data-app-header-trailing")).toBeLessThan(
      leadSrc.indexOf('presentation="pills"'),
    );
    expect(existsSync("src/components/social/social-top-bar.tsx")).toBe(false);
    expect(leadSrc).toContain("HOUSE_LEAD_CHROME_CLASS");
    expect(leadSrc).toContain("APP_HEADER_WORKSPACE_PILL_HOST_CLASS");
  });

  it("keeps the phone lead free of overflow-hidden so the emblem is not crushed", () => {
    expect(leadSrc).toContain("APP_HEADER_WORKSPACE_PILL_HOST_CLASS");
    expect(leadSrc).toContain("APP_HEADER_LEADING_CLASS");
    expect(src).toContain("WORKSPACE_SWITCHER_HOST_CLASS");
    expect(leadSrc).toContain("<BrandLogo />");
    expect(leadSrc).not.toContain("BrandEmblem");
    expect(APP_HEADER_LEADING_CLASS).not.toMatch(/(?:^|\s)(?:max-md:)?overflow-hidden(?:\s|$)/);
    expect(APP_HEADER_LEADING_CLASS).toContain("overflow-visible");
    expect(APP_HEADER_LEADING_CLASS).toContain("gap-[var(--space-3)]");
    expect(APP_HEADER_LEADING_CLASS).not.toContain("gap-[var(--space-1)]");
    expect(APP_HEADER_LEADING_CLASS).toContain("min-w-0");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("max-md:shrink-0");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toMatch(
      /(?:^|\s)gap-\[var\(--space-3\)\](?:\s|$)/,
    );
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).toContain("md:gap-[var(--space-2)]");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).not.toContain("gap-[var(--space-1)]");
    expect(APP_HEADER_TRAILING_CLUSTER_CLASS).not.toMatch(
      /(?:^|\s)gap-\[var\(--space-2\)\](?:\s|$)/,
    );
  });
});

describe("workspace switcher account-menu absence", () => {
  it("keeps Workspace out of the account menu list", () => {
    expect(userMenuSrc).not.toContain('kind: "workspace"');
    expect(sheetSrc).not.toContain("AccountWorkspaceRow");
    expect(sheetSrc).not.toContain("AccountWorkspaceFlyout");
    expect(sheetSrc).not.toContain("AccountSheetWorkspace");
    expect(sheetSrc).not.toContain('data-user-menu-item="workspace"');
    expect(sheetSrc).not.toContain('data-sheet-group-item="workspace"');
    expect(sheetSrc).not.toContain("data-account-menu-workspace");
  });
});
