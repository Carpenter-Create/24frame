import { existsSync, readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BrandLogo } from "@/components/chrome/brand-logo";
import {
  BRAND_CORNER_FILL_DARK,
  BRAND_CORNER_FILL_LIGHT,
  BRAND_EMBLEM_CORNER_BR_POINTS,
  BRAND_EMBLEM_CORNER_TL_POINTS,
  BRAND_EMBLEM_FOUR_DOT_PATH,
  BRAND_EMBLEM_FOUR_POINTS,
  BRAND_EMBLEM_SRC,
  BRAND_EMBLEM_TWO_PATH,
  BRAND_EMBLEM_VIEWBOX,
  BRAND_ICON_SIZE,
  BRAND_ICON_SRC,
  BRAND_ICON_TILE_FILL,
  BRAND_ICON_TYPE,
  BRAND_ICON_VIEWBOX,
  BRAND_LOGO_DARK_SRC,
  BRAND_LOGO_HEIGHT_PX,
  BRAND_LOGO_LIGHT_SRC,
  BRAND_LOGO_VIEWBOX,
  BRAND_MARK_FILL,
} from "./brand";

const lightLogoSvg = readFileSync("public/brand/24frame-logo-light.svg", "utf8");
const darkLogoSvg = readFileSync("public/brand/24frame-logo-dark.svg", "utf8");
const emblemSvg = readFileSync("public/brand/24frame-emblem.svg", "utf8");
const iconSvg = readFileSync("public/brand/24frame-icon.svg", "utf8");
const faviconPng = readFileSync("public/brand/24frame-favicon.png");
const appIconPng = readFileSync("src/app/icon.png");
const appleIconPng = readFileSync("src/app/apple-icon.png");
const layoutSrc = readFileSync("src/app/layout.tsx", "utf8");
const manifestSrc = readFileSync("src/app/manifest.ts", "utf8");
const shellSrc = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const leadSrc = readFileSync("src/components/chrome/house-lead-chrome.tsx", "utf8");
const logoSrc = readFileSync("src/components/chrome/brand-logo.tsx", "utf8");
const topBarSrc = readFileSync("src/components/social/social-top-bar.tsx", "utf8");

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

describe("full 24Frame wordmark header lock", () => {
  it("commits light + dark colored wordmark SVGs", () => {
    expect(existsSync("public/brand/24frame-logo-light.svg")).toBe(true);
    expect(existsSync("public/brand/24frame-logo-dark.svg")).toBe(true);
    expect(lightLogoSvg).toContain(`viewBox="${BRAND_LOGO_VIEWBOX}"`);
    expect(lightLogoSvg).toContain("fill: #1769ff");
    expect(lightLogoSvg).not.toContain("fill: #fff");
    expect(darkLogoSvg).toContain(`viewBox="${BRAND_LOGO_VIEWBOX}"`);
    expect(darkLogoSvg).toContain("fill: #1769ff");
    expect(darkLogoSvg).toContain("fill: #fff");
    expect(BRAND_LOGO_LIGHT_SRC).toBe("/brand/24frame-logo-light.svg");
    expect(BRAND_LOGO_DARK_SRC).toBe("/brand/24frame-logo-dark.svg");
    expect(BRAND_LOGO_HEIGHT_PX).toBeGreaterThanOrEqual(20);
    expect(BRAND_LOGO_HEIGHT_PX).toBeLessThanOrEqual(28);
    expect(BRAND_MARK_FILL).toBe("#1769FF");
  });

  it("renders one shared theme-aware BrandLogo — light + dark imgs", () => {
    const html = renderToStaticMarkup(createElement(BrandLogo));
    expect(html).toContain(BRAND_LOGO_LIGHT_SRC);
    expect(html).toContain(BRAND_LOGO_DARK_SRC);
    expect(html).toContain('data-brand-logo-mark="light"');
    expect(html).toContain('data-brand-logo-mark="dark"');
    expect(html).toContain("dark:hidden");
    expect(html).toContain("dark:block");
    expect(html).toContain("h-5");
    expect(html).toContain("md:h-6");
    expect(html).toContain("w-auto");
    expect(logoSrc).toContain("BRAND_LOGO_LIGHT_SRC");
    expect(logoSrc).toContain("BRAND_LOGO_DARK_SRC");
    expect(logoSrc).not.toContain("24frame-emblem");
  });

  it("wires house lead chrome to BrandLogo — same SoT, no workspace forks", () => {
    expect(leadSrc).toContain("<BrandLogo />");
    expect(leadSrc).toContain("data-brand-emblem");
    expect(leadSrc).toContain("workspaceHome(workspace)");
    expect(leadSrc).toContain("aria-label={PRODUCT_NAME}");
    expect(leadSrc).not.toContain("BrandEmblem");
    expect(leadSrc).not.toContain("24frame-emblem");
    expect(leadSrc).not.toContain("BrandWordmark");
    expect(shellSrc).not.toContain("BrandLogo");
    expect(shellSrc).not.toContain("24frame-logo-");
    expect(shellSrc).not.toContain("{PRODUCT_NAME}</span>");
    expect(shellSrc).not.toContain("BrandWordmark");
    expect(topBarSrc).not.toContain("BrandLogo");
    expect(topBarSrc).not.toContain("24frame-logo-");
    expect(layoutSrc).toContain("BRAND_ICON_SRC");
    expect(layoutSrc).toContain("BRAND_ICON_TYPE");
    expect(layoutSrc).toContain("BRAND_ICON_SIZE");
    expect(layoutSrc).toContain("icons:");
    expect(manifestSrc).toContain("BRAND_ICON_SRC");
    expect(manifestSrc).toContain("BRAND_ICON_TYPE");
    expect(manifestSrc).toContain("BRAND_ICON_SIZE");
  });
});

