import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS } from "./house-page-select";
import { HOUSE_PHONE_WRAP_CLASS } from "./house-phone-stack";
import { menuLabelTruncatesOnPhone } from "./menu-host";

// CI hard gate for house chrome. `pnpm test` already runs this file.
//
// Phone never-truncate on SoT triggers is gospel (Auditor P0, house gospel
// 2026-09-19). The trigger label wraps on phone and may use md:truncate.
// A bare truncate token is not a debt pin. APP_SHEET_MODAL_PROMOTE is not
// a desktop source of truth.
// Elevation shadow on that promote path is not either.
//
// The pins below are the Auditor's open hits. This pull request does not
// restyle chrome, so those hits stay until the overlay row removes them.
// A file outside a pin fails the suite. Clearing a hit does not. Do not add
// a pin to silence a new host.

const PROMOTE_SYMBOL = "APP_SHEET_MODAL_PROMOTE";
const PROMOTE_ELEVATION = "md:shadow-[var(--elevation)]";

/** Files that still export or assert the promote symbols. */
const PROMOTE_DEBT = [
  "src/lib/house-sheet.test.ts",
  "src/lib/house-sheet.ts",
  "src/lib/social-create-sheet.test.ts",
  "src/lib/social-create-sheet.ts",
] as const;

/** Files that still put elevation on the AppSheet promote path. */
const PROMOTE_ELEVATION_DEBT = [
  "src/lib/house-sheet.test.ts",
  "src/lib/house-sheet.ts",
  "src/lib/social-create-sheet.test.ts",
] as const;

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      const rel = join(dir, entry.name).split("\\").join("/");
      if (entry.isDirectory()) {
        walk(rel);
        continue;
      }
      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) continue;
      if (rel.endsWith("house-guardrails.test.ts")) continue;
      out.push(rel);
    }
  };
  walk("src");
  return out;
}

function filesContaining(needle: string): string[] {
  return sourceFiles()
    .filter((file) => readFileSync(file, "utf8").includes(needle))
    .sort();
}

function outside(hits: readonly string[], pin: readonly string[]): string[] {
  return hits.filter((file) => !pin.includes(file));
}

