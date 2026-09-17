import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ACCOUNT_SHEET_ABSENT } from "@/lib/account-sheet";
import {
  AVAILS_GRID_CLASS,
  AVAILS_HREF,
  AVAILS_PAGE,
  availsTilesFromRows,
  availsTitleHref,
} from "@/lib/avails";
import { DASHBOARD_HOME } from "@/lib/dashboard-home";
import { GC_NAV, NAV, mobileNavDestinations, railDestinations } from "@/lib/nav";
import { SETTINGS_RAIL_ABSENT } from "@/lib/settings";
import {
  DELIVERY_STATUS_ROW_LABELS,
  GC_TITLE_STATUS_LABELS,
  TITLE_STATUS_LABELS,
  titleDisplayStatus,
} from "@/lib/titles";
import { DELIVERY_STATUS_TRACK_STEPS, TITLE_STATUS_TRACK_STEPS } from "@/lib/status-progress";
import {
  TITLES_LANDSCAPE_ART_CLASS,
  TITLES_TILE_ART_CLASS,
  TITLES_TILE_CLASS,
} from "@/lib/titles-catalog";

describe("Avails staff surface", () => {
  it("is Team-nav only at /avails", () => {
    expect(AVAILS_PAGE.title).toBe("Avails");
    expect(AVAILS_HREF).toBe("/avails");
    expect(GC_NAV.find((item) => item.href === AVAILS_HREF)?.label).toBe(AVAILS_PAGE.title);
    expect(NAV.map((item) => item.href)).not.toContain(AVAILS_HREF);
    expect(mobileNavDestinations(false).map((item) => item.href)).not.toContain(AVAILS_HREF);
    expect(railDestinations(false).staffItems).toEqual([]);
    expect(railDestinations(true).staffItems.map((item) => item.href)).toContain(AVAILS_HREF);
    expect(SETTINGS_RAIL_ABSENT).toContain(AVAILS_PAGE.title);
    expect(ACCOUNT_SHEET_ABSENT).toContain(AVAILS_PAGE.title);
  });

  it("locks layout B: 3-wide house-gap grid of shared Titles landscape tiles", () => {
    expect(existsSync("src/app/(app)/(operator)/avails/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/avails/page.tsx")).toBe(false);
    const page = readFileSync("src/app/(app)/(operator)/avails/page.tsx", "utf8");
    expect(page).toContain("AVAILS_PAGE.title");
    expect(page).toContain("TitlesLandscapeTile");
    expect(page).toContain('from("titles")');
    expect(page).toContain('eq("status", "live")');
    expect(page).toContain("AVAILS_GRID_CLASS");
    expect(page).toContain("data-avails-grid");
    expect(page).not.toContain("TODO(design)");
    expect(page).not.toContain("status-progress-track");
    expect(page).not.toContain("StatusProgressTrack");
    expect(page).not.toContain("TitlesCatalogListRow");
    expect(page).not.toContain("BannerCard");
    expect(page).not.toContain("PosterCard");
    expect(page).not.toContain("territory");
    expect(AVAILS_GRID_CLASS).toBe("grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3");
    expect(AVAILS_GRID_CLASS).not.toContain("grid-cols-2");
    expect(AVAILS_GRID_CLASS).not.toContain("space-8");
    expect(AVAILS_GRID_CLASS).not.toContain("space-3");
    expect(TITLES_TILE_ART_CLASS).toContain(TITLES_LANDSCAPE_ART_CLASS);
    expect(TITLES_TILE_CLASS).toBe("flex flex-col gap-[var(--space-4)]");
    expect(AVAILS_PAGE.empty).toBe("No approved titles yet.");
    const loading = readFileSync("src/app/(app)/(operator)/avails/loading.tsx", "utf8");
    expect(loading).toContain("AvailsSkeleton");
    expect(existsSync("src/components/layout/page-skeletons.tsx")).toBe(true);
    expect(readFileSync("src/components/layout/page-skeletons.tsx", "utf8")).toContain(
      "data-avails-skeleton",
    );
  });
});

describe("Avails tiles", () => {
  it("links to staff title detail and uses the landscape banner only", () => {
    expect(availsTitleHref("title-1")).toBe("/gc/titles/title-1");
    const tiles = availsTilesFromRows([
      { id: "a", title: "Winter Light", bannerUrl: "https://cdn/wide.jpg" },
      { id: "b", title: "Harbor", bannerUrl: null },
    ]);
    expect(tiles).toEqual([
      { id: "a", href: "/gc/titles/a", title: "Winter Light", stillUrl: "https://cdn/wide.jpg" },
      { id: "b", href: "/gc/titles/b", title: "Harbor", stillUrl: null },
    ]);
  });
});

describe("Approved label SoT", () => {
  it("uses Approved for title and delivery live keys without renaming the enum", () => {
    expect(TITLE_STATUS_LABELS.live).toBe("Approved");
    expect(GC_TITLE_STATUS_LABELS.live).toBe("Approved");
    expect(DELIVERY_STATUS_ROW_LABELS.live).toBe("Approved");
    expect(DASHBOARD_HOME.live).toBe(TITLE_STATUS_LABELS.live);
    expect(titleDisplayStatus("live", 2, 3)).toBe("Approved · 2 of 3 platforms");
    expect(TITLE_STATUS_TRACK_STEPS.at(-1)).toBe("Approved");
    expect(DELIVERY_STATUS_TRACK_STEPS.at(-1)).toBe("Approved");
    expect(Object.keys(TITLE_STATUS_LABELS)).toContain("live");
    expect(Object.keys(TITLE_STATUS_LABELS)).not.toContain("approved");
    expect(Object.keys(DELIVERY_STATUS_ROW_LABELS)).toContain("live");
    expect(Object.keys(DELIVERY_STATUS_ROW_LABELS)).not.toContain("approved");
  });
});