describe("archived Asset 8 emblem + Adam favicon PNG lock", () => {
  it("keeps Asset 8 bytes archived and unwired from lead chrome", () => {
    expect(emblemSvg).toContain(`viewBox="${BRAND_EMBLEM_VIEWBOX}"`);
    expect(emblemSvg).toContain("fill: #1769ff");
    expect(emblemSvg).toContain("fill: #fff");
    expect(emblemSvg).not.toContain(BRAND_ICON_TILE_FILL);
    expect(emblemSvg).not.toContain("<rect");
    expect(emblemSvg).toContain(BRAND_EMBLEM_TWO_PATH);
    expect(emblemSvg).toContain(BRAND_EMBLEM_FOUR_POINTS);
    expect(emblemSvg).toContain(BRAND_EMBLEM_FOUR_DOT_PATH);
    expect(emblemSvg).toContain(BRAND_EMBLEM_CORNER_BR_POINTS);
    expect(emblemSvg).toContain(BRAND_EMBLEM_CORNER_TL_POINTS);
    expect(BRAND_EMBLEM_SRC).toBe("/brand/24frame-emblem.svg");
    expect(leadSrc).not.toContain(BRAND_EMBLEM_SRC);
    expect(existsSync("src/components/chrome/brand-emblem.tsx")).toBe(false);
    expect(BRAND_CORNER_FILL_LIGHT).toBe("#14171A");
    expect(BRAND_CORNER_FILL_DARK).toBe("#fff");
  });

  it("keeps Asset 10 SVG archived and unwired — favicon is the 1080 PNG", () => {
    expect(iconSvg).toContain(`viewBox="${BRAND_ICON_VIEWBOX}"`);
    expect(iconSvg).toContain(`fill: ${BRAND_ICON_TILE_FILL}`);
    expect(iconSvg).toContain("fill: #1769ff");
    expect(iconSvg).toContain("fill: #fff");
    expect(iconSvg).toContain('rx="92.12"');
    expect(iconSvg).toContain('ry="92.12"');
    expect(layoutSrc).not.toContain("24frame-icon.svg");
    expect(manifestSrc).not.toContain("24frame-icon.svg");
    expect(layoutSrc).not.toContain("image/svg+xml");
    expect(manifestSrc).not.toContain("image/svg+xml");
  });

  it("commits Adam favicon PNG — 1080 source, identical apple/PWA copies", () => {
    expect(faviconPng.subarray(0, 8).equals(PNG_SIG)).toBe(true);
    expect(faviconPng.readUInt32BE(16)).toBe(1080);
    expect(faviconPng.readUInt32BE(20)).toBe(1080);
    expect(faviconPng.equals(appIconPng)).toBe(true);
    expect(faviconPng.equals(appleIconPng)).toBe(true);
    expect(BRAND_ICON_SRC).toBe("/brand/24frame-favicon.png");
    expect(BRAND_ICON_TYPE).toBe("image/png");
    expect(BRAND_ICON_SIZE).toBe("1080x1080");
  });
});