describe("house guardrails", () => {
  it("fails if APP_SHEET_MODAL_PROMOTE is still exported or used as desktop SoT outside the Auditor pin", () => {
    const hits = filesContaining(PROMOTE_SYMBOL);
    expect(outside(hits, PROMOTE_DEBT)).toEqual([]);
    expect(hits.every((file) => (PROMOTE_DEBT as readonly string[]).includes(file))).toBe(
      true,
    );
  });

  it("fails if elevation shadow sits on Dialog or AppSheet promote outside the Auditor pin", () => {
    const hits = filesContaining(PROMOTE_ELEVATION);
    expect(outside(hits, PROMOTE_ELEVATION_DEBT)).toEqual([]);

    const dialog = readFileSync("src/components/ui/dialog.tsx", "utf8");
    expect(dialog).not.toContain(PROMOTE_SYMBOL);
    expect(dialog).not.toContain(PROMOTE_ELEVATION);
    const sheetClassAt = dialog.indexOf("export const DIALOG_SHEET_CLASS");
    const sheetClassEnd = dialog.indexOf("export function DialogFooter");
    expect(dialog.slice(sheetClassAt, sheetClassEnd)).not.toContain("shadow");
  });

  it("fails if AppSheet or bottom-sheet chrome is promoted behind md: desktop hosts without a dual-host gate", () => {
    const bad: string[] = [];
    for (const file of sourceFiles()) {
      const lines = readFileSync(file, "utf8").split("\n");
      const promoted = lines.some((line, index) => {
        const isPromote =
          line.includes("justify-end") &&
          line.includes("md:items-center") &&
          line.includes("md:justify-center");
        if (!isPromote) return false;
        const window = lines.slice(Math.max(0, index - 8), index + 1).join("\n");
        return !window.includes("dual-host");
      });
      if (promoted) bad.push(file);
    }
    expect(bad).toEqual([]);
  });

  it("phone never-truncate on SoT triggers is gospel", () => {
    const label = HOUSE_PAGE_SELECT_TRIGGER_LABEL_CLASS;
    const tokens = label.split(/\s+/);
    // Phone wraps. Desktop may ellipsize with md:truncate. A bare truncate
    // token still paints on the phone and is not an allowed debt string.
    expect(menuLabelTruncatesOnPhone(label)).toBe(false);
    expect(label).toContain(HOUSE_PHONE_WRAP_CLASS);
    expect(tokens).toContain("md:truncate");
    expect(tokens).not.toContain("truncate");
    expect(menuLabelTruncatesOnPhone("min-w-0 truncate")).toBe(true);
    expect(menuLabelTruncatesOnPhone("truncate")).toBe(true);
    expect(menuLabelTruncatesOnPhone("max-md:truncate")).toBe(true);

    const bare = sourceFiles().filter((file) => {
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(/TRIGGER_LABEL_CLASS\s*=\s*[^;]*;/g)].some((match) =>
        menuLabelTruncatesOnPhone(match[0]),
      );
    });
    expect(bare).toEqual([]);
  });

  it("keeps design locks in git before a UI pull request can cite them", () => {
    const readme = readFileSync("docs/design-locks/README.md", "utf8");
    expect(readme).toContain("before CoS undrafts");
    expect(readme).toContain("One lock per file");
    expect(readme).toContain("docs/design-locks/");
    expect(readme).toContain("never truncate");
    expect(readme).toContain("Never-patch lookalikes");
    expect(readme).toContain("Craft lanes");
    expect(readme).toContain("One row unlock at a time");

    const families = readFileSync(
      "docs/design-locks/mobile-menu-family-tree-v1.md",
      "utf8",
    );
    expect(families).toContain("Family A");
    expect(families).toContain("AppSheet");
    expect(families).toContain("SheetGroup");
    expect(families).toContain("Family B");
    expect(families).toContain("SettingsHubList");
    expect(families).toContain("Family C");
    expect(families).toContain("HousePageSelect");
    expect(families).toContain("Family D");
    expect(families).toContain("MobileNav");
    expect(families).toContain("## OUT");
    expect(families).toContain("No sheet cards on Settings");
    expect(families).toContain("No bare push on Account");
    expect(families).toContain("Desktop is separate");
    expect(families).toContain("## Parks");

    const audit = readFileSync(
      "docs/design-locks/house-dual-host-primitive-audit-v1.md",
      "utf8",
    );
    expect(audit).toContain("One row unlock at a time");
    expect(audit).toContain("HouseOverlay dual-host");
    expect(audit).toContain("Extend HousePageSelect");
    expect(audit).toContain("HouseField + SettingsFieldStack");
    expect(audit).toContain("HouseSegment / HouseChip");
    expect(audit).toContain("HouseEmpty / Pending / Error");
    expect(audit).toContain("P0");
    expect(audit).toContain("P1");
    expect(audit).toContain("P2");

    const overlay = readFileSync(
      "docs/design-locks/house-overlay-dual-host-v1.md",
      "utf8",
    );
    expect(overlay).toContain("The job picks the host");
    expect(overlay).toContain("Top radius 16");
    expect(overlay).toContain("Pad 16");
    expect(overlay).toContain("Close 44");
    expect(overlay).toContain("Max height 90vh");
    expect(overlay).toContain("Scrim ink 40%");
    expect(overlay).toContain("No shadow");
    expect(overlay).toContain("Max width 400 for confirm");
    expect(overlay).toContain("Max width 480 for a short form");
    expect(overlay).toContain("Pad 24");
    expect(overlay).toContain("Button footer");
    expect(overlay).toContain("width 400");
    expect(overlay).toContain("Phone never uses a side strip");
    expect(overlay).toContain("Radius 12");
    expect(overlay).toContain("Hug content");
    expect(overlay).toContain("Hairline");
    expect(overlay).toContain("No AppSheet on desktop");
    expect(overlay).toContain("No Dialog for durable settings");
    expect(overlay).toContain("No Drawer for ···");
    expect(overlay).toContain("No fifth host");
    expect(overlay).toContain("Menu body absorb is a separate lock");

    const rows = readFileSync(
      "docs/design-locks/preferences-settings-row-grammar-lock-v1.md",
      "utf8",
    );
    expect(rows).toContain("PrefDrillGroup");
    expect(rows).toContain("SETTINGS_GROUP");
    expect(rows).toContain("SettingsDrillRow");
    expect(rows).toContain("t-body-sm");
    expect(rows).toContain("44");
    expect(rows).toContain("PrefControlSection");
    expect(rows).toContain("page white");

    expect(readme).toContain("preferences-settings-row-grammar-lock-v2.md");
    expect(readme).toContain("Supersedes v1 geometry only");
    const rowsV2 = readFileSync(
      "docs/design-locks/preferences-settings-row-grammar-lock-v2.md",
      "utf8",
    );
    expect(rowsV2).toContain("Coinbase horizontal");
    expect(rowsV2).toContain("items-center");
    expect(rowsV2).toContain("Supersedes (geometry only)");
    expect(rowsV2).toContain("theme-sot-auto-lock-v1.md");
    expect(rowsV2).toContain("G1.");
    expect(rowsV2).toContain("G2.");
    expect(rowsV2).toContain("G3.");
    expect(rowsV2).toContain("G4.");
    expect(rowsV2).toContain("G5.");
    expect(rowsV2).toContain("G6.");
    expect(rowsV2).toContain("G7.");
    expect(rowsV2).toContain("never truncate");

    const theme = readFileSync("docs/design-locks/theme-sot-auto-lock-v1.md", "utf8");
    expect(theme).toContain("gc-theme");
    expect(theme).toContain("lib/theme.ts");
    expect(theme).toContain("Auto");
    expect(theme).toContain("System default");
    expect(theme).toContain("prefers-color-scheme");
    expect(theme).toContain("exits Auto");
    expect(theme).toContain("same** picker");
  });
});
