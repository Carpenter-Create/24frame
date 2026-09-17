import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { ACCOUNT_SHEET_ABSENT } from "@/lib/account-sheet";
import { AVAILS_HREF, AVAILS_PAGE } from "@/lib/avails";
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

  it("keeps the empty shell under the operator gate and does not invent a list or matrix", () => {
    expect(existsSync("src/app/(app)/(operator)/avails/page.tsx")).toBe(true);
    expect(existsSync("src/app/(app)/avails/page.tsx")).toBe(false);
    const page = readFileSync("src/app/(app)/(operator)/avails/page.tsx", "utf8");
    expect(page).toContain("TODO(design)");
    expect(page).toContain("AVAILS_PAGE.title");
    expect(page).not.toContain("status-progress-track");
    expect(page).not.toContain("TitlesCatalogListRow");
    expect(page).not.toContain("grid-cols-3");
    expect(page).not.toContain('from("titles")');
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
