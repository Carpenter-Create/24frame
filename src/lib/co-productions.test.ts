import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Camera, FilmSlate, FilmStrip, Handshake, VideoCamera } from "@phosphor-icons/react/ssr";

import { WORKSPACE_MODES } from "@/lib/workspace";

import {
  CO_PRODUCTIONS_HREF,
  CO_PRODUCTIONS_ICON,
  CO_PRODUCTIONS_LABEL,
  CO_PRODUCTIONS_PAGE,
  isCoProductionsPath,
} from "./co-productions";

describe("co-productions SoT", () => {
  it("locks the portal path and hyphenated Adam label", () => {
    expect(CO_PRODUCTIONS_HREF).toBe("/co-productions");
    expect(CO_PRODUCTIONS_LABEL).toBe("Co-Productions");
    expect(CO_PRODUCTIONS_PAGE.title).toBe(CO_PRODUCTIONS_LABEL);
    expect(CO_PRODUCTIONS_PAGE.synopsis).toContain("co-invested originals");
    expect(CO_PRODUCTIONS_PAGE.synopsis).toContain("inquiry form");
    expect(CO_PRODUCTIONS_PAGE.synopsis).not.toMatch(
      /seamless|frictionless|elevate|amplify|unleash|supercharge|game-changing/i,
    );
    expect(WORKSPACE_MODES).not.toContain("co-productions");
  });

  it("locks the chrome icon to Phosphor Handshake — deal, not camera", () => {
    expect(CO_PRODUCTIONS_ICON).toBe(Handshake);
    expect(CO_PRODUCTIONS_ICON).not.toBe(Camera);
    expect(CO_PRODUCTIONS_ICON).not.toBe(VideoCamera);
    expect(CO_PRODUCTIONS_ICON).not.toBe(FilmSlate);
    expect(CO_PRODUCTIONS_ICON).not.toBe(FilmStrip);

    const src = readFileSync("src/lib/co-productions.ts", "utf8");
    expect(src).toContain("Handshake");
    expect(src).toContain("Adam lock 2026-09-19");
    expect(src).not.toMatch(/\bCamera\b/);
    expect(src).not.toContain("VideoCamera");
    expect(src).not.toContain("FilmSlate");
    expect(src).not.toContain("FilmReel");
    expect(src).not.toContain("Clapperboard");
    expect(src).not.toContain("HandshakeSimple");
  });

  it("matches only /co-productions and its children", () => {
    expect(isCoProductionsPath("/co-productions")).toBe(true);
    expect(isCoProductionsPath("/co-productions/x")).toBe(true);
    expect(isCoProductionsPath("/home")).toBe(false);
    expect(isCoProductionsPath("/education")).toBe(false);
    expect(isCoProductionsPath("/settings")).toBe(false);
    expect(isCoProductionsPath("/coproductions")).toBe(false);
    expect(isCoProductionsPath("/co-production")).toBe(false);
  });

  it("keeps one Handshake SoT — no camera/film forks on chrome surfaces", () => {
    const phoneShell = readFileSync("src/lib/house-phone-shell.ts", "utf8");
    expect(phoneShell).toContain("CO_PRODUCTIONS_ICON");
    expect(phoneShell).toContain("icon: CO_PRODUCTIONS_ICON");
    expect(phoneShell).not.toMatch(/from ["']@phosphor-icons\/react["'].*Handshake|Handshake.*from ["']@phosphor-icons\/react/);
    expect(phoneShell).not.toMatch(/\b(Camera|VideoCamera|FilmSlate|FilmReel|Clapperboard|HandshakeSimple)\b/);

    const forks = [
      "src/components/chrome/house-phone-bottom-nav.tsx",
      "src/components/chrome/house-phone-dest-chips.tsx",
      "src/components/chrome/workspace-switcher.tsx",
      "src/lib/workspace-switcher.ts",
      "src/lib/overview.ts",
      "src/lib/settings.ts",
      "src/app/(app)/co-productions/page.tsx",
    ];
    for (const path of forks) {
      const src = readFileSync(path, "utf8");
      expect(src, path).not.toMatch(/icon:\s*(Handshake|HandshakeSimple|Camera|VideoCamera|FilmSlate|FilmStrip|FilmReel|Clapperboard)\b/);
    }
  });
});
