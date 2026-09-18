import { describe, expect, it } from "vitest";

import { USER_MENU, USER_MENU_ACTIONS, USER_MENU_PHONE_ACTIONS } from "@/lib/user-menu";
import { ASSISTANT_NAME } from "@/lib/product";
import * as accountSheet from "./account-sheet";
import {
  ACCOUNT_MENU_DROPDOWN_ALIGN,
  ACCOUNT_MENU_DROPDOWN_DISMISS_CLASS,
  ACCOUNT_MENU_DROPDOWN_GAP,
  ACCOUNT_MENU_DROPDOWN_GROUP_CLASS,
  ACCOUNT_MENU_DROPDOWN_HEAD_CLASS,
  ACCOUNT_MENU_DROPDOWN_HOST_CLASS,
  ACCOUNT_MENU_DROPDOWN_IDENTITY_CLASS,
  ACCOUNT_MENU_DROPDOWN_LEFTOVER,
  ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS,
  ACCOUNT_MENU_DROPDOWN_PIN_CLASS,
  ACCOUNT_MENU_DROPDOWN_SCROLL_CLASS,
  ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS,
  ACCOUNT_MENU_DROPDOWN_WIDTH,
  accountMenuDropdownAlignEnd,
  ACCOUNT_SHEET,
  ACCOUNT_SHEET_ABSENT,
  ACCOUNT_SHEET_FOOTER_CLASS,
  ACCOUNT_SHEET_HEAD_CLASS,
  ACCOUNT_SHEET_HOST_CLASS,
  ACCOUNT_SHEET_ITEMS,
  ACCOUNT_SHEET_PHONE_ITEMS,
  ACCOUNT_SHEET_LEFTOVER,
  ACCOUNT_SHEET_LEFTOVER_CLASS,
  ACCOUNT_SHEET_LOGOUT_CLASS,
  ACCOUNT_SHEET_LOGOUT_STACK_CLASS,
  ACCOUNT_SHEET_PIN_CLASS,
  ACCOUNT_SHEET_SCROLL_CLASS,
  ACCOUNT_SHEET_STAGE_CLASS,
  ACCOUNT_SHEET_SURFACE_CLASS,
  ACCOUNT_SHEET_VERSION_CLASS,
  accountSheetIdentity,
  destinationClickClosesSheet,
} from "./account-sheet";

