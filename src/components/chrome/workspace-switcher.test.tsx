import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

import { availableWorkspaceOptions } from "@/lib/workspace-menu";
import {
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
const topBarSrc = readFileSync(join(here, "../social/social-top-bar.tsx"), "utf8");
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
    expect(leadSrc).toContain('<WorkspaceSwitcher current={workspace} tone="pill" />');
    expect(leadSrc).toContain('<WorkspaceSwitcher current={workspace} presentation="pills" />');
    expect(leadSrc.match(/<WorkspaceSwitcher/g)?.length).toBe(2);
    expect(shellSrc).not.toContain("data-workspace-switcher-rail");
    expect(shellSrc).not.toContain("data-workspace-switcher-lead");
    expect(leadSrc.indexOf("<WorkspaceSwitcher")).toBeLessThan(leadSrc.indexOf("{accountMenu}"));
    expect(topBarSrc).toContain("HouseLeadChrome");
    expect(topBarSrc).toContain('workspace="social"');
    expect(topBarSrc).toContain("<UserMenu");
    const triggerSrc = src.slice(
      src.indexOf("data-workspace-switcher-trigger"),
      src.indexOf("data-workspace-switcher-popover"),
    );
    expect(triggerSrc).toContain("data-workspace-switcher-current");
    expect(triggerSrc).not.toContain("WorkspaceMark");
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
    expect(html).toContain('data-workspace-switcher-option="overview"');
    expect(html).toContain('data-workspace-switcher-option="aggregation"');
    expect(html).toContain('data-workspace-switcher-option="social"');
    expect(html).toContain('data-workspace-switcher-option="education"');
    expect(html.indexOf('data-workspace-switcher-option="overview"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-option="aggregation"'),
    );
    expect(html).toContain("Overview");
    expect(html).toContain("Aggregation");
    expect(html).toContain("Social");
    expect(html).toContain("Education");
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
    expect(src).toContain("persistWorkspaceCookie");
    expect(src).toContain("workspaceHome(option.mode)");
    expect(src).toContain("availableWorkspaceOptions");
    expect(src).toContain("mousedown");
    expect(src).toContain("Escape");
  });

  it("renders desktop sliding pills for available lanes only", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="social" presentation="pills" />,
    );
    expect(html).toContain('data-workspace-switcher-presentation="pills"');
    expect(html).toContain("data-workspace-switcher-pills");
    expect(html).toContain(WORKSPACE_SWITCHER_SEGMENTS_CLASS);
    expect(html).toContain('data-workspace-switcher-segment="overview"');
    expect(html).toContain('data-workspace-switcher-segment="aggregation"');
    expect(html).toContain('data-workspace-switcher-segment="social"');
    expect(html).toContain('data-workspace-switcher-segment="education"');
    expect(html.indexOf('data-workspace-switcher-segment="overview"')).toBeLessThan(
      html.indexOf('data-workspace-switcher-segment="aggregation"'),
    );
    expect(html).toContain("Overview");
    expect(html).toContain("Aggregation");
    expect(html).toContain("Social");
    expect(html).toContain("Education");
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
    expect(src).toContain("persistWorkspaceCookie");
    expect(src).toContain("workspaceHome(option.mode)");
    expect(src).toContain("availableWorkspaceOptions");
    expect(src).toContain("workspaceSwitcherSegmentLabel");
    expect(src).toContain("ArrowRight");
    expect(src).toContain("ArrowLeft");
    expect(src).toContain("workspaceSwitcherNextSegmentIndex");
    expect(src).not.toContain('"Agg"');
    expect(src).not.toContain('"Edu"');
    expect(src).not.toContain("ellipsis");
    for (const absent of WORKSPACE_SWITCHER_ABSENT) {
      expect(html).not.toContain(absent);
    }
  });

  it("keeps Overview leftmost when only one workspace lane is reachable", () => {
    const [only] = availableWorkspaceOptions();
    expect(only).toBeDefined();
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current={only!.mode} options={[only!]} presentation="pills" />,
    );
    expect(html).toContain('data-workspace-switcher-presentation="pills"');
    expect(html).toContain("data-workspace-switcher-pills");
    expect(html).toContain('data-workspace-switcher-segment="overview"');
    expect(html).toContain(`data-workspace-switcher-segment="${only!.mode}"`);
    expect(html.indexOf('data-workspace-switcher-segment="overview"')).toBeLessThan(
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
    expect(html).toContain('data-workspace-switcher-segment="overview"');
    expect(html).toContain('data-workspace-switcher-segment="aggregation"');
    expect(html).toContain('data-workspace-switcher-segment="social"');
    expect(html).not.toContain('data-workspace-switcher-segment="education"');
    expect(html).not.toContain("Education");
  });

  it("keeps the chevron so Overview stays reachable when only one workspace is listed", () => {
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
    expect(options).toHaveLength(4);
    expect(options.map((row) => row[1])).toEqual([
      "overview",
      "aggregation",
      "social",
      "education",
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
  it("puts the phone pill after the hamburger and keeps desktop + Social trailing", () => {
    expect(shellSrc).not.toContain("data-workspace-switcher-rail");
    expect(shellSrc).not.toContain("data-workspace-switcher-lead");
    expect(leadSrc).toContain("data-brand-emblem");
    expect(leadSrc).toContain("data-app-header-trailing");
    expect(leadSrc).toContain("data-app-header-workspace-pill");
    expect(leadSrc).toContain("APP_HEADER_LEADING_CLASS");
    expect(leadSrc).toContain("APP_HEADER_TRAILING_CLUSTER_CLASS");
    expect(leadSrc.match(/<WorkspaceSwitcher/g)?.length).toBe(2);
    expect(shellSrc).toContain("<HouseLeadChrome");
    expect(shellSrc).toContain("MobileNavSlot");
    const leading = leadSrc.slice(
      leadSrc.indexOf("data-app-header-leading"),
      leadSrc.indexOf("data-app-header-trailing"),
    );
    expect(leading).toContain('tone="pill"');
    expect(leading.indexOf("{leadingNav}")).toBeLessThan(
      leading.indexOf("data-app-header-workspace-pill"),
    );
    const trailing = leadSrc.slice(
      leadSrc.indexOf("data-app-header-trailing"),
      leadSrc.indexOf("</header>"),
    );
    expect(trailing).toContain("data-app-header-workspace-desktop");
    expect(trailing).toContain('presentation="pills"');
    expect(trailing).not.toContain('tone="pill"');
    expect(trailing).toContain("WorkspaceSwitcher");
    expect(trailing).toContain("<ThemeToggle />");
    expect(trailing).toContain("{accountMenu}");
    expect(trailing.indexOf("WorkspaceSwitcher")).toBeLessThan(
      trailing.indexOf("<ThemeToggle />"),
    );
    expect(trailing.indexOf("<ThemeToggle />")).toBeLessThan(
      trailing.indexOf("{accountMenu}"),
    );
    expect(leadSrc.indexOf("data-brand-emblem")).toBeLessThan(
      leadSrc.indexOf("data-social-header-actions"),
    );
    expect(leadSrc.indexOf("data-social-header-actions")).toBeLessThan(
      leadSrc.indexOf("data-app-header-trailing"),
    );
    expect(leadSrc.indexOf("data-app-header-trailing")).toBeLessThan(
      leadSrc.indexOf('presentation="pills"'),
    );
    expect(topBarSrc).toContain("HouseLeadChrome");
    expect(topBarSrc).toContain('workspace="social"');
    expect(leadSrc).toContain("HOUSE_LEAD_CHROME_CLASS");
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
