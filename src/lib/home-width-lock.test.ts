import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  HOUSE_ACCESS_RAIL_WIDTH,
  HOUSE_HOME_CONTENT_WIDTH,
  HOUSE_HOME_RAIL_COLUMN_CLASS,
} from "@/lib/house-shell";
import {
  HOME_ACCESS_RAIL_INSET_PX,
  HOME_CONTENT_COLUMN_PX,
  HOME_FIGMA_FRAME_PX,
  HOME_WIDTH_LOCK,
} from "@/lib/home-width-lock";

const stamp = readFileSync("src/lib/HOME-width-lock.md", "utf8");
const tokens = readFileSync("src/app/tokens.css", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");

describe("Home width lock (Figma SoT)", () => {
  it("stamps 220 phantom rail + 1220 content at the 1440 frame", () => {
    expect(HOME_FIGMA_FRAME_PX).toBe(1440);
    expect(HOME_ACCESS_RAIL_INSET_PX).toBe(220);
    expect(HOME_CONTENT_COLUMN_PX).toBe(1220);
    expect(HOME_ACCESS_RAIL_INSET_PX + HOME_CONTENT_COLUMN_PX).toBe(HOME_FIGMA_FRAME_PX);
    expect(HOME_WIDTH_LOCK).toEqual({
      figmaFrame: 1440,
      phantomAccessRail: 220,
      contentColumn: 1220,
    });
    expect(stamp).toContain("220px left");
    expect(stamp).toContain("1220px");
    expect(stamp).toContain("1440");
    expect(stamp).toContain("Activity");
    expect(stamp).not.toMatch(/1080|--page-max-width/);
  });

  it("keeps Home off --page-max-width and matches Activity main", () => {
    expect(tokens).toMatch(/--access-rail-width:\s*220px;/);
    expect(tokens).toMatch(/--home-content-width:\s*1220px;/);
    expect(HOUSE_ACCESS_RAIL_WIDTH).toBe("var(--access-rail-width)");
    expect(HOUSE_HOME_CONTENT_WIDTH).toBe("var(--home-content-width)");
    expect(HOUSE_HOME_RAIL_COLUMN_CLASS).toBe(
      "ml-[var(--access-rail-width)] w-[calc(100%-var(--access-rail-width))]",
    );
    const homeBranch = shell.slice(
      shell.indexOf(") : homePage ? ("),
      shell.indexOf(") : messagesPage ? ("),
    );
    expect(homeBranch).toContain("HOUSE_HOME_RAIL_COLUMN_CLASS");
    expect(homeBranch).not.toContain("page-max-width");
    expect(homeBranch).not.toContain("mx-auto");
    expect(homeBranch).not.toContain("1080");
    expect(shell).toContain("data-home-chrome");
    expect(shell).toContain("overviewHidesRail");
  });
});
