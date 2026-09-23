import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  HOUSE_LEAD_CHROME_CLASS,
  HOUSE_LEAD_PHONE_PAD_CLASS,
} from "@/lib/house-lead-chrome";
import {
  HOUSE_CANVAS_X_CLASS,
  HOUSE_HOME_RAIL_COLUMN_CLASS,
  HOUSE_PHONE_TRAILING_GUTTER_CLASS,
  HOUSE_RAIL_FLOAT_CLASS,
  HOUSE_SHELL_GUTTER_X_CLASS,
} from "@/lib/house-shell";
import {
  HOME_CONTENT_COLUMN_PX,
  HOME_LEFT_INSET_PX,
  HOME_RIGHT_INSET_PX,
} from "@/lib/home-width-lock";
import { RAIL_WIDTH_CLASS } from "@/lib/rail-collapse";

// docs/design-locks/shell-desktop-horizontal-gutter-lock-v1.md
const tokens = readFileSync("src/app/tokens.css", "utf8");
const lead = readFileSync("src/lib/house-lead-chrome.ts", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");

describe("desktop shell horizontal gutters — lock v1", () => {
  it("G1–G2 locks the shared 32 / 44 pair and does not round the end to 48", () => {
    expect(tokens).toMatch(/--shell-gutter-inline-start:\s*32px;/);
    expect(tokens).toMatch(/--shell-gutter-inline-end:\s*44px;/);
    expect(tokens).not.toMatch(/--shell-gutter-inline-end:\s*48px;/);
    expect(tokens).not.toMatch(/--shell-gutter-inline-start:\s*16px;/);
    expect(HOUSE_SHELL_GUTTER_X_CLASS).toBe(
      "md:pl-[var(--shell-gutter-inline-start)] md:pr-[var(--shell-gutter-inline-end)]",
    );
  });

  it("G4 wires one shell class on house lead chrome", () => {
    expect(lead).toContain("HOUSE_SHELL_GUTTER_X_CLASS");
    expect(HOUSE_LEAD_CHROME_CLASS).toContain(HOUSE_SHELL_GUTTER_X_CLASS);
    expect(HOUSE_LEAD_CHROME_CLASS).not.toContain("md:px-[var(--chrome-gutter)]");
    expect(HOUSE_LEAD_CHROME_CLASS).not.toContain("md:px-[var(--content-inset)]");
    expect(shell).toContain("<HouseLeadChrome");
  });

  it("G3 aligns full-bleed home columns to the same pair", () => {
    expect(HOME_LEFT_INSET_PX).toBe(32);
    expect(HOME_RIGHT_INSET_PX).toBe(44);
    expect(HOME_CONTENT_COLUMN_PX).toBe(1364);
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).toBe(
      "w-full md:ml-[var(--shell-gutter-inline-start)] md:mr-[var(--shell-gutter-inline-end)] md:w-[calc(100%-var(--shell-gutter-inline-start)-var(--shell-gutter-inline-end))]",
    );
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).not.toContain("--content-inset");
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).not.toContain("--chrome-gutter");
    expect(tokens).toMatch(/--home-content-width:\s*1364px;/);
    expect(shell).toContain("HOUSE_HOME_RAIL_COLUMN_CLASS");
  });

  it("G5 keeps phone on the 16 trail and drops desktop shell px-16", () => {
    expect(tokens).toMatch(/--chrome-gutter:\s*16px;/);
    expect(tokens).toMatch(/--content-inset:\s*48px;/);
    expect(HOUSE_PHONE_TRAILING_GUTTER_CLASS).toBe("max-md:pr-[var(--chrome-gutter)]");
    expect(HOUSE_LEAD_PHONE_PAD_CLASS).toBe(
      "max-md:pl-[var(--space-6)] max-md:pr-[var(--chrome-gutter)]",
    );
    expect(HOUSE_LEAD_CHROME_CLASS).toContain(HOUSE_LEAD_PHONE_PAD_CLASS);
    expect(HOUSE_LEAD_CHROME_CLASS).not.toContain("md:px-[var(--chrome-gutter)]");
  });

  it("G6 leaves dest-rail and soft-nav geometry on --chrome-gutter", () => {
    expect(HOUSE_RAIL_FLOAT_CLASS).toContain("left-[var(--chrome-gutter)]");
    expect(RAIL_WIDTH_CLASS).toBe("w-[calc(var(--sidebar-width)-var(--chrome-gutter))]");
    expect(HOUSE_CANVAS_X_CLASS).toBe("px-[var(--chrome-gutter)]");
    expect(readFileSync("src/lib/house-client-shell.ts", "utf8")).not.toContain(
      "--shell-gutter",
    );
    expect(readFileSync("src/components/chrome/side-nav.tsx", "utf8")).not.toContain(
      "--shell-gutter",
    );
    expect(readFileSync("src/components/chrome/settings-rail.tsx", "utf8")).not.toContain(
      "--shell-gutter",
    );
  });
});