describe("account sheet lock", () => {
  it("uses USER_MENU_ACTIONS on desktop and phone extras on the sheet", () => {
    expect(ACCOUNT_SHEET_ITEMS).toBe(USER_MENU_ACTIONS);
    expect(ACCOUNT_SHEET_PHONE_ITEMS).toBe(USER_MENU_PHONE_ACTIONS);
    expect(ACCOUNT_SHEET_ITEMS.map((item) => item.kind)).toEqual([
      "profile",
      "settings",
    ]);
    expect(ACCOUNT_SHEET_ITEMS.map((item) => item.label)).toEqual([
      "Profile",
      "Settings",
    ]);
    expect(ACCOUNT_SHEET_PHONE_ITEMS.map((item) => item.kind)).toEqual([
      "profile",
      "settings",
      "askAssistant",
      "appearance",
    ]);
    expect(ACCOUNT_SHEET_ITEMS[0]?.kind).toBe("profile");
    expect(ACCOUNT_SHEET_ITEMS.map((item) => item.kind)).not.toContain("workspace");
    expect(USER_MENU.askAssistant).toBe(ASSISTANT_NAME);
  });

  it("wires only existing routes — Appearance is not a page", () => {
    const hrefs = ACCOUNT_SHEET_ITEMS.flatMap((item) => ("href" in item ? [item.href] : []));
    expect(hrefs).toEqual([
      USER_MENU.profileHref,
      USER_MENU.settingsHref,
    ]);
    expect(USER_MENU).not.toHaveProperty("appearanceHref");
    expect(hrefs).not.toContain("/account/appearance");
    expect(ACCOUNT_SHEET_PHONE_ITEMS.flatMap((item) => ("href" in item ? [item.href] : []))).toEqual([
      USER_MENU.profileHref,
      USER_MENU.settingsHref,
      USER_MENU.askAssistantHref,
    ]);
    expect(USER_MENU.askAssistantHref).toBe("/messages");
    expect(hrefs).not.toContain("/account/company");
    expect(hrefs.join(" ")).not.toMatch(/notifications|phone|job/i);
    expect(hrefs).toContain("/settings/profile");
    expect(hrefs).toContain("/settings");
    expect(hrefs).not.toContain("/account/profile");
    expect(hrefs.join(" ")).not.toContain("globalcontent.co");
  });

  it("does not dump the rail, Company, Phone, Job, or Adobe leftovers into the sheet", () => {
    const labels = ACCOUNT_SHEET_ITEMS.map((item) => item.label);
    expect(labels).not.toContain("Manage account");
    expect(ACCOUNT_SHEET).not.toHaveProperty("manage");
    expect(ACCOUNT_SHEET).not.toHaveProperty("group");
    for (const absent of ACCOUNT_SHEET_ABSENT) {
      expect(labels).not.toContain(absent);
    }
  });

  it("locks the 544:561 / 537:557 surface: 32 clear under the bar, 32 bottom, sides 24", () => {
    expect(ACCOUNT_SHEET_HOST_CLASS).toContain("justify-end");
    expect(ACCOUNT_SHEET_HOST_CLASS).not.toContain("md:flex-row");
    expect(ACCOUNT_SHEET_HOST_CLASS).not.toContain("md:items-end");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).toContain("h-auto");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).toContain("max-h-[90dvh]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS.split(" ")).not.toContain("h-[90dvh]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).toContain("px-[var(--space-6)]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).not.toContain("gap-[var(--space-6)]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).toContain("pb-[var(--space-8)]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).not.toContain("pb-[var(--space-12)]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).toContain("pt-[calc(4px+var(--space-8))]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS.split(" ")).not.toContain("p-[var(--space-6)]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).toContain("app-sheet-rise");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).not.toContain("md:w-[390px]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).not.toContain("w-[264px]");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).not.toContain("w-[277px]");
    expect(ACCOUNT_SHEET_HEAD_CLASS).toContain("min-h-12");
    expect(ACCOUNT_SHEET_HEAD_CLASS).toContain("justify-between");
    expect(ACCOUNT_SHEET_HEAD_CLASS).toContain("items-center");
    expect(ACCOUNT_SHEET_STAGE_CLASS).toContain("gap-[var(--space-6)]");
    expect(ACCOUNT_SHEET_STAGE_CLASS).toContain("min-h-0");
    expect(ACCOUNT_SHEET_STAGE_CLASS).not.toContain("flex-1");
    expect(ACCOUNT_SHEET_SCROLL_CLASS).not.toContain("flex-1");
    expect(ACCOUNT_SHEET_SCROLL_CLASS).toContain("min-h-0");
    expect(ACCOUNT_SHEET_SCROLL_CLASS).not.toContain("min-h-[var(--space-12)]");
    expect(ACCOUNT_SHEET_SCROLL_CLASS).toContain("overflow-y-auto");
    expect(ACCOUNT_SHEET_SCROLL_CLASS).toContain("overscroll-contain");
    expect(ACCOUNT_SHEET_LEFTOVER).toBe(48);
    expect(ACCOUNT_SHEET_LEFTOVER).toBe(ACCOUNT_MENU_DROPDOWN_LEFTOVER);
    expect(ACCOUNT_SHEET_LEFTOVER_CLASS).toBe(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS);
    expect(ACCOUNT_SHEET_LEFTOVER_CLASS).toContain("h-[var(--space-12)]");
    expect(ACCOUNT_SHEET_LEFTOVER_CLASS).toContain("shrink-0");
    expect(ACCOUNT_SHEET_LEFTOVER_CLASS).not.toContain("flex-1");
    expect(ACCOUNT_SHEET_LEFTOVER_CLASS).not.toContain("h-[48px]");
    expect(ACCOUNT_SHEET_LEFTOVER_CLASS).not.toMatch(/h-\[\d+px\]/);
    expect(ACCOUNT_SHEET_SURFACE_CLASS).toContain("overflow-hidden");
    expect(ACCOUNT_SHEET_SURFACE_CLASS).not.toContain("overflow-y-auto");
    expect(ACCOUNT_SHEET_LOGOUT_CLASS).toContain("text-accent");
    expect(ACCOUNT_SHEET_LOGOUT_CLASS).not.toContain("text-ink");
    expect(ACCOUNT_SHEET_PIN_CLASS).toContain("gap-[var(--space-6)]");
    expect(ACCOUNT_SHEET_PIN_CLASS).not.toContain("gap-[var(--space-12)]");
    expect(ACCOUNT_SHEET_PIN_CLASS).toContain("shrink-0");
    expect(ACCOUNT_SHEET_LOGOUT_STACK_CLASS).toBe("flex w-full shrink-0 flex-col");
    expect(ACCOUNT_SHEET_LOGOUT_STACK_CLASS).not.toContain("gap-");
    expect(ACCOUNT_SHEET_LOGOUT_STACK_CLASS).not.toContain("hairline");
  });

  it("locks the 629:795 desktop dropdown to a 264 content hug — leftover 48", () => {
    expect(ACCOUNT_MENU_DROPDOWN_WIDTH).toBe(264);
    expect(ACCOUNT_MENU_DROPDOWN_HOST_CLASS).toBe("fixed inset-0 z-50");
    expect(ACCOUNT_MENU_DROPDOWN_HOST_CLASS).not.toContain("justify-end");
    expect(ACCOUNT_MENU_DROPDOWN_HOST_CLASS).not.toContain("h-dvh");
    expect(ACCOUNT_MENU_DROPDOWN_DISMISS_CLASS).toBe("absolute inset-0");
    expect(ACCOUNT_MENU_DROPDOWN_DISMISS_CLASS).not.toContain("bg-ink");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("h-auto");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("w-[264px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toMatch(/h-\[\d+px\]/);
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("min-h");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("h-[522px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("h-[570px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("h-[672px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("min-h-[672px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("min-h-[426px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("min-h-[384px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("h-[384px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("w-[384px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("rounded-[12px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("border-hairline");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("shadow-none");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toMatch(/shadow-(?:sm|md|lg)|elevation/);
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("px-[var(--space-6)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("pb-[var(--space-6)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("pt-[calc(4px+var(--space-6))]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("gap-[var(--space-6)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("px-[var(--space-4)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("pb-[var(--space-4)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("gap-[var(--space-4)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).toContain("overflow-hidden");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("top-[calc(var(--header-height)+var(--space-2))]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("right-[var(--content-inset)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("--header-height");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("--content-inset");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS.split(" ")).not.toContain("p-[var(--space-6)]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("w-[277px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("h-[90dvh]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("md:w-[390px]");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("app-sheet-rise");
    expect(ACCOUNT_MENU_DROPDOWN_HEAD_CLASS).toContain("flex-col");
    expect(ACCOUNT_MENU_DROPDOWN_HEAD_CLASS).not.toContain("justify-between");
    expect(ACCOUNT_MENU_DROPDOWN_IDENTITY_CLASS).toContain("flex-col");
    expect(ACCOUNT_MENU_DROPDOWN_IDENTITY_CLASS).toContain("break-words");
    expect(ACCOUNT_MENU_DROPDOWN_IDENTITY_CLASS).not.toContain("truncate");
    expect(ACCOUNT_MENU_DROPDOWN_IDENTITY_CLASS).not.toContain("ellipsis");
    expect(ACCOUNT_MENU_DROPDOWN_GROUP_CLASS).toContain("gap-[var(--space-6)]");
    expect(ACCOUNT_MENU_DROPDOWN_GROUP_CLASS).not.toContain("gap-[var(--space-4)]");
    expect(ACCOUNT_MENU_DROPDOWN_PIN_CLASS).not.toContain("mt-");
    expect(ACCOUNT_MENU_DROPDOWN_PIN_CLASS).toContain("gap-[var(--space-6)]");
    expect(ACCOUNT_MENU_DROPDOWN_PIN_CLASS).not.toContain("gap-[var(--space-12)]");
    expect(ACCOUNT_MENU_DROPDOWN_PIN_CLASS).not.toContain("hairline");
    expect(ACCOUNT_MENU_DROPDOWN_SCROLL_CLASS).toContain("shrink-0");
    expect(ACCOUNT_MENU_DROPDOWN_SCROLL_CLASS).not.toContain("flex-1");
    expect(ACCOUNT_MENU_DROPDOWN_SCROLL_CLASS).not.toContain("min-h-[var(--space-12)]");
    expect(ACCOUNT_MENU_DROPDOWN_SCROLL_CLASS).not.toContain("overflow-y-auto");
    expect(ACCOUNT_MENU_DROPDOWN_SURFACE_CLASS).not.toContain("h-[48px]");
    expect(accountSheet).not.toHaveProperty("ACCOUNT_MENU_DROPDOWN_HEIGHT");
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER).toBe(48);
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS).toContain("h-[var(--space-12)]");
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS).toContain("shrink-0");
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS).not.toMatch(/h-\[\d+px\]/);
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS).not.toContain("h-[48px]");
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS).not.toContain("min-h");
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS).not.toContain("flex-1");
    expect(ACCOUNT_MENU_DROPDOWN_LEFTOVER_CLASS).not.toContain("min-h-[134px]");
  });

  it("keeps phone Appearance tokens and no desktop flyout align", () => {
    expect(accountSheet).toHaveProperty("ACCOUNT_MENU_APPEARANCE_ROW_CLASS");
    expect(accountSheet).toHaveProperty("ACCOUNT_SHEET_APPEARANCE_COPY_CLASS");
    expect(accountSheet).not.toHaveProperty("ACCOUNT_MENU_APPEARANCE_WASH_CLASS");
    expect(accountSheet).not.toHaveProperty("ACCOUNT_MENU_APPEARANCE_FLYOUT_CLASS");
    expect(accountSheet).not.toHaveProperty("accountMenuAppearanceFlyoutAlign");
    expect(accountSheet).not.toHaveProperty("accountMenuAppearanceFlyoutRight");
    expect(ACCOUNT_SHEET_ABSENT).not.toContain("Appearance");
  });

  it("docks the desktop menu align-end to the avatar with 8px under the trigger", () => {
    const trigger = { bottom: 44, right: 800 };
    const align = accountMenuDropdownAlignEnd(trigger, 1000);
    const menuRight = 1000 - Number.parseFloat(align.right);

    expect(ACCOUNT_MENU_DROPDOWN_ALIGN).toBe("end");
    expect(ACCOUNT_MENU_DROPDOWN_GAP).toBe("var(--space-2)");
    expect(align.top).toBe("calc(44px + var(--space-2))");
    expect(align.right).toBe("200px");
    expect(menuRight).toBe(trigger.right);
    expect(align.right).not.toBe("48px");
    expect(align.top).not.toContain("--header-height");
    expect(align.right).not.toContain("--content-inset");
  });

  it("locks the footer on both menus to 13 Regular / 16 — version tertiary, Legal parked", () => {
    expect(ACCOUNT_SHEET_FOOTER_CLASS).toContain("h-4");
    expect(ACCOUNT_SHEET_VERSION_CLASS).toContain("t-body-sm");
    expect(ACCOUNT_SHEET_VERSION_CLASS).not.toContain("font-normal");
    expect(ACCOUNT_SHEET_VERSION_CLASS).toContain("leading-4");
    expect(ACCOUNT_SHEET_VERSION_CLASS).toContain("text-ink-3");
    expect(accountSheet).not.toHaveProperty("ACCOUNT_SHEET_LEGAL_CLASS");
    expect(ACCOUNT_SHEET_ABSENT).toContain("Legal");
    expect(ACCOUNT_SHEET_ABSENT).not.toContain("Appearance");
  });
});

describe("account sheet identity", () => {
  it("keeps name and email fields without dashes when empty", () => {
    const empty = accountSheetIdentity("");
    expect(empty.avatarInitial).toBe("?");
    expect(empty.photoUrl).toBeNull();
    expect(empty.name).toBe("");
    expect(empty.email).toBe("");
    expect(empty.name).not.toBe("—");
    expect(empty.email).not.toBe("—");
  });

  it("shows the real email and an empty name — never a local-part invention or dash", () => {
    const email = "jane.doe@studio.com";
    const panel = accountSheetIdentity(email);
    expect(panel.name).toBe("");
    expect(panel.email).toBe(email);
    expect(panel.avatarInitial).toBe("J");
    expect(panel.name).not.toBe("Jane Doe");
    expect(panel.name).not.toBe("jane.doe");
    expect(panel.name).not.toBe("—");
  });

  it("shows a name only when the caller already has one", () => {
    const named = accountSheetIdentity("ada@example.com", "Ada Lovelace");
    expect(named.name).toBe("Ada Lovelace");
    expect(named.email).toBe("ada@example.com");
    expect(named.avatarInitial).toBe("A");
    expect(named.photoUrl).toBeNull();
    expect(accountSheetIdentity("ada@example.com", "   ")).toEqual(
      accountSheetIdentity("ada@example.com"),
    );
  });

  it("carries the signed face when one exists and ignores a blank URL", () => {
    const withFace = accountSheetIdentity(
      "ada@example.com",
      "Ada Lovelace",
      "https://s3.example/signed-avatar",
    );
    expect(withFace.photoUrl).toBe("https://s3.example/signed-avatar");
    expect(withFace.avatarInitial).toBe("A");
    expect(accountSheetIdentity("ada@example.com", null, "   ").photoUrl).toBeNull();
    expect(accountSheetIdentity("ada@example.com", null, null).photoUrl).toBeNull();
  });
});

describe("account sheet destination close", () => {
  it("closes immediately only on the same href", () => {
    expect(destinationClickClosesSheet("/settings/profile", "/settings/profile")).toBe(true);
    expect(destinationClickClosesSheet("/settings/education", "/settings/education")).toBe(true);
    expect(destinationClickClosesSheet("/settings/profile", "/settings/you")).toBe(false);
    expect(destinationClickClosesSheet("/", "/settings/aggregation")).toBe(false);
    expect(destinationClickClosesSheet("/help", "/help")).toBe(true);
    expect(destinationClickClosesSheet("/settings/profile", "/help")).toBe(false);
  });
});
