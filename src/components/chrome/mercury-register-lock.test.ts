import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  PHOSPHOR_CHROME_ACTIVE_WEIGHT,
  PHOSPHOR_CHROME_IDLE_WEIGHT,
  PHOSPHOR_CHROME_ICON_CLASS,
} from "@/lib/phosphor-icon";
import {
  SETTINGS_HEADER_BACK_CLASS,
  SETTINGS_HUB_NAV,
  SETTINGS_RAIL_CHEVRON_CLASS,
  SETTINGS_RAIL_ITEM_CLASS,
} from "@/lib/settings";
import { ACCOUNT_SHEET_ITEMS } from "@/lib/account-sheet";
import { SHEET_GROUP_CHEVRON_CLASS } from "@/lib/house-sheet";
import { RAIL_COLLAPSE_CHEVRON_ICON_CLASS } from "@/lib/rail-collapse";
import { USER_MENU_ACTIONS } from "@/lib/user-menu";

const settingsPages = [
  "src/app/(app)/settings/page.tsx",
  "src/app/(app)/settings/loading.tsx",
  "src/app/(app)/settings/profile/page.tsx",
  "src/app/(app)/settings/you/page.tsx",
  "src/app/(app)/settings/social/page.tsx",
  "src/app/(app)/settings/education/page.tsx",
  "src/app/(app)/settings/aggregation/page.tsx",
  "src/app/(app)/settings/agreements/page.tsx",
  "src/app/(app)/settings/refer/page.tsx",
] as const;

const mercuryLayout = [
  "src/lib/account-sheet.ts",
  "src/lib/user-menu.ts",
  "src/components/chrome/user-menu.tsx",
] as const;

function src(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Adam Mercury register lock", () => {
  it("does not rewrite Settings/Profile page interiors — live Mercury stays", () => {
    for (const path of settingsPages) {
      const file = src(path);
      expect(file).not.toContain("@phosphor-icons/react");
      expect(file).not.toContain("84:46");
    }
    expect(ACCOUNT_SHEET_ITEMS).toBe(USER_MENU_ACTIONS);
    expect(USER_MENU_ACTIONS.map((item) => item.kind)[0]).toBe("profile");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)[1]).toBe("settings");
    expect(USER_MENU_ACTIONS.map((item) => item.kind)).not.toContain("workspace");
    expect(SETTINGS_HUB_NAV.map((item) => item.label)).toEqual([
      "You",
      "Social",
      "Education",
      "Aggregation",
    ]);
    expect(src("src/components/chrome/house-lead-chrome.tsx")).toContain("WorkspaceSwitcher");
    expect(src("src/components/chrome/app-shell.tsx")).toContain("HouseLeadChrome");
    expect(src("src/components/chrome/account-sheet.tsx")).not.toContain(
      'data-user-menu-item="workspace"',
    );
    expect(src("src/components/chrome/account-sheet.tsx")).not.toContain("AccountWorkspaceRow");
  });

  it("keeps shared account/settings layout tokens — Phosphor is glyph-only", () => {
    for (const path of mercuryLayout) {
      expect(src(path)).not.toContain("@phosphor-icons/react");
    }
    expect(SHEET_GROUP_CHEVRON_CLASS).toBe("size-4 shrink-0 text-ink-3");
    expect(SETTINGS_RAIL_CHEVRON_CLASS).toBe("size-4 shrink-0");
    expect(SETTINGS_RAIL_ITEM_CLASS).toContain("t-body");
    expect(SETTINGS_HEADER_BACK_CLASS).toContain("md:hidden");
    expect(RAIL_COLLAPSE_CHEVRON_ICON_CLASS).toBe("h-4 w-4");
    expect(src("src/components/chrome/account-sheet.tsx")).toContain(
      "className={SHEET_GROUP_CHEVRON_CLASS}",
    );
    expect(src("src/components/chrome/account-sheet.tsx")).toContain(
      'className="size-4 shrink-0"',
    );
    expect(src("src/components/chrome/settings-header-back.tsx")).toContain(
      "className={SETTINGS_RAIL_CHEVRON_CLASS}",
    );
  });

  it("measures node ids 75:5 / 75:132 / 75:2 / 61:2 — not discarded frame names", () => {
    const phosphor = src("src/lib/phosphor-icon.tsx");
    const nav = src("src/lib/nav.ts");
    const settingsRail = src("src/components/chrome/settings-rail.tsx");
    const sideNav = src("src/components/chrome/side-nav.tsx");
    expect(phosphor).toContain("75:5");
    expect(phosphor).toContain("75:132");
    expect(phosphor).toContain("75:2");
    expect(phosphor).toContain("61:2");
    expect(nav).toContain("75:5");
    expect(nav).toContain("61:2");
    expect(settingsRail).toContain("75:132");
    expect(sideNav).toContain("75:5");
    for (const file of [phosphor, nav, settingsRail, sideNav]) {
      expect(file).not.toContain("6:2");
      expect(file).not.toContain("6:3");
    }
    expect(phosphor).toContain("84:46");
    expect(phosphor).toContain("84:176");
    expect(phosphor).toContain("84:240");
    expect(phosphor).toContain("82:5");
    expect(phosphor).toContain("82:9");
    expect(phosphor).toContain("82:13");
    expect(src("src/components/chrome/app-shell.tsx")).toContain("CaretDoubleRight");
    expect(src("src/components/chrome/account-sheet.tsx")).toContain("SignOut");
    expect(src("src/components/chrome/mobile-nav.tsx")).toContain(
      'import { List } from "@phosphor-icons/react"',
    );
  });

  it("does not escalate Mercury past current — 16 Bold idle, no Social bleed", () => {
    expect(PHOSPHOR_CHROME_IDLE_WEIGHT).toBe("bold");
    expect(PHOSPHOR_CHROME_ACTIVE_WEIGHT).toBe("fill");
    expect(PHOSPHOR_CHROME_ICON_CLASS).toBe("size-4 shrink-0");

    const account = src("src/components/chrome/account-sheet.tsx");
    const settingsRail = src("src/components/chrome/settings-rail.tsx");
    const settingsBack = src("src/components/chrome/settings-header-back.tsx");
    for (const file of [account, settingsRail, settingsBack]) {
      expect(file).not.toContain("size-5");
      expect(file).not.toContain("size-6");
      expect(file).not.toContain("weight=\"fill\"");
      expect(file).not.toContain("#");
    }

    const nav = src("src/lib/nav.ts");
    expect(nav).toContain('family: "lucide"');
    expect(nav).toContain("SOCIAL_NAV");
    // Social chrome rematch is Social Figma V1 SocialIcon — this PR
    // does not rewrite Social interiors; it only swaps Aggregation glyphs.
    expect(src("src/components/social/social-header-search.tsx")).toContain("SocialIcon");
    expect(src("src/components/social/social-header-search.tsx")).not.toContain("lucide-react");
    expect(src("src/components/social/social-top-bar.tsx")).not.toContain("lucide-react");
    expect(src("src/app/(app)/social/profile/page.tsx")).not.toContain("AccountProfileForm");
  });
});
