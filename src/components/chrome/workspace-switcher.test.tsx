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
  WORKSPACE_SWITCHER_CHEVRON_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_CLASS,
  WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS,
  WORKSPACE_SWITCHER_OPTION_CLASS,
  WORKSPACE_SWITCHER_OPTION_LABEL_CLASS,
} from "@/lib/workspace-switcher";
import { WorkspaceSwitcher } from "./workspace-switcher";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "workspace-switcher.tsx"), "utf8");
const shellSrc = readFileSync(join(here, "app-shell.tsx"), "utf8");
const topBarSrc = readFileSync(join(here, "../social/social-top-bar.tsx"), "utf8");
const sheetSrc = readFileSync(join(here, "account-sheet.tsx"), "utf8");
const userMenuSrc = readFileSync(join(here, "../../lib/user-menu.ts"), "utf8");

describe("workspace switcher header control", () => {
  it("shows the current workspace word left of the avatar", () => {
    const html = renderToStaticMarkup(<WorkspaceSwitcher current="aggregation" />);
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("data-workspace-switcher-current");
    expect(html).toContain("Aggregation");
    expect(html).toContain("data-workspace-switcher-chevron");
    expect(html).toContain(WORKSPACE_SWITCHER_CHEVRON_CLASS);
    expect(html).not.toContain("/education");
    expect(shellSrc).toContain("<WorkspaceSwitcher current={workspace} />");
    expect(shellSrc.indexOf("<WorkspaceSwitcher")).toBeLessThan(shellSrc.indexOf("<AccountMenuSlot"));
    expect(topBarSrc).toContain("<WorkspaceSwitcher current=\"social\" />");
    expect(topBarSrc.indexOf("<WorkspaceSwitcher")).toBeLessThan(topBarSrc.indexOf("<UserMenu"));
  });

  it("opens Aggregation / Social / Education in two clicks", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="social" defaultOpen />,
    );
    expect(html).toContain("data-workspace-switcher-popover");
    expect(html).toContain('data-workspace-switcher-option="aggregation"');
    expect(html).toContain('data-workspace-switcher-option="social"');
    expect(html).toContain('data-workspace-switcher-option="education"');
    expect(html).toContain("Aggregation");
    expect(html).toContain("Social");
    expect(html).toContain("Education");
    expect(html).not.toContain("/education");
    expect(html).not.toContain("/account/workspace");
    expect(src).toContain("persistWorkspaceCookie");
    expect(src).toContain("workspaceHome(option.mode)");
    expect(src).toContain("availableWorkspaceOptions");
    expect(src).toContain("mousedown");
    expect(src).toContain("Escape");
  });

  it("drops the chevron when only one workspace is reachable", () => {
    const [only] = availableWorkspaceOptions();
    expect(only).toBeDefined();
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current={only!.mode} options={[only!]} />,
    );
    expect(html).toContain("data-workspace-switcher");
    expect(html).toContain("data-workspace-switcher-current");
    expect(html).toContain(only!.label);
    expect(html).not.toContain("data-workspace-switcher-chevron");
    expect(html).not.toContain("data-workspace-switcher-trigger");
    expect(html).not.toContain("data-workspace-switcher-popover");
    expect(html).not.toContain("<svg");
  });

  it("keeps selected and unselected labels on one left edge with a trailing check", () => {
    const html = renderToStaticMarkup(
      <WorkspaceSwitcher current="education" defaultOpen />,
    );
    const options = [
      ...html.matchAll(/data-workspace-switcher-option="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g),
    ];
    expect(options).toHaveLength(3);

    for (const [, mode, body] of options) {
      const labelAt = body.indexOf("data-workspace-switcher-option-label");
      const checkAt = body.indexOf("data-workspace-switcher-option-check");
      expect(labelAt).toBeGreaterThan(-1);
      expect(checkAt).toBeGreaterThan(labelAt);
      expect(body).toContain(WORKSPACE_SWITCHER_OPTION_LABEL_CLASS);
      expect(body).toContain(WORKSPACE_SWITCHER_OPTION_CHECK_GUTTER_CLASS);
      if (mode === "education") {
        const markAt = body.indexOf("data-appearance-check");
        expect(markAt).toBeGreaterThan(checkAt);
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
