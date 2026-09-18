import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rail = readFileSync("src/lib/nav.ts", "utf8");
const settingsRail = readFileSync("src/components/chrome/settings-rail.tsx", "utf8");
const settingsBack = readFileSync("src/components/chrome/settings-header-back.tsx", "utf8");
const collapse = readFileSync("src/components/chrome/rail-collapse.tsx", "utf8");
const shell = readFileSync("src/components/chrome/app-shell.tsx", "utf8");
const account = readFileSync("src/components/chrome/account-sheet.tsx", "utf8");
const house = readFileSync("src/components/chrome/house.tsx", "utf8");
const dests = readFileSync("src/components/chrome/house-phone-dest-chips.tsx", "utf8");
const messages = readFileSync("src/components/chrome/messages-app-header.tsx", "utf8");
const socialComposer = readFileSync("src/components/social/social-home-composer.tsx", "utf8");
const leadSearch = readFileSync("src/components/chrome/house-lead-search.tsx", "utf8");
const themeToggle = readFileSync("src/components/theme-toggle.tsx", "utf8");

describe("Aggregation chrome Phosphor lock + Design miss list", () => {
  it("ships measured Phosphor glyphs only; leaves unmeasured chrome on Lucide", () => {
    expect(rail).toContain('family: "phosphor"');
    expect(rail).toContain("SquaresFour");
    expect(rail).toContain("FilmSlate");
    expect(rail).toContain("PaperPlaneTilt");
    expect(settingsBack).toContain("CaretLeft");
    expect(settingsRail).not.toContain("lucide-react");
    expect(settingsBack).not.toContain("lucide-react");

    expect(collapse).toContain('from "@phosphor-icons/react"');
    expect(collapse).toContain("CaretDoubleLeft");
    expect(collapse).toContain("CaretDoubleRight");
    expect(collapse).toContain("RAIL_COLLAPSE_CHEVRON_ICON_WEIGHT");
    expect(collapse).not.toContain("lucide-react");
    expect(collapse).not.toContain("ChevronsLeft");
    expect(collapse).not.toContain("ChevronsRight");
    expect(shell).toContain("<RailCollapse collapsed={collapsed} onToggle={toggle} />");
    expect(shell).not.toContain("lucide-react");
    expect(shell).not.toContain("ChevronsLeft");
    expect(shell).not.toContain("ChevronsRight");

    expect(account).toContain("CaretLeft");
    expect(account).toContain("CaretRight");
    expect(account).toContain("SignOut");
    expect(account).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(account).not.toContain("lucide-react");
    expect(account).not.toContain("ChevronLeft");
    expect(account).not.toContain("ChevronRight");
    expect(account).not.toContain("<LogOut");

    expect(house).toContain('from "@phosphor-icons/react"');
    expect(house).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(house).toContain('<X className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />');
    expect(house).not.toContain("lucide-react");
    expect(house).not.toContain("strokeWidth={1.33}");

    expect(dests).toContain("NavGlyph");
    expect(dests).toContain("SocialIcon");
    expect(dests).not.toContain("lucide-react");
    expect(dests).not.toContain("import { Menu }");
    expect(dests).not.toContain("import { List }");

    expect(messages).toContain('from "lucide-react"');

    expect(themeToggle).toContain('from "@phosphor-icons/react"');
    expect(themeToggle).toContain("Sun");
    expect(themeToggle).toContain("Moon");
    expect(themeToggle).toContain("PHOSPHOR_CHROME_IDLE_WEIGHT");
    expect(themeToggle).not.toContain("lucide-react");
    expect(themeToggle).not.toContain("strokeWidth");
    expect(themeToggle).not.toContain("stroke-width");
  });

  it("leaves Social interiors on Social V1 SocialIcon; SOCIAL_NAV family stays Lucide fallback", () => {
    expect(socialComposer).toContain("SocialIcon");
    expect(socialComposer).not.toContain('from "lucide-react"');
    expect(leadSearch).toContain("MagnifyingGlass");
    expect(leadSearch).not.toContain('from "lucide-react"');
    expect(leadSearch).not.toContain("SocialIcon");
    expect(rail).toContain('family: "lucide"');
    expect(rail).toContain("SOCIAL_NAV");
  });
});
