import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { SOCIAL, SOCIAL_ROUTES, socialCreateHref } from "./social";
import { SOCIAL_CREATE_MENU_INTENTS, socialCreateMenuIntent } from "./social-create-menu";

describe("Social Create menu intents", () => {
  it("locks Photo · Video · Write · Go live onto existing compose paths", () => {
    expect(SOCIAL_CREATE_MENU_INTENTS.map((intent) => intent.id)).toEqual([
      "photo",
      "video",
      "write",
      "live",
    ]);
    expect(SOCIAL_CREATE_MENU_INTENTS.map((intent) => intent.label)).toEqual([
      SOCIAL.create.photo,
      SOCIAL.create.video,
      SOCIAL.create.write,
      SOCIAL.create.goLive,
    ]);
    expect(socialCreateMenuIntent("photo")?.href).toBe(socialCreateHref("photo"));
    expect(socialCreateMenuIntent("video")?.href).toBe(socialCreateHref("video"));
    expect(socialCreateMenuIntent("write")?.href).toBe(socialCreateHref("text"));
    expect(socialCreateMenuIntent("live")?.href).toBe(SOCIAL_ROUTES.createLive);
    expect(SOCIAL.create.write).toBe("Write");
    expect(SOCIAL.create.goLive).toBe("Go live");
    expect(SOCIAL_ROUTES.createLive).toBe("/social/create/live");
  });

  it("keeps the menu Social-only and reuses MenuSurface", () => {
    const menu = readFileSync("src/components/social/social-create-menu.tsx", "utf8");
    const dests = readFileSync("src/components/chrome/house-phone-dest-chips.tsx", "utf8");
    const composer = readFileSync("src/components/social/social-home-composer.tsx", "utf8");
    const header = readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8");
    const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
    expect(menu).toContain("MenuSurfaceContent");
    expect(menu).toContain("MenuSurfaceItem");
    expect(menu).toContain("SOCIAL_CREATE_MENU_INTENTS");
    expect(menu).toContain('data-social-create-intent={intent.id}');
    expect(dests).toContain("SocialCreateMenu");
    expect(dests).toContain('data-social-create-menu="dest"');
    expect(composer).toContain("SocialCreateMenu");
    expect(composer).toContain("data-social-create-menu");
    expect(composer).toContain("hidden md:flex");
    expect(header).not.toContain("SocialCreateMenu");
    expect(shell).not.toContain("SocialCreateMenu");
    expect(menu).not.toMatch(/YouTube|Instagram|TikTok|Facebook|Meta/);
  });
});
