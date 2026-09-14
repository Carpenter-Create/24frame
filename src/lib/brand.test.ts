import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BrandEmblem } from "@/components/chrome/brand-emblem";
import {
  BRAND_CORNER_FILL_DARK,
  BRAND_CORNER_FILL_LIGHT,
  BRAND_EMBLEM_CORNER_BR_POINTS,
  BRAND_EMBLEM_CORNER_TL_POINTS,
  BRAND_EMBLEM_FOUR_DOT_PATH,
  BRAND_EMBLEM_FOUR_POINTS,
  BRAND_EMBLEM_HEIGHT_PX,
  BRAND_EMBLEM_SRC,
  BRAND_EMBLEM_TWO_PATH,
  BRAND_EMBLEM_VIEWBOX,
  BRAND_ICON_SRC,
  BRAND_ICON_TILE_FILL,
  BRAND_ICON_VIEWBOX,
  BRAND_MARK_FILL,
} from "./brand";

const emblemSvg = readFileSync("public/brand/24frame-emblem.svg", "utf8");
const iconSvg = readFileSync("public/brand/24frame-icon.svg", "utf8");
const appIconSvg = readFileSync("src/app/icon.svg", "utf8");
const appleIconSvg = readFileSync("src/app/apple-icon.svg", "utf8");
const layoutSrc = readFileSync("src/app/layout.tsx", "utf8");
const manifestSrc = readFileSync("src/app/manifest.ts", "utf8");
const shellSrc = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const emblemSrc = readFileSync("src/components/chrome/brand-emblem.tsx", "utf8");

describe("Asset 8 emblem + Asset 10 icon lock", () => {
  it("commits Asset 8 bytes — wide viewBox, Sporty Blue 24, white corners, no tile", () => {
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
  });

  it("commits Asset 10 bytes — rounded square tile, blue mark, white corners", () => {
    expect(iconSvg).toContain(`viewBox="${BRAND_ICON_VIEWBOX}"`);
    expect(iconSvg).toContain(`fill: ${BRAND_ICON_TILE_FILL}`);
    expect(iconSvg).toContain("fill: #1769ff");
    expect(iconSvg).toContain("fill: #fff");
    expect(iconSvg).toContain('rx="92.12"');
    expect(iconSvg).toContain('ry="92.12"');
    expect(iconSvg).toBe(appIconSvg);
    expect(iconSvg).toBe(appleIconSvg);
    expect(BRAND_ICON_SRC).toBe("/brand/24frame-icon.svg");
  });

  it("inlines Asset 8 with currentColor corners and locked 24–28px height", () => {
    const html = renderToStaticMarkup(createElement(BrandEmblem));
    expect(html).toContain(`viewBox="${BRAND_EMBLEM_VIEWBOX}"`);
    expect(html).toContain(`height="${BRAND_EMBLEM_HEIGHT_PX}"`);
    expect(html).toContain(`fill="${BRAND_MARK_FILL}"`);
    expect(html).toContain('fill="currentColor"');
    expect(html).toContain("text-ink");
    expect(html).toContain("dark:text-accent-contrast");
    expect(html).toContain(BRAND_EMBLEM_TWO_PATH);
    expect(html).not.toContain("<rect");
    expect(html).not.toContain(BRAND_ICON_TILE_FILL);
    expect(BRAND_EMBLEM_HEIGHT_PX).toBeGreaterThanOrEqual(24);
    expect(BRAND_EMBLEM_HEIGHT_PX).toBeLessThanOrEqual(28);
    expect(BRAND_MARK_FILL).toBe("#1769FF");
    expect(BRAND_CORNER_FILL_LIGHT).toBe("#14171A");
    expect(BRAND_CORNER_FILL_DARK).toBe("#fff");
    expect(emblemSrc).not.toContain("wordmark");
    expect(emblemSrc).not.toContain("24frame-wordmark");
    expect(emblemSrc).not.toContain("rounded-[");
  });

  it("wires the rail chip to emblem-only home and Asset 10 favicon/apple/PWA", () => {
    expect(shellSrc).toContain("<BrandEmblem />");
    expect(shellSrc).toContain("data-brand-emblem");
    expect(shellSrc).toContain("workspaceHome(workspace)");
    expect(shellSrc).toContain("aria-label={PRODUCT_NAME}");
    expect(shellSrc).not.toContain("{PRODUCT_NAME}</span>");
    expect(shellSrc).not.toContain("24frame-wordmark");
    expect(shellSrc).not.toContain("BrandWordmark");
    expect(layoutSrc).toContain("BRAND_ICON_SRC");
    expect(layoutSrc).toContain("icons:");
    expect(manifestSrc).toContain("BRAND_ICON_SRC");
    expect(manifestSrc).toContain('type: "image/svg+xml"');
  });
});
