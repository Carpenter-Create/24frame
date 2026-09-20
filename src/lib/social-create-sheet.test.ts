import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL, SOCIAL_ROUTES, socialCreateHref } from "./social";
import {
  SOCIAL_CREATE_SHEET_HOST_CLASS,
  SOCIAL_CREATE_SHEET_PRESENTATION,
  SOCIAL_CREATE_SHEET_SCRIM_CLASS,
  SOCIAL_CREATE_SHEET_SURFACE_CLASS,
  SOCIAL_CREATE_TILE_CLASS,
  SOCIAL_CREATE_TILE_ICON_CLASS,
  SOCIAL_CREATE_TILE_LABEL_CLASS,
  SOCIAL_CREATE_TILE_WELL_CLASS,
  SOCIAL_CREATE_TILES,
  SOCIAL_CREATE_TILES_CLASS,
  socialCreateTile,
} from "./social-create-sheet";
import { APP_SHEET_SURFACE_CLASS } from "./house-sheet";

describe("Social Create sheet SoT", () => {
  it("locks Photo · Video · Write · Go live onto existing compose paths", () => {
    expect(SOCIAL_CREATE_TILES.map((tile) => tile.id)).toEqual([
      "photo",
      "video",
      "write",
      "live",
    ]);
    expect(SOCIAL_CREATE_TILES.map((tile) => tile.label)).toEqual([
      SOCIAL.create.photo,
      SOCIAL.create.video,
      SOCIAL.create.write,
      SOCIAL.create.goLive,
    ]);
    expect(socialCreateTile("photo")?.href).toBe(socialCreateHref("photo"));
    expect(socialCreateTile("video")?.href).toBe(socialCreateHref("video"));
    expect(socialCreateTile("write")?.href).toBe(socialCreateHref("text"));
    expect(socialCreateTile("live")?.href).toBe(SOCIAL_ROUTES.createLive);
    expect(SOCIAL.create.title).toBe("Create");
    expect(SOCIAL.create.write).toBe("Write");
    expect(SOCIAL.create.goLive).toBe("Go live");
    expect(SOCIAL.create.close).toBe("Close");
    expect(SOCIAL_ROUTES.createLive).toBe("/social/create/live");
  });

  it("rises over a dimmed feed like iMessage New Message, with equal tiles inside", () => {
    expect(SOCIAL_CREATE_SHEET_PRESENTATION).toBe("imessage-new-message");
    expect(SOCIAL_CREATE_SHEET_HOST_CLASS).toContain("justify-end");
    expect(SOCIAL_CREATE_SHEET_HOST_CLASS).not.toContain("md:items-center");
    expect(SOCIAL_CREATE_SHEET_HOST_CLASS).not.toContain("md:justify-center");
    expect(SOCIAL_CREATE_SHEET_SURFACE_CLASS).toContain(APP_SHEET_SURFACE_CLASS);
    expect(SOCIAL_CREATE_SHEET_SURFACE_CLASS).toContain("app-sheet-rise");
    expect(SOCIAL_CREATE_SHEET_SURFACE_CLASS).toContain("bg-surface");
    expect(SOCIAL_CREATE_SHEET_SURFACE_CLASS).toContain("w-full");
    expect(SOCIAL_CREATE_SHEET_SURFACE_CLASS).not.toContain("backdrop-blur");
    expect(SOCIAL_CREATE_SHEET_SURFACE_CLASS).not.toContain("md:w-[min(28rem");
    expect(SOCIAL_CREATE_SHEET_SCRIM_CLASS).toContain("bg-ink/40");
    expect(SOCIAL_CREATE_SHEET_SCRIM_CLASS).toContain("app-sheet-scrim-fade");
    expect(SOCIAL_CREATE_SHEET_SCRIM_CLASS).not.toContain("backdrop-blur");
    expect(SOCIAL_CREATE_TILES_CLASS).toContain("grid-cols-2");
    expect(SOCIAL_CREATE_TILES_CLASS).toContain("min-[480px]:grid-cols-4");
    expect(SOCIAL_CREATE_TILES_CLASS).not.toContain("flex-col");
    expect(SOCIAL_CREATE_TILE_CLASS).toContain("flex-col");
    expect(SOCIAL_CREATE_TILE_CLASS).toContain("items-center");
    expect(SOCIAL_CREATE_TILE_CLASS).not.toContain("hover:bg");
    expect(SOCIAL_CREATE_TILE_CLASS).not.toContain("bg-accent");
    expect(SOCIAL_CREATE_TILE_CLASS).not.toContain("bg-surface-muted");
    expect(SOCIAL_CREATE_TILE_CLASS).not.toContain("border");
    expect(SOCIAL_CREATE_TILE_CLASS).not.toContain("shadow");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).toContain("bg-surface-muted");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).toContain("group-hover:bg-accent-wash");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).toContain("group-active:bg-accent-wash");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).toContain("transition-colors");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).toContain("rounded-[var(--radius-lg)]");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).not.toContain("border");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).not.toContain("rounded-full");
    expect(SOCIAL_CREATE_TILE_WELL_CLASS).not.toContain("shadow");
    expect(SOCIAL_CREATE_TILE_ICON_CLASS).toContain("group-hover:text-accent");
    expect(SOCIAL_CREATE_TILE_ICON_CLASS).toContain("group-active:text-accent");
    expect(SOCIAL_CREATE_TILE_ICON_CLASS).toContain("transition-colors");
    expect(SOCIAL_CREATE_TILE_LABEL_CLASS).toContain("whitespace-normal");
    expect(SOCIAL_CREATE_TILE_LABEL_CLASS).toContain("t-body-sm");
    expect(SOCIAL_CREATE_TILE_LABEL_CLASS).toContain("font-medium");
    expect(SOCIAL_CREATE_TILE_LABEL_CLASS).not.toContain("truncate");
    expect(SOCIAL_CREATE_TILE_LABEL_CLASS).not.toContain("t-label");
    expect(SOCIAL_CREATE_TILE_LABEL_CLASS).not.toContain("uppercase");
    expect(SOCIAL_CREATE_SHEET_SURFACE_CLASS).toContain("shadow-none");
    expect(SOCIAL_CREATE_SHEET_SCRIM_CLASS).not.toContain("bg-ink/60");
    expect(SOCIAL_CREATE_SHEET_SCRIM_CLASS).not.toContain("bg-ink/80");

    const dests = readFileSync("src/components/chrome/house-phone-bottom-nav.tsx", "utf8");
    const rail = readFileSync("src/components/chrome/side-nav.tsx", "utf8");
    const composer = readFileSync("src/components/social/social-home-composer.tsx", "utf8");
    const header = readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8");
    const switcher = readFileSync("src/components/chrome/workspace-switcher.tsx", "utf8");
    const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
    const sheet = readFileSync("src/components/social/social-create-sheet.tsx", "utf8");
    expect(dests).toContain("SocialCreateSheet");
    expect(dests).toContain('data-social-create-sheet="dest"');
    expect(dests).toContain("housePhoneDestIsCreate");
    expect(dests).not.toContain("SocialCreateMenu");
    expect(rail).toContain("SocialCreateSheet");
    expect(rail).toContain('data-social-create-sheet="dest"');
    expect(rail).toContain("isSocialCreateDest");
    expect(rail).not.toContain("SocialCreateMenu");
    expect(composer).toContain("SocialCreateSheet");
    expect(composer).toContain('data-social-create-sheet="composer"');
    expect(composer).not.toContain("SocialCreateMenu");
    expect(header).not.toContain("SocialCreateSheet");
    expect(header).not.toContain("SocialCreateMenu");
    expect(switcher).not.toContain("SocialCreateSheet");
    expect(shell).not.toContain("SocialCreateSheet");
    expect(sheet).toContain("SocialCreateTiles");
    expect(sheet).toContain("Close44");
    expect(sheet).toContain("SOCIAL.create.title");
    expect(sheet).toContain("data-social-create-sheet-presentation");
    expect(sheet).toContain("data-social-create-tile-well");
    expect(sheet).not.toContain("backdrop-blur");
    expect(sheet).not.toContain("frost");
    expect(sheet).not.toContain("MenuSurface");
    expect(sheet).not.toContain("DropdownMenu");
    expect(sheet).not.toContain("data-social-create-fab");
    expect(sheet).not.toMatch(/YouTube|Instagram|TikTok|Facebook|Meta/);

    const sot = readFileSync("src/lib/social-create-sheet.ts", "utf8");
    expect(sot).toContain("Coinbase institutional");
    expect(sot).toContain("Social media spine");
    expect(sot).toContain("Not Mercury-stiff");
    expect(sot).toContain("Not LinkedIn-grey");
    expect(sot).not.toContain("HOUSE_PHONE_BOTTOM_NAV_CHIP_CLASS");
  });
});
