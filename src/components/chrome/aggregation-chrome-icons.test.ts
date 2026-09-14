import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rail = readFileSync("src/lib/nav.ts", "utf8");
const settingsRail = readFileSync("src/components/chrome/settings-rail.tsx", "utf8");
const settingsBack = readFileSync("src/components/chrome/settings-header-back.tsx", "utf8");
const collapse = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const account = readFileSync("src/components/chrome/account-sheet.tsx", "utf8");
const house = readFileSync("src/components/chrome/house.tsx", "utf8");
const mobile = readFileSync("src/components/chrome/mobile-nav.tsx", "utf8");
const messages = readFileSync("src/components/chrome/messages-app-header.tsx", "utf8");
const socialDock = readFileSync("src/components/social/social-mobile-dock.tsx", "utf8");

describe("Aggregation chrome Phosphor lock + Design miss list", () => {
  it("ships measured 75:5 / 75:132 Phosphor and leaves the miss list on Lucide", () => {
    expect(rail).toContain('family: "phosphor"');
    expect(rail).toContain("SquaresFour");
    expect(rail).toContain("FilmSlate");
    expect(rail).toContain("PaperPlaneTilt");
    expect(settingsRail).toContain("CaretLeft");
    expect(settingsBack).toContain("CaretLeft");
    expect(settingsRail).not.toContain("lucide-react");
    expect(settingsBack).not.toContain("lucide-react");

    expect(collapse).toContain('from "lucide-react"');
    expect(collapse).toContain("ChevronsLeft");
    expect(collapse).toContain("ChevronsRight");
    expect(account).toContain("ChevronLeft");
    expect(account).toContain("ChevronRight");
    expect(account).toContain("LogOut");
    expect(house).toContain('from "lucide-react"');
    expect(house).toContain("strokeWidth={1.33}");
    expect(mobile).toContain('import { Menu } from "lucide-react"');
    expect(messages).toContain('from "lucide-react"');
  });

  it("does not rewrite Social interiors", () => {
    expect(socialDock).toContain('from "lucide-react"');
    expect(socialDock).toContain("strokeWidth={1.33}");
    expect(rail).toContain('family: "lucide"');
    expect(rail).toContain("SOCIAL_NAV");
  });
});
