import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const layoutSrc = readFileSync(join(here, "layout.tsx"), "utf8");

describe("SettingsLayout", () => {
  it("wires one pane back so every Settings subpage inherits it", () => {
    expect(layoutSrc).toContain("SettingsHeaderBack");
    expect(layoutSrc).toContain('when="pane"');
    expect(layoutSrc).toContain("{children}");
    expect(layoutSrc).not.toContain("SettingsRail");
    expect(layoutSrc).not.toContain("SettingsHubList");
    expect(layoutSrc).not.toContain("SettingsLocalNav");
    expect(layoutSrc).not.toContain("/settings/profile");
    expect(layoutSrc).not.toContain("/settings/organization");
    expect(layoutSrc).not.toContain("/settings/preferences");
  });
});
