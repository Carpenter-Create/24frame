import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { NAV, SOCIAL_NAV } from "@/lib/nav";
import { NavGlyph } from "./nav-glyph";

const src = readFileSync("src/components/chrome/nav-glyph.tsx", "utf8");

describe("NavGlyph", () => {
  it("renders Aggregation Phosphor Fill when active and Bold when idle", () => {
    const active = renderToStaticMarkup(<NavGlyph item={NAV[0]} active />);
    const idle = renderToStaticMarkup(<NavGlyph item={NAV[0]} active={false} />);
    expect(active).not.toBe(idle);
    expect(active).toContain('fill="currentColor"');
    expect(idle).toContain('fill="currentColor"');
    expect(active).not.toContain("lucide-");
    expect(idle).not.toContain("lucide-");
    expect(active).not.toContain("stroke-width");
    expect(src).toContain("PhosphorChromeIcon");
    expect(src).toContain('item.family === "lucide"');
  });

  it("falls back to Lucide for SOCIAL_NAV family items", () => {
    const html = renderToStaticMarkup(<NavGlyph item={SOCIAL_NAV[0]} active />);
    expect(html).toContain("lucide-");
    expect(html).toContain('stroke-width="1.33"');
    expect(src).toContain("strokeWidth={1.33}");
  });
});
