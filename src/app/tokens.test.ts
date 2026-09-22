import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

function extractBlock(css: string, selector: string): string {
  const marker = `${selector} {`;
  const start = css.indexOf(marker);
  if (start < 0) throw new Error(`missing ${selector}`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(start, i + 1);
    }
  }
  throw new Error(`unclosed ${selector}`);
}

describe("house accent — one token, mode flip", () => {
  const light = extractBlock(tokens, ":root");
  const dark = extractBlock(tokens, ".dark");

  it("keeps Sporty Blue on light :root", () => {
    expect(light).toMatch(/--accent:\s*#1769ff;/);
    expect(light).toMatch(/--accent-contrast:\s*#ffffff;/);
    expect(light).toContain("color-mix(in srgb, var(--accent) 10%, var(--surface))");
    expect(light).not.toMatch(/#70b5f9/i);
    expect(light).not.toMatch(/#3ea6ff/i);
  });

  it("flips dark --accent to LinkedIn soft and ink contrast", () => {
    // Adam lock 2026-09-22. White on #70b5f9 is 2.17:1 (fails AA).
    // #0A0B0D on the fill is 9.06:1. Canvas #050835 stays.
    expect(dark).toMatch(/--accent:\s*#70b5f9;/);
    expect(dark).toMatch(/--accent-contrast:\s*#0A0B0D;/);
    expect(dark).toMatch(/--bg:\s*#050835;/);
    expect(dark).toMatch(/--surface:\s*#1e2126;/);
    expect(dark).not.toMatch(/--accent:\s*#1769ff;/);
    expect(dark).not.toMatch(/--accent:\s*#3ea6ff;/i);
    expect(dark).not.toMatch(/--accent-wash:/);
    expect(tokens.match(/--accent:/g)).toHaveLength(2);
  });
});
