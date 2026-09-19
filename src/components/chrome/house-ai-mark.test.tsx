import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  HOUSE_AI_MARK_PATHS,
  HOUSE_AI_MARK_REGULAR_STROKE_WIDTH,
  HOUSE_AI_MARK_SRC,
  HOUSE_AI_MARK_VIEWBOX,
} from "@/lib/house-ai-mark";
import {
  HOUSE_HEADER_TRAILING_DESKTOP_CLASS,
  HOUSE_HEADER_TRAILING_PHONE_CLASS,
} from "@/lib/house-phone-shell";
import { PHOSPHOR_CHROME_ICON_CLASS } from "@/lib/phosphor-icon";
import { AskAssistantHeaderLink } from "./ask-assistant-header";
import { HouseAiMark } from "./house-ai-mark";

const svg = readFileSync("public/brand/24frame-ai-mark.svg", "utf8");
const primitiveSrc = readFileSync("src/components/chrome/house-ai-mark.tsx", "utf8");
const headerSrc = readFileSync("src/components/chrome/ask-assistant-header.tsx", "utf8");
const navSrc = readFileSync("src/lib/nav.ts", "utf8");
const glyphSrc = readFileSync("src/components/chrome/nav-glyph.tsx", "utf8");

describe("HouseAiMark", () => {
  it("commits Adam's three-sparkle cluster as the house AI asset", () => {
    expect(existsSync("public/brand/24frame-ai-mark.svg")).toBe(true);
    expect(HOUSE_AI_MARK_SRC).toBe("/brand/24frame-ai-mark.svg");
    expect(svg).toContain(`viewBox="${HOUSE_AI_MARK_VIEWBOX}"`);
    expect(svg).toContain('fill="#000"');
    expect(svg).not.toContain("<rect");
    expect(HOUSE_AI_MARK_PATHS).toHaveLength(3);
    for (const d of HOUSE_AI_MARK_PATHS) {
      expect(svg).toContain(`d="${d}"`);
    }
  });

  it("renders the same paths at chrome idle size with currentColor", () => {
    const html = renderToStaticMarkup(<HouseAiMark />);
    expect(html).toContain("data-house-ai-mark");
    expect(html).toContain('data-house-ai-mark-register="fill"');
    expect(html).toContain(`viewBox="${HOUSE_AI_MARK_VIEWBOX}"`);
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain("stroke-width");
    expect(html).toContain(PHOSPHOR_CHROME_ICON_CLASS);
    expect(html).toContain("size-4");
    expect(html).toContain("shrink-0");
    expect(html.match(/<path /g)?.length).toBe(3);
    for (const d of HOUSE_AI_MARK_PATHS) {
      expect(html).toContain(`d="${d}"`);
    }
    expect(primitiveSrc).toContain("PHOSPHOR_CHROME_ICON_CLASS");
    expect(primitiveSrc).not.toContain("Sparkle");
  });

  it("strokes the same paths at Regular optical for the phone header register", () => {
    expect(HOUSE_AI_MARK_REGULAR_STROKE_WIDTH).toBe((16 * 146) / 256);
    const html = renderToStaticMarkup(
      <HouseAiMark className={HOUSE_HEADER_TRAILING_PHONE_CLASS} register="stroke" />,
    );
    expect(html).toContain('data-house-ai-mark-register="stroke"');
    expect(html).toContain('fill="none"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain(`stroke-width="${HOUSE_AI_MARK_REGULAR_STROKE_WIDTH}"`);
    expect(html).toContain("size-6");
    expect(html).toContain("md:hidden");
    expect(html.match(/<path /g)?.length).toBe(3);
    for (const d of HOUSE_AI_MARK_PATHS) {
      expect(html).toContain(`d="${d}"`);
    }
    expect(html).not.toContain("Sparkle");
  });

  it("is the only 24Frame AI chrome glyph — header, rail, and mobile sheet", () => {
    expect(headerSrc).toContain("<HouseAiMark");
    expect(headerSrc).toContain('register="stroke"');
    expect(headerSrc).toContain('register="fill"');
    expect(headerSrc).not.toContain("Sparkle");
    expect(navSrc).toContain('family: "house-ai"');
    expect(navSrc).not.toContain("Sparkle");
    expect(glyphSrc).toContain("<HouseAiMark");
    expect(glyphSrc).not.toContain("Sparkle");

    const header = renderToStaticMarkup(<AskAssistantHeaderLink />);
    expect(header).toContain("data-ask-assistant-header");
    expect(header).toContain("data-house-ai-mark");
    expect(header).toContain(HOUSE_HEADER_TRAILING_PHONE_CLASS);
    expect(header).toContain(HOUSE_HEADER_TRAILING_DESKTOP_CLASS);
    expect(header).toContain("size-6");
    expect(header).toContain("md:size-4");
    expect(header).toContain('data-house-ai-mark-register="stroke"');
    expect(header).toContain('data-house-ai-mark-register="fill"');
    expect(header).not.toContain("lucide-");
    expect(headerSrc).toContain("HOUSE_HEADER_TRAILING_PHONE_CLASS");
    expect(headerSrc).toContain("HOUSE_HEADER_TRAILING_DESKTOP_CLASS");
  });
});
