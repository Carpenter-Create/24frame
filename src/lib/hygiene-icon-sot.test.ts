import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("one icon SoT (P2-2 rematch)", () => {
  it("drops lucide-react; house Phosphor is the only icon package", () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.["lucide-react"]).toBeUndefined();
    expect(pkg.devDependencies?.["lucide-react"]).toBeUndefined();
    expect(pkg.dependencies?.["@phosphor-icons/react"]).toBeTruthy();

    const nav = readFileSync("src/lib/nav.ts", "utf8");
    expect(nav).not.toContain("lucide-react");
    expect(nav).not.toContain('family: "lucide"');
    expect(nav).toContain('family: "phosphor"');

    const glyph = readFileSync("src/components/chrome/nav-glyph.tsx", "utf8");
    expect(glyph).not.toContain("lucide");
    expect(glyph).toContain("PhosphorChromeIcon");
  });
});
